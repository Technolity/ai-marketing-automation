/**
 * Shared AI Utilities
 * Centralized functions for AI generation with caching, monitoring, and optimizations
 */

import { AI_PROVIDERS, getOpenAIClient, getClaudeClient, getGeminiClient } from './providerConfig';

// Cache for provider performance metrics
const providerMetrics = {
  OPENAI: { successCount: 0, failCount: 0, avgResponseTime: 0, totalCalls: 0 },
  CLAUDE: { successCount: 0, failCount: 0, avgResponseTime: 0, totalCalls: 0 },
  GEMINI: { successCount: 0, failCount: 0, avgResponseTime: 0, totalCalls: 0 }
};

// Request deduplication cache (prevents duplicate identical requests)
const requestCache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Circuit breaker state for each provider
const circuitBreakers = {
  OPENAI: { failures: 0, lastFailure: null, isOpen: false },
  CLAUDE: { failures: 0, lastFailure: null, isOpen: false },
  GEMINI: { failures: 0, lastFailure: null, isOpen: false }
};

const CIRCUIT_BREAKER_THRESHOLD = 5; // Open after 5 consecutive failures (was 3)
const CIRCUIT_BREAKER_TIMEOUT = 15000; // 15 seconds before retry (was 30)

/**
 * Check if circuit breaker is open for a provider
 */
function isCircuitBreakerOpen(providerKey) {
  const breaker = circuitBreakers[providerKey];
  if (!breaker.isOpen) return false;

  // Check if timeout has passed
  const timeSinceLastFailure = Date.now() - breaker.lastFailure;
  if (timeSinceLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
    // Reset circuit breaker
    breaker.isOpen = false;
    breaker.failures = 0;
    console.log(`[CIRCUIT BREAKER] ${providerKey} circuit closed - retrying`);
    return false;
  }

  return true;
}

/**
 * Record provider failure for circuit breaker
 */
function recordProviderFailure(providerKey) {
  const breaker = circuitBreakers[providerKey];
  breaker.failures++;
  breaker.lastFailure = Date.now();

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.isOpen = true;
    console.warn(`[CIRCUIT BREAKER] ${providerKey} circuit opened after ${breaker.failures} failures`);
  }
}

/**
 * Record provider success for circuit breaker
 */
function recordProviderSuccess(providerKey) {
  const breaker = circuitBreakers[providerKey];
  if (breaker.failures > 0) {
    breaker.failures = Math.max(0, breaker.failures - 1);
  }
}

/**
 * Generate cache key for request deduplication
 */
function generateCacheKey(systemPrompt, userPrompt, options) {
  const key = JSON.stringify({ systemPrompt, userPrompt, options });
  return key;
}

/**
 * Get cached response if available and not expired
 */
function getCachedResponse(cacheKey) {
  const cached = requestCache.get(cacheKey);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    requestCache.delete(cacheKey);
    return null;
  }

  console.log('[CACHE] Using cached response');
  return cached.response;
}

/**
 * Cache a response
 */
function cacheResponse(cacheKey, response) {
  requestCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });

  // Cleanup old cache entries (keep cache size reasonable)
  if (requestCache.size > 100) {
    const oldestKey = requestCache.keys().next().value;
    requestCache.delete(oldestKey);
  }
}

/**
 * Multi-provider AI generation with fallback, caching, and monitoring
 * Tries providers in order: OpenAI -> Claude -> Gemini
 */
