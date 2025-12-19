/**
 * Multi-Provider AI Configuration
 * Supports OpenAI, Claude (Anthropic), and Gemini (Google)
 * Uses cheapest/most efficient models for cost optimization
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Provider configuration from environment variables
 */
export const AI_PROVIDERS = {
  OPENAI: {
    enabled: process.env.USE_OPENAI === 'true',
    apiKey: process.env.OPENAI_API_KEY,
    name: 'OpenAI',
    models: {
      text: 'gpt-4o-mini', // Cheapest GPT-4 class model
      image: 'dall-e-3'
    }
  },
  CLAUDE: {
    enabled: process.env.USE_CLAUDE === 'true',
    apiKey: process.env.ANTHROPIC_API_KEY,
    name: 'Claude',
    models: {
      text: 'claude-3-5-haiku-20241022', // Cheapest Claude model
    }
  },
  GEMINI: {
    enabled: process.env.USE_GEMINI === 'true',
    apiKey: process.env.GEMINI_API_KEY,
    name: 'Gemini',
    models: {
      text: 'gemini-1.5-flash', // Cheapest Gemini model
    }
  }
};

/**
 * Get the first available and enabled provider
 * @param {string} capability - 'text' or 'image'
 * @returns {Object} Provider config
 */
export function getAvailableProvider(capability = 'text') {
  const providers = Object.entries(AI_PROVIDERS);

  for (const [key, config] of providers) {
    if (config.enabled && config.apiKey && config.models[capability]) {
      return {
        key,
        ...config
      };
    }
  }

  throw new Error(`No enabled provider found for capability: ${capability}. Please check your .env.local file.`);
}

/**
 * Initialize OpenAI client
 */
export function getOpenAIClient() {
  if (!AI_PROVIDERS.OPENAI.apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey: AI_PROVIDERS.OPENAI.apiKey });
}

/**
 * Initialize Claude client
 */
export function getClaudeClient() {
  if (!AI_PROVIDERS.CLAUDE.apiKey) {
    throw new Error('Claude API key not configured');
  }
  return new Anthropic({ apiKey: AI_PROVIDERS.CLAUDE.apiKey });
}

/**
 * Initialize Gemini client
 */
export function getGeminiClient() {
  if (!AI_PROVIDERS.GEMINI.apiKey) {
    throw new Error('Gemini API key not configured');
  }
  return new GoogleGenerativeAI(AI_PROVIDERS.GEMINI.apiKey);
}

/**
 * Generate text using the first available provider
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
  const provider = getAvailableProvider('text');

  console.log(`Using ${provider.name} for text generation (model: ${provider.models.text})`);

  try {
    switch (provider.key) {
      case 'OPENAI':
        return await generateTextOpenAI(prompt, options);

      case 'CLAUDE':
        return await generateTextClaude(prompt, options);

      case 'GEMINI':
        return await generateTextGemini(prompt, options);

      default:
        throw new Error(`Unknown provider: ${provider.key}`);
    }
  } catch (error) {
    console.error(`Error with ${provider.name}:`, error);

    // Try fallback to next available provider
    if (options.allowFallback !== false) {
      console.log('Attempting fallback to next available provider...');
      return await generateTextWithFallback(prompt, provider.key, options);
    }

    throw error;
  }
}

/**
 * Generate text using OpenAI
 */
async function generateTextOpenAI(prompt, options = {}) {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: AI_PROVIDERS.OPENAI.models.text,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature || 0.3,
    max_tokens: options.maxTokens || 4000
  });

  return response.choices[0].message.content.trim();
}

/**
 * Generate text using Claude
 */
async function generateTextClaude(prompt, options = {}) {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: AI_PROVIDERS.CLAUDE.models.text,
    max_tokens: options.maxTokens || 4000,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature || 0.3
  });

  return response.content[0].text.trim();
}

/**
 * Generate text using Gemini
 */
async function generateTextGemini(prompt, options = {}) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: AI_PROVIDERS.GEMINI.models.text,
    generationConfig: {
      temperature: options.temperature || 0.3,
      maxOutputTokens: options.maxTokens || 4000
    }
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

/**
 * Fallback to next available provider
 */
async function generateTextWithFallback(prompt, failedProvider, options) {
  const providers = Object.entries(AI_PROVIDERS);

  for (const [key, config] of providers) {
    // Skip the failed provider and disabled providers
    if (key === failedProvider || !config.enabled || !config.apiKey || !config.models.text) {
      continue;
    }

    console.log(`Trying fallback provider: ${config.name}`);

    try {
      switch (key) {
        case 'OPENAI':
          return await generateTextOpenAI(prompt, options);
        case 'CLAUDE':
          return await generateTextClaude(prompt, options);
        case 'GEMINI':
          return await generateTextGemini(prompt, options);
      }
    } catch (error) {
      console.error(`Fallback ${config.name} also failed:`, error);
      continue;
    }
  }

  throw new Error('All text generation providers failed');
}

/**
 * Generate image using the first available provider
 * @param {string} prompt - Image generation prompt
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Image URL
 */
export async function generateImage(prompt, options = {}) {
  // For now, only OpenAI DALL-E is supported for images
  // Could add Stability AI or other providers in the future
  const provider = getAvailableProvider('image');

  console.log(`Using ${provider.name} for image generation (model: ${provider.models.image})`);

  if (provider.key === 'OPENAI') {
    return await generateImageOpenAI(prompt, options);
  }

  throw new Error('No image generation provider available');
}

/**
 * Generate image using OpenAI DALL-E
 */
async function generateImageOpenAI(prompt, options = {}) {
  const client = getOpenAIClient();

  const response = await client.images.generate({
    model: AI_PROVIDERS.OPENAI.models.image,
    prompt,
    size: options.size || '1024x1024',
    quality: options.quality || 'standard', // 'standard' is cheaper than 'hd'
    n: 1
  });

  return response.data[0].url;
}

/**
 * Get status of all providers
 * @returns {Object} Provider status
 */
export function getProviderStatus() {
  const status = {};

  Object.entries(AI_PROVIDERS).forEach(([key, config]) => {
    status[key] = {
      name: config.name,
      enabled: config.enabled,
      hasApiKey: !!config.apiKey,
      capabilities: {
        text: !!config.models.text,
        image: !!config.models.image
      }
    };
  });

  return status;
}

export default {
  AI_PROVIDERS,
  getAvailableProvider,
  generateText,
  generateImage,
  getProviderStatus
};
