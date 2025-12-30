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

const CIRCUIT_BREAKER_THRESHOLD = 3; // Fail faster
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds before retry

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
    enableCache = true,
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
  retryWithBackoff,
  getProviderMetrics,
  clearRequestCache,
  resetCircuitBreakers
};
