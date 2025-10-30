import { convertToCoreMessages, streamText as _streamText } from 'ai';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from '~/lib/common/prompts/prompts';
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  MODEL_REGEX,
  MODIFICATIONS_TAG_NAME,
  PROVIDER_LIST,
  PROVIDER_REGEX,
  WORK_DIR,
} from '~/utils/constants';
import ignore from 'ignore';
import type { IProviderSetting } from '~/types/model';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { allowedHTMLElements } from '~/utils/markdown';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image?: string }>;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
  model?: string;
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Folder {
  type: 'folder';
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

// Token estimation constants
const CHARS_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 characters
const MAX_CONTEXT_TOKENS = 100000; // Safe limit for context
const RESERVED_OUTPUT_TOKENS = 8000; // Reserve for output

export function simplifyBoltActions(input: string): string {
  // Using regex to match boltAction tags that have type="file"
  const regex = /(<boltAction[^>]*type="file"[^>]*>)([\s\S]*?)(<\/boltAction>)/g;

  // Replace each matching occurrence
  return input.replace(regex, (_0, openingTag, _2, closingTag) => {
    return `${openingTag}\n          ...\n        ${closingTag}`;
  });
}

// Common patterns to ignore, similar to .gitignore
const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yml',
];
const ig = ignore().add(IGNORE_PATTERNS);

function createFilesContext(files: FileMap, maxTokens: number = MAX_CONTEXT_TOKENS) {
  let filePaths = Object.keys(files);
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  // Sort files by relevance (prioritize source files over configs)
  const priorityExtensions = ['.ts', '.tsx', '.js', '.jsx', '.move', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
  filePaths.sort((a, b) => {
    const aHasPriority = priorityExtensions.some(ext => a.endsWith(ext));
    const bHasPriority = priorityExtensions.some(ext => b.endsWith(ext));
    if (aHasPriority && !bHasPriority) return -1;
    if (!aHasPriority && bHasPriority) return 1;
    return 0;
  });

  let totalChars = 0;
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const fileContexts = [];
  
  for (const path of filePaths) {
    const dirent = files[path];
    if (!dirent || dirent.type == 'folder') continue;
    
    const codeWithLinesNumbers = dirent.content
      .split('\n')
      .map((v, i) => `${i + 1}|${v}`)
      .join('\n');
    
    const fileContext = `<file path="${path}">\n${codeWithLinesNumbers}\n</file>`;
    const fileChars = fileContext.length;
    
    // Stop adding files if we exceed the limit
    if (totalChars + fileChars > maxChars) {
      logger.warn(`Truncating file context at ${fileContexts.length} files due to token limit`);
      break;
    }
    
    fileContexts.push(fileContext);
    totalChars += fileChars;
  }

  return `Below are the code files present in the webcontainer:\ncode format:\n<line number>|<line content>\n <codebase>${fileContexts.join('\n\n')}\n\n</codebase>`;
}

/**
 * Validates and sanitizes message content to ensure proper structure
 * Fixes common issues like nested arrays in text fields
 */
function sanitizeMessageContent(content: any): string | Array<{ type: string; text?: string; image?: string }> {
  // If it's a string, return as is
  if (typeof content === 'string') {
    return content;
  }
  
  // If it's an array, sanitize each item
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (!item || typeof item !== 'object') {
        return { type: 'text', text: String(item) };
      }
      
      if (item.type === 'text') {
        // Ensure text field is a string
        let textValue = item.text;
        
        // CRITICAL FIX: Handle deeply nested array structure
        // Check if text is an array containing objects with text property
        while (Array.isArray(textValue) && textValue.length > 0) {
          const firstItem = textValue[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            // If it has a text property, extract it
            if ('text' in firstItem) {
              textValue = firstItem.text;
            } else {
              // Otherwise convert to string
              textValue = String(firstItem);
              break;
            }
          } else {
            // If it's not an object, convert to string
            textValue = String(firstItem);
            break;
          }
        }
        
        return {
          type: 'text',
          text: typeof textValue === 'string' ? textValue : String(textValue || ''),
        };
      }
      
      // Handle image type
      if (item.type === 'image' && item.image) {
        return {
          type: 'image',
          image: item.image,
        };
      }
      
      // Return other types with minimal structure
      return {
        type: item.type || 'text',
        text: item.text ? String(item.text) : undefined,
      };
    });
  }
  
  // Fallback: convert to string
  return String(content);
}

