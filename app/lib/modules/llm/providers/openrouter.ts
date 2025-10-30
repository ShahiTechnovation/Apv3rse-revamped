import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/keys';

  config = {
    apiTokenKey: 'OPENROUTER_API_KEY',
  };

  // Popular models available on OpenRouter
  staticModels: ModelInfo[] = [
    // OpenAI Models (with conservative token limits to prevent errors)
    { name: 'openai/gpt-4-turbo-preview', label: 'GPT-4 Turbo', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'openai/gpt-4', label: 'GPT-4', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    
    // Anthropic Models (with reasonable limits)
    { name: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'anthropic/claude-2', label: 'Claude 2', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    
    // Google Models
    { name: 'google/gemini-pro', label: 'Gemini Pro', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'google/gemini-pro-vision', label: 'Gemini Pro Vision', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    
    // Meta Models
    { name: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    { name: 'meta-llama/llama-3-8b-instruct', label: 'Llama 3 8B', provider: 'OpenRouter', maxTokenAllowed: 8192 },
    
    // Mistral Models
    { name: 'mistralai/mistral-large', label: 'Mistral Large', provider: 'OpenRouter', maxTokenAllowed: 128000 },
    { name: 'mistralai/mistral-medium', label: 'Mistral Medium', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'mistralai/mixtral-8x22b-instruct', label: 'Mixtral 8x22B', provider: 'OpenRouter', maxTokenAllowed: 65536 },
    
    // Cohere Models
    { name: 'cohere/command-r-plus', label: 'Command R Plus', provider: 'OpenRouter', maxTokenAllowed: 128000 },
    { name: 'cohere/command-r', label: 'Command R', provider: 'OpenRouter', maxTokenAllowed: 128000 },
    
    // DeepSeek Models
    { name: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'deepseek/deepseek-coder', label: 'DeepSeek Coder', provider: 'OpenRouter', maxTokenAllowed: 16384 },
    
    // Qwen Models
    { name: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    
    // Other Popular Models
    { name: 'perplexity/llama-3.1-sonar-large-128k-online', label: 'Perplexity Sonar Large', provider: 'OpenRouter', maxTokenAllowed: 127072 },
    { name: 'perplexity/llama-3.1-sonar-small-128k-online', label: 'Perplexity Sonar Small', provider: 'OpenRouter', maxTokenAllowed: 127072 },
    { name: 'databricks/dbrx-instruct', label: 'DBRX Instruct', provider: 'OpenRouter', maxTokenAllowed: 32768 },
    { name: 'nous/hermes-3-llama-3.1-405b', label: 'Hermes 3 405B', provider: 'OpenRouter', maxTokenAllowed: 131072 },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENROUTER_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // OpenRouter uses OpenAI-compatible API
    const openrouter = createOpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': 'https://apv3rse.xyz', // Optional: for your app's analytics on OpenRouter
        'X-Title': 'Apv3rse', // Optional: for your app's title on OpenRouter
      },
    });

    return openrouter(model);
  }

  // OpenRouter supports dynamic model fetching
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    try {
      const { apiKey } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: settings,
        serverEnv: serverEnv as any,
        defaultBaseUrlKey: '',
        defaultApiTokenKey: 'OPENROUTER_API_KEY',
      });

      if (!apiKey) {
        return [];
      }

      // Fetch available models from OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch OpenRouter models:', response.statusText);
        return [];
      }

      const data = await response.json() as { data: Array<{ id: string; name?: string; context_length?: number }> };
      
      // Transform OpenRouter model format to our ModelInfo format
      const dynamicModels: ModelInfo[] = data.data
        .filter((model) => model.id && model.name)
        .map((model) => ({
          name: model.id,
          label: model.name || model.id,
          provider: 'OpenRouter',
          maxTokenAllowed: model.context_length || 8192,
        }));

      return dynamicModels;
    } catch (error) {
      console.error('Error fetching OpenRouter dynamic models:', error);
      return [];
    }
  }
}
