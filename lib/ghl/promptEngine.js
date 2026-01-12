/**
 * Prompt Engine - Executes AI prompts to generate custom values
 * Uses OpenAI GPT-5.2 for intelligent content mapping
 */

import { generateText } from '../ai/providerConfig.js';
import { customValuePrompts, PROMPT_GROUPS } from './customValuePrompts.js';

/**
 * Generate custom values using AI prompts
 * @param {object} vaultContent - All vault sections (idealClient, message, story, etc.)
 * @param {function} onProgress - Progress callback function
 * @returns {Promise<object>} - Generated custom values { customValueKey: value, ... }
 */
export async function generateCustomValuesWithPrompts(vaultContent, onProgress) {
  const results = {};
  let processedCount = 0;

  const promptGroups = Object.entries(customValuePrompts);
  const totalPrompts = promptGroups.length;

  console.log(`[PromptEngine] Starting generation with ${totalPrompts} prompt groups`);

  onProgress?.({
    step: 'prompt_generation_start',
    progress: 0,
    message: `Generating custom values with AI (0/${totalPrompts} groups)...`
  });

  // Execute each prompt group sequentially
  for (const [groupName, promptConfig] of promptGroups) {
    try {
      const startTime = Date.now();

      onProgress?.({
        step: 'prompt_execution',
        progress: Math.floor((processedCount / totalPrompts) * 100),
        message: `Processing ${groupName}...`,
        details: {
          group: groupName,
          targetValues: promptConfig.targetValues,
          count: promptConfig.targetValues.length
        }
      });

      console.log(`[PromptEngine] Executing group: ${groupName} (${promptConfig.targetValues.length} values)`);

      // Build prompt with vault content
      const promptText = promptConfig.prompt(vaultContent);

      console.log(`[PromptEngine] Prompt length: ${promptText.length} chars`);

      // Execute AI prompt
      const aiResponse = await executeAIPrompt(promptText);

      console.log(`[PromptEngine] AI response received (${aiResponse.length} chars)`);

      // Parse response using group's parse function
      const generatedValues = promptConfig.parseResponse(aiResponse);

      // Merge into results
      Object.assign(results, generatedValues);

      const duration = Date.now() - startTime;
      console.log(`[PromptEngine] ✓ Group "${groupName}" completed in ${duration}ms, generated ${Object.keys(generatedValues).length} values`);

      processedCount++;

    } catch (error) {
      console.error(`[PromptEngine] ✗ Error in group "${groupName}":`, error.message);

      // Apply empty values for this group (inference engine will fill later)
      promptConfig.targetValues.forEach(key => {
        if (!results[key]) {
          results[key] = '';
        }
      });

      processedCount++;
    }

    // Small delay between prompts to avoid rate limiting (optional)
    if (processedCount < totalPrompts) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const totalGenerated = Object.keys(results).length;
  const filledCount = Object.values(results).filter(v => v && v !== '').length;

  console.log(`[PromptEngine] ✓ Generation complete: ${filledCount}/${totalGenerated} values filled`);

  onProgress?.({
    step: 'prompt_generation_complete',
    progress: 100,
    message: `Generated ${filledCount} custom values with AI`
  });

  return results;
}

/**
 * Execute AI prompt using OpenAI GPT-5.2
 * @param {string} promptText - The prompt to execute
 * @returns {Promise<string>} - AI response text
 */
async function executeAIPrompt(promptText) {
  try {
    const responseText = await generateText(promptText, {
      temperature: 0.3, // Low temperature for consistent JSON formatting
      maxTokens: 4000
    });

    return responseText;

  } catch (error) {
    console.error('[PromptEngine] AI API error:', error.message);

    // Specific error handling
    if (error.status === 429) {
      console.error('[PromptEngine] Rate limit exceeded - consider adding delays');
    } else if (error.status === 401) {
      console.error('[PromptEngine] Authentication failed - check OPENAI_API_KEY');
    } else if (error.status === 500) {
      console.error('[PromptEngine] OpenAI API error - service may be down');
    }

    throw error;
  }
}

/**
 * Batch process multiple prompts with concurrency control (FUTURE OPTIMIZATION)
 * Currently runs sequentially to avoid rate limits
 *
 * @param {object} vaultContent - Vault content
 * @param {function} onProgress - Progress callback
 * @param {number} concurrency - Max parallel prompts (default: 1)
 * @returns {Promise<object>} - Generated custom values
 */
export async function batchGenerateCustomValues(vaultContent, onProgress, concurrency = 1) {
  // For now, just call the sequential version
  // Future: Implement parallel execution with semaphore/queue
  return generateCustomValuesWithPrompts(vaultContent, onProgress);
}

/**
 * Generate a single prompt group (for testing/debugging)
 * @param {string} groupName - Name of prompt group to execute
 * @param {object} vaultContent - Vault content
 * @returns {Promise<object>} - Generated values for this group
 */
export async function generateSingleGroup(groupName, vaultContent) {
  const promptConfig = customValuePrompts[groupName];

  if (!promptConfig) {
    throw new Error(`Unknown prompt group: ${groupName}`);
  }

  console.log(`[PromptEngine] Executing single group: ${groupName}`);

  const promptText = promptConfig.prompt(vaultContent);
  const aiResponse = await executeAIPrompt(promptText);
  const generatedValues = promptConfig.parseResponse(aiResponse);

  console.log(`[PromptEngine] Single group generated ${Object.keys(generatedValues).length} values`);

  return generatedValues;
}

/**
 * Validate prompt engine setup
 * @returns {Promise<boolean>} - True if API key is valid
 */
export async function validateSetup() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[PromptEngine] OPENAI_API_KEY environment variable not set');
    return false;
  }

  try {
    // Test with a simple prompt
    const response = await generateText('Respond with "OK" if you receive this message.', {
      temperature: 0.3,
      maxTokens: 50
    });

    console.log('[PromptEngine] ✓ API key validated successfully');
    return true;

  } catch (error) {
    console.error('[PromptEngine] ✗ API key validation failed:', error.message);
    return false;
  }
}

/**
 * Get statistics about prompt groups
 * @returns {object} - Statistics object
 */
export function getPromptStatistics() {
  const groups = Object.entries(customValuePrompts);
  const totalValues = groups.reduce((sum, [_, config]) => sum + config.targetValues.length, 0);

  return {
    totalGroups: groups.length,
    totalValues,
    averageValuesPerGroup: Math.round(totalValues / groups.length),
    groups: groups.map(([name, config]) => ({
      name,
      valueCount: config.targetValues.length,
      sourceSections: config.sourceSections
    }))
  };
}

export default {
  generateCustomValuesWithPrompts,
  batchGenerateCustomValues,
  generateSingleGroup,
  validateSetup,
  getPromptStatistics
};