export async function generateWithProvider(systemPrompt, userPrompt, options = {}) {
  const {
    timeout = 90000, // 90 second default timeout for complex prompts
    enableCache = false, // DISABLED during development to prevent stale cached responses
    preferredProvider = null
  } = options;

  // Check cache first
  if (enableCache) {
    const cacheKey = generateCacheKey(systemPrompt, userPrompt, options);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Sort providers by preference or performance
  let providers = ['OPENAI', 'CLAUDE', 'GEMINI'];

  // If preferred provider specified, try it first
  if (preferredProvider && providers.includes(preferredProvider)) {
    providers = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];
  } else {
    // Sort by success rate (best performing first)
    providers = providers.sort((a, b) => {
      const aRate = providerMetrics[a].successCount / (providerMetrics[a].totalCalls || 1);
      const bRate = providerMetrics[b].successCount / (providerMetrics[b].totalCalls || 1);
      return bRate - aRate;
    });
  }

  let lastError = null;

  for (const providerKey of providers) {
    const config = AI_PROVIDERS[providerKey];

    // Skip if provider is not enabled or doesn't have an API key
    if (!config.enabled || !config.apiKey) {
      continue;
    }

    // Check circuit breaker
    if (isCircuitBreakerOpen(providerKey)) {
      console.log(`[AI] Skipping ${providerKey}: circuit breaker open`);
      continue;
    }

    const startTime = Date.now();
    providerMetrics[providerKey].totalCalls++;

    console.log(`[AI] Trying ${config.name} (success rate: ${(providerMetrics[providerKey].successCount / providerMetrics[providerKey].totalCalls * 100).toFixed(1)}%)`);

    try {
      const result = await Promise.race([
        generateWithSingleProvider(providerKey, config, systemPrompt, userPrompt, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
        )
      ]);

      // Success - record metrics
      const responseTime = Date.now() - startTime;
      providerMetrics[providerKey].successCount++;
      providerMetrics[providerKey].avgResponseTime =
        (providerMetrics[providerKey].avgResponseTime * (providerMetrics[providerKey].successCount - 1) + responseTime) /
        providerMetrics[providerKey].successCount;

      recordProviderSuccess(providerKey);

      console.log(`[AI] ${config.name} succeeded in ${responseTime}ms`);

      // Cache the response
      if (enableCache) {
        const cacheKey = generateCacheKey(systemPrompt, userPrompt, options);
        cacheResponse(cacheKey, result);
      }

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      providerMetrics[providerKey].failCount++;

      recordProviderFailure(providerKey);

      console.error(`[AI] ${config.name} failed after ${responseTime}ms:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }

  // All providers failed
  throw lastError || new Error('No AI providers available. Please configure at least one provider in .env.local');
}

/**
 * Generate with a single provider (internal function)
 */
async function generateWithSingleProvider(providerKey, config, systemPrompt, userPrompt, options) {
  switch (providerKey) {
    case 'OPENAI': {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: config.models.text,
        response_format: options.jsonMode ? { type: "json_object" } : undefined,
        max_tokens: options.maxTokens || 6000,
        temperature: options.temperature || 0.7,
      });
      return completion.choices[0].message.content;
    }

    case 'CLAUDE': {
      const client = getClaudeClient();
      const response = await client.messages.create({
        model: config.models.text,
        max_tokens: options.maxTokens || 6000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt + (options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : '')
        }],
        temperature: options.temperature || 0.7
      });
      return response.content[0].text;
    }

    case 'GEMINI': {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({
        model: config.models.text,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 6000
        }
      });
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}${options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : ''}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    }

    default:
      throw new Error(`Unknown provider: ${providerKey}`);
  }
}

/**
 * Stream AI generation token-by-token with provider fallback
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message
 * @param {Function} onToken - Callback for each token: (token) => void
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Complete generated text after streaming
 */
export async function streamWithProvider(systemPrompt, userPrompt, onToken, options = {}) {
  const {
    timeout = 90000,
    preferredProvider = null
  } = options;

  // Sort providers by preference or performance (same logic as generateWithProvider)
  let providers = ['OPENAI', 'CLAUDE', 'GEMINI'];

  if (preferredProvider && providers.includes(preferredProvider)) {
    providers = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];
  } else {
    providers = providers.sort((a, b) => {
      const aRate = providerMetrics[a].successCount / (providerMetrics[a].totalCalls || 1);
      const bRate = providerMetrics[b].successCount / (providerMetrics[b].totalCalls || 1);
      return bRate - aRate;
    });
  }

  let lastError = null;

  for (const providerKey of providers) {
    const config = AI_PROVIDERS[providerKey];

    // Skip if provider is not enabled or doesn't have an API key
    if (!config.enabled || !config.apiKey) {
      continue;
    }

    // Check circuit breaker
    if (isCircuitBreakerOpen(providerKey)) {
      console.log(`[AI STREAM] Skipping ${providerKey}: circuit breaker open`);
      continue;
    }

    const startTime = Date.now();
    providerMetrics[providerKey].totalCalls++;

    // COMPREHENSIVE LOGGING: Stream start
    console.log('[AI STREAM] ========== STREAM START ==========');
    console.log(`[AI STREAM] Provider: ${config.name} (${providerKey})`);
    console.log('[AI STREAM] Configuration:', {
      model: config.models.text,
      maxTokens: options.maxTokens || 6000,
      temperature: options.temperature || 0.7,
      timeout: `${timeout}ms`,
      jsonMode: !!options.jsonMode
    });
    console.log('[AI STREAM] Prompt lengths:', {
      systemPrompt: systemPrompt.length,
      userPrompt: userPrompt.length,
      total: systemPrompt.length + userPrompt.length,
      estimatedInputTokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4)
    });
    console.log('[AI STREAM] System prompt (first 300 chars):', systemPrompt.substring(0, 300) + '...');
    console.log('[AI STREAM] User prompt (first 300 chars):', userPrompt.substring(0, 300) + '...');

    try {
      const result = await Promise.race([
        streamWithSingleProvider(providerKey, config, systemPrompt, userPrompt, onToken, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Stream timeout after ${timeout}ms`)), timeout)
        )
      ]);

      // Success - record metrics
      const responseTime = Date.now() - startTime;
      providerMetrics[providerKey].successCount++;
      providerMetrics[providerKey].avgResponseTime =
        (providerMetrics[providerKey].avgResponseTime * (providerMetrics[providerKey].successCount - 1) + responseTime) /
        providerMetrics[providerKey].successCount;

      recordProviderSuccess(providerKey);

      // COMPREHENSIVE LOGGING: Success
      console.log('[AI STREAM] ========== STREAM COMPLETE ==========');
      console.log(`[AI STREAM] Provider: ${config.name} succeeded`);
      console.log('[AI STREAM] Performance:', {
        duration: `${responseTime}ms`,
        totalCharacters: result.length,
        estimatedOutputTokens: Math.ceil(result.length / 4),
        avgCharsPerSecond: Math.round((result.length / responseTime) * 1000),
        avgTokensPerSecond: Math.round((Math.ceil(result.length / 4) / responseTime) * 1000)
      });
      console.log('[AI STREAM] Output preview:', result.substring(0, 500) + (result.length > 500 ? '...' : ''));

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      providerMetrics[providerKey].failCount++;
      recordProviderFailure(providerKey);

      // COMPREHENSIVE LOGGING: Error
      console.error('[AI STREAM] ========== STREAM FAILED ==========');
      console.error(`[AI STREAM] Provider: ${config.name} failed`);
      console.error('[AI STREAM] Error details:', {
        duration: `${responseTime}ms`,
        message: error.message,
        stack: error.stack?.substring(0, 300),
        isTimeout: error.message.includes('timeout'),
        providerKey
      });

      lastError = error;
      // Continue to next provider
    }
  }

  // All providers failed
  throw lastError || new Error('No AI providers available for streaming');
}