function extractPropertiesFromMessage(message: Message): { model: string; provider: string; content: string | Array<{ type: string; text?: string; image?: string }> } {
  // Extract text content for regex matching
  let textContent = '';
  if (Array.isArray(message.content)) {
    const textItem = message.content.find((item) => item.type === 'text');
    textContent = textItem?.text || '';
  } else {
    textContent = message.content;
  }

  const modelMatch = textContent.match(MODEL_REGEX);
  const providerMatch = textContent.match(PROVIDER_REGEX);

  /*
   * Extract model
   * const modelMatch = message.content.match(MODEL_REGEX);
   */
  const model = modelMatch ? modelMatch[1] : DEFAULT_MODEL;

  /*
   * Extract provider
   * const providerMatch = message.content.match(PROVIDER_REGEX);
   */
  const provider = providerMatch ? providerMatch[1] : DEFAULT_PROVIDER.name;

  const cleanedContent = Array.isArray(message.content)
    ? message.content.map((item) => {
        if (item.type === 'text') {
          // Ensure text is a string, not nested
          let textValue = item.text || '';
          
          // Handle case where text might be accidentally nested as an array
          if (Array.isArray(textValue) && textValue.length > 0) {
            // Extract text from nested structure
            const nested = textValue[0] as any;
            textValue = nested?.text || '';
          }
          
          return {
            type: 'text',
            text: typeof textValue === 'string' 
              ? textValue.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '')
              : '',
          };
        }

        return item; // Preserve image_url and other types as is
      })
    : textContent.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '');

  return { model, provider, content: cleanedContent };
}

const logger = createScopedLogger('stream-text');

