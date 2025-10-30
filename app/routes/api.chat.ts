import { type ActionFunctionArgs } from '@remix-run/node';
import { createDataStream } from 'ai';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { getAptosPromptEnhancer } from '~/lib/.server/aptos-prompt-enhancer';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

const logger = createScopedLogger('api.chat');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  // Add request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.error('Request timeout after 30 seconds');
  }, 30000); // 30 second timeout

  try {
    const { messages, files, promptId, contextOptimization, enabledTools, isAptosMode, enableExtendedThinking } = await request.json<{
      messages: Messages;
      files: any;
      promptId?: string;
      contextOptimization: boolean;
      enabledTools?: string[];
      isAptosMode?: boolean;
      enableExtendedThinking?: boolean;
    }>();

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

    // Enhance prompt with Aptos context if needed
    let enhancedMessages = messages;
    let aptosSystemPrompt = '';
    
    if (isAptosMode && messages.length > 0) {
      try {
        // Get OpenAI API key from environment
        const openaiApiKey = process.env.OPENAI_API_KEY || apiKeys.openai;
        
        // Note: Vectorize is Cloudflare-specific, using null for Vercel
        const vectorize = undefined;
        
        logger.info('Initializing Aptos prompt enhancer...');
        const promptEnhancer = await getAptosPromptEnhancer(vectorize, openaiApiKey);
        const lastMessage = messages[messages.length - 1];
        
        if (lastMessage.role === 'user') {
          logger.info('Enhancing user prompt with Aptos context...');
          const messageContent = typeof lastMessage.content === 'string' 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content);
          const enhanced = await promptEnhancer.enhancePrompt(messageContent, isAptosMode);
        
        if (enhanced.hasContext) {
          logger.info(`Enhanced prompt with Aptos context (source: ${enhanced.contextSource})`);
          
          // Store system prompt separately to be injected later
          aptosSystemPrompt = enhanced.systemPrompt;
          
          // Update last user message with enhanced version
          enhancedMessages = [
            ...messages.slice(0, -1),
            { role: 'user', content: enhanced.userPrompt },
          ];
        } else {
          logger.warn('No Aptos context found for prompt');
        }
      }
    } catch (error) {
      logger.error('Failed to enhance prompt with Aptos context:', error);
      // Continue with original messages if enhancement fails
    }
  }

    const stream = new SwitchableStream();

    const cumulativeUsage = {
      completionTokens: 0,
      promptTokens: 0,
      totalTokens: 0,
    };
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason, usage }) => {
        logger.debug('usage', JSON.stringify(usage));

        if (usage) {
          cumulativeUsage.completionTokens += usage.completionTokens || 0;
          cumulativeUsage.promptTokens += usage.promptTokens || 0;
          cumulativeUsage.totalTokens += usage.totalTokens || 0;
        }

        // Handle Claude 4.5 refusal stop reason
        if ((finishReason as string) === 'refusal') {
          logger.warn('Model refused to generate response');
          const encoder = new TextEncoder();
          const refusalStream = createDataStream({
            async execute(dataStream) {
              dataStream.writeMessageAnnotation({
                type: 'error',
                value: {
                  message: 'The model refused to generate a response for this request.',
                  type: 'refusal'
                },
              });
            },
            onError: (error: any) => `Custom error: ${error.message}`,
          }).pipeThrough(
            new TransformStream({
              transform: (chunk, controller) => {
                const str = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
                controller.enqueue(encoder.encode(str));
              },
            }),
          );
          await stream.switchSource(refusalStream);
          stream.close();
          return;
        }

        if (finishReason !== 'length') {
          const encoder = new TextEncoder();
          const usageStream = createDataStream({
            async execute(dataStream) {
              dataStream.writeMessageAnnotation({
                type: 'usage',
                value: {
                  completionTokens: cumulativeUsage.completionTokens,
                  promptTokens: cumulativeUsage.promptTokens,
                  totalTokens: cumulativeUsage.totalTokens,
                },
              });
            },
            onError: (error: any) => `Custom error: ${error.message}`,
          }).pipeThrough(
            new TransformStream({
              transform: (chunk, controller) => {
                // Convert the string stream to a byte stream
                const str = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
                controller.enqueue(encoder.encode(str));
              },
            }),
          );
          await stream.switchSource(usageStream);
          await new Promise((resolve) => setTimeout(resolve, 0));
          stream.close();

          return;
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        logger.info(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        enhancedMessages.push({ role: 'assistant', content });
        enhancedMessages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText({
          messages: enhancedMessages,
          env: process.env as any,
          options,
          apiKeys,
          files,
          providerSettings,
          promptId,
          contextOptimization,
          enabledTools,
          aptosSystemPrompt,
          enableExtendedThinking,
        });

        stream.switchSource(result.toDataStream());

        return;
      },
    };
    const totalMessageContent = enhancedMessages.reduce((acc, message) => {
      const content = typeof message.content === 'string' 
        ? message.content 
        : JSON.stringify(message.content);
      return acc + content;
    }, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    // Add timeout to streamText call
    const streamTextPromise = streamText({
      messages: enhancedMessages,
      env: process.env as any,
      options,
      apiKeys,
      files,
      providerSettings,
      promptId,
      contextOptimization,
      enabledTools,
      aptosSystemPrompt,
      enableExtendedThinking,
    });

    // Race between streamText and timeout
    const result = await Promise.race([
      streamTextPromise,
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Request timeout: No response from AI provider after 30 seconds'));
        });
      }),
    ]).catch((error) => {
      logger.error('StreamText error:', error);
      throw error;
    }) as any;

    (async () => {
      for await (const part of result.fullStream) {
        if (part.type === 'error') {
          const error: any = part.error;
          logger.error(`${error}`);

          return;
        }
      }
    })();

    stream.switchSource(result.toDataStream());

    // Clear timeout on success
    clearTimeout(timeoutId);

    return new Response(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    logger.error('Chat API Error:', error);

    // Extract error message
    const errorMessage = error.message || error.toString() || 'An unknown error occurred';
    
    if (error.message?.includes('API key')) {
      throw new Response(
        JSON.stringify({ 
          error: 'Invalid or missing API key. Please check your API key settings.',
          details: errorMessage 
        }), 
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check for model-related errors
    if (error.message?.includes('model') || error.message?.includes('Model')) {
      throw new Response(
        JSON.stringify({ 
          error: 'Model configuration error. Please check your selected model and provider.',
          details: errorMessage 
        }), 
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check for provider errors
    if (error.message?.includes('provider') || error.message?.includes('Provider')) {
      throw new Response(
        JSON.stringify({ 
          error: 'Provider configuration error. Please check your provider settings.',
          details: errorMessage 
        }), 
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check for timeout error
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      throw new Response(
        JSON.stringify({ 
          error: 'Request timeout. The AI provider is not responding.',
          details: 'Please try again or check your API key and provider settings.',
          suggestion: 'If using OpenRouter, ensure your API key has sufficient credits.'
        }), 
        {
          status: 504,
          statusText: 'Gateway Timeout',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generic error with details
    throw new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request.',
        details: errorMessage 
      }), 
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