/**
 * Stream with a single provider (internal function)
 */
async function streamWithSingleProvider(providerKey, config, systemPrompt, userPrompt, onToken, options) {
  switch (providerKey) {
    case 'OPENAI': {
      const client = getOpenAIClient();
      const stream = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: config.models.text,
        stream: true,
        max_tokens: options.maxTokens || 6000,
        temperature: options.temperature || 0.7,
      });

      let fullText = '';
      let tokenCount = 0;
      const streamStartTime = Date.now();

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullText += token;
          tokenCount++;
          onToken(token);

          // COMPREHENSIVE LOGGING: Progress every 50 tokens
          if (tokenCount % 50 === 0) {
            const elapsed = Date.now() - streamStartTime;
            console.log('[AI STREAM] Progress:', {
              provider: 'OpenAI',
              tokensReceived: tokenCount,
              charactersReceived: fullText.length,
              elapsedMs: elapsed,
              tokensPerSecond: Math.round((tokenCount / elapsed) * 1000)
            });
          }
        }
      }

      // COMPREHENSIVE LOGGING: Final token count
      console.log('[AI STREAM] OpenAI stream finished:', {
        totalTokens: tokenCount,
        totalCharacters: fullText.length,
        duration: `${Date.now() - streamStartTime}ms`
      });

      return fullText;
    }

    case 'CLAUDE': {
      const client = getClaudeClient();
      const stream = await client.messages.stream({
        model: config.models.text,
        max_tokens: options.maxTokens || 6000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt + (options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : '')
        }],
        temperature: options.temperature || 0.7
      });

      let fullText = '';
      let tokenCount = 0;
      const streamStartTime = Date.now();

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const token = chunk.delta?.text || '';
          if (token) {
            fullText += token;
            tokenCount++;
            onToken(token);

            // COMPREHENSIVE LOGGING: Progress every 50 tokens
            if (tokenCount % 50 === 0) {
              const elapsed = Date.now() - streamStartTime;
              console.log('[AI STREAM] Progress:', {
                provider: 'Claude',
                tokensReceived: tokenCount,
                charactersReceived: fullText.length,
                elapsedMs: elapsed,
                tokensPerSecond: Math.round((tokenCount / elapsed) * 1000)
              });
            }
          }
        }
      }

      // COMPREHENSIVE LOGGING: Final token count
      console.log('[AI STREAM] Claude stream finished:', {
        totalTokens: tokenCount,
        totalCharacters: fullText.length,
        duration: `${Date.now() - streamStartTime}ms`
      });

      return fullText;
    }

    case 'GEMINI': {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({
        model: config.models.text,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 6000
        }
      });

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}${options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : ''}`;
      const result = await model.generateContentStream(fullPrompt);

      let fullText = '';
      let tokenCount = 0;
      const streamStartTime = Date.now();

      for await (const chunk of result.stream) {
        const token = chunk.text();
        if (token) {
          fullText += token;
          tokenCount++;
          onToken(token);

          // COMPREHENSIVE LOGGING: Progress every 50 tokens
          if (tokenCount % 50 === 0) {
            const elapsed = Date.now() - streamStartTime;
            console.log('[AI STREAM] Progress:', {
              provider: 'Gemini',
              tokensReceived: tokenCount,
              charactersReceived: fullText.length,
              elapsedMs: elapsed,
              tokensPerSecond: Math.round((tokenCount / elapsed) * 1000)
            });
          }
        }
      }

      // COMPREHENSIVE LOGGING: Final token count
      console.log('[AI STREAM] Gemini stream finished:', {
        totalTokens: tokenCount,
        totalCharacters: fullText.length,
        duration: `${Date.now() - streamStartTime}ms`
      });

      return fullText;
    }

    default:
      throw new Error(`Unknown provider: ${providerKey}`);
  }
}

/**
 * Retry helper with exponential backoff and jitter
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 2, // Reduced from 3 for faster failover
    initialDelay = 500, // Reduced from 1000ms
    maxDelay = 5000, // Reduced from 10000ms
    backoffMultiplier = 1.5, // Reduced from 2
    jitter = true
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors or invalid requests
      if (error.status === 401 || error.status === 400) {
        throw error;
      }

      if (attempt < maxRetries) {
        let delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);

        // Add jitter to prevent thundering herd
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        console.log(`[RETRY] Attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Get provider metrics for monitoring
 */
export function getProviderMetrics() {
  return {
    ...providerMetrics,
    circuitBreakers: Object.entries(circuitBreakers).map(([provider, state]) => ({
      provider,
      isOpen: state.isOpen,
      failures: state.failures,
      lastFailure: state.lastFailure
    }))
  };
}

/**
 * Clear request cache (useful for testing or manual cache invalidation)
 */
export function clearRequestCache() {
  requestCache.clear();
  console.log('[CACHE] Request cache cleared');
}

/**
 * Reset circuit breakers (useful for manual recovery)
 */
export function resetCircuitBreakers() {
  Object.values(circuitBreakers).forEach(breaker => {
    breaker.failures = 0;
    breaker.lastFailure = null;
    breaker.isOpen = false;
  });
  console.log('[CIRCUIT BREAKER] All circuit breakers reset');
}

export default {
  generateWithProvider,
  streamWithProvider,
  retryWithBackoff,
  getProviderMetrics,
  clearRequestCache,
  resetCircuitBreakers
};