export async function streamText(props: {
  messages: Messages;
  env: Env;
  options?: StreamingOptions;
  apiKeys?: Record<string, string>;
  files?: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  enabledTools?: string[];
  aptosSystemPrompt?: string;
  enableExtendedThinking?: boolean;
}) {
  const { messages, env: serverEnv, options, apiKeys, files, providerSettings, promptId, contextOptimization, enabledTools = ['aptos'], aptosSystemPrompt, enableExtendedThinking = false } = props;

  // CRITICAL: Early detection of malformed messages
  logger.info('=== INCOMING MESSAGE STRUCTURE CHECK ===');
  messages.forEach((msg, idx) => {
    if (Array.isArray(msg.content) && msg.content[0]?.type === 'text') {
      const textField = msg.content[0].text;
      if (Array.isArray(textField)) {
        logger.error(`!!! MESSAGE ${idx} HAS NESTED TEXT ARRAY !!!`);
        logger.error('Nested structure:', JSON.stringify(textField).substring(0, 500));
      }
    }
  });

  // Log enabled tools for debugging
  logger.debug('Enabled tools:', enabledTools);

  // Sanitize all incoming messages to fix any structural issues
  const sanitizedMessages = messages.map((message, index) => {
    const originalContent = message.content;
    const sanitizedContent = sanitizeMessageContent(message.content);
    
    // ALWAYS log the structure for debugging
    logger.info(`Message ${index} structure check:`);
    logger.info('Original type:', typeof originalContent);
    if (Array.isArray(originalContent) && originalContent[0]) {
      logger.info('First item type:', originalContent[0].type);
      if (originalContent[0].text) {
        logger.info('Text field type:', typeof originalContent[0].text);
        logger.info('Is text array?:', Array.isArray(originalContent[0].text));
        if (Array.isArray(originalContent[0].text) && originalContent[0].text[0]) {
          logger.warn('DOUBLE NESTING DETECTED! Text contains:', originalContent[0].text[0]);
        }
      }
    }
    
    // Log if content was modified during sanitization
    if (JSON.stringify(originalContent) !== JSON.stringify(sanitizedContent)) {
      logger.warn(`Message ${index} content was SANITIZED to fix structure.`);
      logger.info('Sanitized result:', JSON.stringify(sanitizedContent).substring(0, 200));
    }
    
    return {
      ...message,
      content: sanitizedContent,
    };
  });

  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  let processedMessages = sanitizedMessages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;

      if (contextOptimization && typeof content === 'string') {
        content = simplifyBoltActions(content);
      }

      return { ...message, content };
    }

    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  // Calculate safe token limits
  const modelMaxTokens = modelDetails?.maxTokenAllowed || MAX_TOKENS;
  const dynamicMaxTokens = Math.min(modelMaxTokens, RESERVED_OUTPUT_TOKENS);
  
  // Calculate available tokens for context
  const contextBudget = Math.min(modelMaxTokens - dynamicMaxTokens, MAX_CONTEXT_TOKENS);

  let systemPrompt =
    PromptLibrary.getPropmtFromLibrary(promptId || 'default', {
      cwd: WORK_DIR,
      allowedHtmlElements: allowedHTMLElements,
      modificationTagName: MODIFICATIONS_TAG_NAME,
    }) ?? getSystemPrompt(WORK_DIR, enabledTools);

  // Prepend Aptos system prompt if provided
  if (aptosSystemPrompt) {
    systemPrompt = `${aptosSystemPrompt}\n\n---\n\n${systemPrompt}`;
  }

  // Estimate current prompt size
  let estimatedPromptTokens = Math.ceil(systemPrompt.length / CHARS_PER_TOKEN);
  
  // Truncate messages if needed to fit within context
  let truncatedMessages = [...processedMessages];
  const messageTokenEstimate = truncatedMessages.reduce((acc, msg) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    return acc + Math.ceil(content.length / CHARS_PER_TOKEN);
  }, 0);
  
  // If messages are too long, keep only recent ones
  if (messageTokenEstimate + estimatedPromptTokens > contextBudget) {
    logger.warn('Message history too long, truncating older messages');
    
    // Keep at least the last message
    let keptTokens = 0;
    const keptMessages = [];
    
    for (let i = truncatedMessages.length - 1; i >= 0; i--) {
      const msg = truncatedMessages[i];
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      const msgTokens = Math.ceil(content.length / CHARS_PER_TOKEN);
      
      if (keptTokens + msgTokens + estimatedPromptTokens > contextBudget && keptMessages.length > 0) {
        break;
      }
      
      keptMessages.unshift(msg);
      keptTokens += msgTokens;
    }
    
    truncatedMessages = keptMessages;
    logger.info(`Kept ${truncatedMessages.length} most recent messages`);
  }
  
  // Add file context if there's room
  if (files && contextOptimization) {
    const remainingTokens = contextBudget - estimatedPromptTokens - messageTokenEstimate;
    if (remainingTokens > 1000) { // Only add if we have reasonable space
      const codeContext = createFilesContext(files, remainingTokens);
      systemPrompt = `${systemPrompt}\n\n ${codeContext}`;
    } else {
      logger.warn('Insufficient token budget for file context');
    }
  }
  
  processedMessages = truncatedMessages;

  logger.info(`Sending llm call to ${provider.name} with model ${modelDetails.name}`);

  // Check if we should enable extended thinking for Claude 4.5 models
  const isClaude45 = modelDetails.name.includes('claude-sonnet-4-5') || modelDetails.name.includes('claude-haiku-4-5');
  const extendedThinkingOptions = enableExtendedThinking && isClaude45 ? {
    experimental_thinking: {
      type: 'enabled' as const,
      budget_tokens: modelDetails.name.includes('sonnet') ? 10000 : 5000
    }
  } : {};

  // Final sanitization before sending to AI provider
  const finalMessages = processedMessages.map(msg => {
    // Ensure content is properly formatted
    if (Array.isArray(msg.content)) {
      // Double-check each content item
      const cleanContent = msg.content.map(item => {
        if (typeof item === 'object' && item.type === 'text') {
          // Ensure text is a string, not an array
          let text = item.text;
          if (Array.isArray(text)) {
            logger.error('CRITICAL: Text field is still an array after sanitization!', text);
            // Extract string from nested structure
            while (Array.isArray(text) && text.length > 0) {
              text = text[0]?.text || text[0] || '';
            }
          }
          return { type: 'text', text: String(text || '') };
        }
        return item;
      });
      return { ...msg, content: cleanContent };
    }
    return msg;
  });

  logger.info('Sending to AI provider with message count:', finalMessages.length);
  if (finalMessages.length > 0 && Array.isArray(finalMessages[0].content)) {
    logger.info('First message content structure:', JSON.stringify(finalMessages[0].content).substring(0, 200));
  }

  // Log token usage estimation
  const finalSystemTokens = Math.ceil(systemPrompt.length / CHARS_PER_TOKEN);
  const finalMessageTokens = finalMessages.reduce((acc, msg) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    return acc + Math.ceil(content.length / CHARS_PER_TOKEN);
  }, 0);
  
  logger.info(`Token usage estimate - System: ${finalSystemTokens}, Messages: ${finalMessageTokens}, Output: ${dynamicMaxTokens}, Total: ${finalSystemTokens + finalMessageTokens + dynamicMaxTokens}`);
  
  return await _streamText({
    model: provider.getModelInstance({
      model: currentModel,
      serverEnv,
      apiKeys,
      providerSettings,
    }),
    system: systemPrompt,
    maxTokens: dynamicMaxTokens,
    messages: convertToCoreMessages(finalMessages as any),
    ...options,
    ...extendedThinkingOptions,
  });
}
