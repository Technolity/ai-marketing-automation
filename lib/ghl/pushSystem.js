/**
 * GHL Direct Push System
 * Creates ALL custom values from generated content directly in GHL
 * On first push: Creates values | On subsequent pushes: Updates existing values
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapSessionToCustomValues, getSessionImages } from './customValueMapper';
import { mapEmailsToGHLValues, validateEmailContent } from './directEmailMapper.js';
import { mapSMSToGHLValues, validateSMSContent } from './directSMSMapper.js';
import { mapAppointmentRemindersToGHLValues, validateAppointmentRemindersContent } from './directAppointmentRemindersMapper.js';
import crypto from 'crypto';

/**
 * Fetch existing custom values from GHL location
 */
export async function fetchGHLCustomValues(locationId, accessToken) {
  let allValues = [];
  let skip = 0;
  const limit = 100;
  let hasMore = true;
  let pageCount = 0;

  try {
    console.log('[GHL API] Fetching custom values...');

    while (hasMore) {
      pageCount++;
      const response = await fetch(
        `https://services.leadconnectorhq.com/locations/${locationId}/customValues?limit=${limit}&skip=${skip}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const values = data.customValues || [];

      allValues = [...allValues, ...values];
      console.log(`[GHL API] Page ${pageCount}: Fetched ${values.length} values (Total: ${allValues.length})`);

      // Check if we reached the end
      if (values.length < limit) {
        hasMore = false;
      } else {
        skip += limit;
        // Safety break to prevent infinite loops (unlikely but safe)
        if (allValues.length > 5000) {
          console.warn('[GHL API] Safety limit reached (5000 values), stopping fetch.');
          hasMore = false;
        }
      }
    }

    return allValues;

  } catch (error) {
    console.error('Error fetching GHL custom values:', error);
    throw error;
  }
}

/**
 * Push or update a single custom value in GHL
 */
export async function pushSingleCustomValue(locationId, accessToken, key, value, existingValueId = null) {
  try {
    const url = existingValueId
      ? `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingValueId}`
      : `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

    const method = existingValueId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        name: key,
        value: String(value)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${method} failed for ${key}: ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      key,
      method,
      data
    };

  } catch (error) {
    return {
      success: false,
      key,
      error: error.message
    };
  }
}

/**
 * Comprehensive push operation with progress tracking
 * Creates ALL custom values from generated content directly in GHL
 * On first push: Creates all custom values
 * On subsequent pushes: Updates existing custom values with new content
 */
export async function pushAllContentToGHL({
  userId,
  sessionId,
  locationId,
  accessToken,
  onProgress
}) {
  const startTime = Date.now();

  // Create operation record
  const { data: operation, error: opError } = await supabaseAdmin
    .from('ghl_push_operations')
    .insert({
      user_id: userId,
      session_id: sessionId,
      operation_type: 'push_values',
      status: 'in_progress'
    })
    .select()
    .single();

  if (opError) {
    throw opError;
  }

  const operationId = operation.id;

  // Helper to generate hash
  const generateHash = (obj) => {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(obj))
      .digest('hex');
  };

  const results = {
    operationId,
    created: [],
    updated: [],
    failed: [],
    existingValues: [],
    skipped: 0
  };

  // Content hash for caching (declared here so catch block can access)
  let currentContentHash = null;

  try {
    // Step 1: Fetch existing custom values from GHL to determine create vs update
    onProgress?.({ step: 'fetch_existing', progress: 0, message: 'Checking existing custom values in GHL...' });

    // Parallel fetch: current GHL values AND previous successful operation
    // Note: previousOpResult may error with PGRST116 if no rows found - that's OK
    const [existingValues, previousOpResult] = await Promise.all([
      fetchGHLCustomValues(locationId, accessToken),
      supabaseAdmin
        .from('ghl_push_operations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle() to avoid error when no rows found
    ]);

    results.existingValues = existingValues.map(v => ({
      name: v.name,
      id: v.id,
      value: v.value
    }));

    console.log(`Found ${existingValues.length} existing custom values in GHL`);

    // DEBUG: Log first 10 existing GHL keys for comparison
    console.log('Sample GHL keys:', existingValues.slice(0, 10).map(v => v.name));

    // Create a map for quick lookup (case-insensitive for better matching)
    const existingMap = new Map();
    existingValues.forEach(v => {
      // Store by exact name AND lowercase for case-insensitive matching
      existingMap.set(v.name, v);
      existingMap.set(v.name.toLowerCase(), v);
    });

    // Step 2: Fetch session data
    onProgress?.({ step: 'fetch_session', progress: 10, message: 'Loading generated content...' });

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('saved_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Step 3: Fetch generated images
    onProgress?.({ step: 'fetch_images', progress: 20, message: 'Loading generated images...' });

    const images = await getSessionImages(sessionId);
    console.log(`Found ${images.length} generated images`);

    // Step 4: Map all content (text + images + colors) to custom values
    onProgress?.({ step: 'map_content', progress: 30, message: 'Mapping content to custom values...' });

    const allGeneratedValues = mapSessionToCustomValues(session, images);
    const totalValues = Object.keys(allGeneratedValues).length;

    console.log(`Generated ${totalValues} custom values from content`);

    // === CACHING CHECK ===
    currentContentHash = generateHash(allGeneratedValues);

    // Check if we can use cache from previous operation
    // With maybeSingle(), data is null if no row found (not an error)
    if (previousOpResult?.data) {
      const prevOp = previousOpResult.data;
      // Check metadata.content_hash OR custom_values_pushed.contentHash (legacy/alt storage)
      const prevHash = prevOp.metadata?.content_hash || prevOp.custom_values_pushed?.contentHash;

      if (prevHash === currentContentHash) {
        console.log('CACHE HIT: Content unchanged since last push');
        onProgress?.({ step: 'complete', progress: 100, message: 'Content usage cached - No changes detected!' });

        // Fast-track completion
        await supabaseAdmin
          .from('ghl_push_operations')
          .update({
            status: 'completed',
            total_items: totalValues,
            completed_items: totalValues,
            failed_items: 0,
            metadata: {
              content_hash: currentContentHash,
              cached: true,
              cache_source_op: prevOp.id
            },
            completed_at: new Date(),
            duration_ms: Date.now() - startTime
          })
          .eq('id', operationId);

        return {
          success: true,
          operationId,
          cached: true,
          summary: {
            total: totalValues,
            created: 0,
            updated: 0,
            failed: 0,
            skipped: totalValues,
            successRate: 100,
            duration: Math.round((Date.now() - startTime) / 1000) + 's (Cached)'
          },
          details: { created: [], updated: [], failed: [] },
          usage: {
            howToUse: 'In GHL funnel pages, use merge tags like: {{custom_values.headline}}',
            allKeys: Object.keys(allGeneratedValues)
          }
        };
      }
    }

    // DEBUG: Log generated keys for comparison
    console.log('Sample generated keys:', Object.keys(allGeneratedValues).slice(0, 10));

    // Step 5: Push ALL values to GHL (create or update)
    onProgress?.({ step: 'push_values', progress: 40, message: `Pushing ${totalValues} values to GHL...` });

    let pushedCount = 0;
    let matchCount = 0;
    let newCount = 0;

    for (const [key, value] of Object.entries(allGeneratedValues)) {
      // Check if value already exists in GHL (try exact, lowercase, AND normalized match)
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      const existing = existingMap.get(key) || existingMap.get(key.toLowerCase()) || existingMap.get(normalizedKey);
      const existingId = existing?.id || null;

      // === PER-ITEM CACHE CHECK ===
      // If value is identical, skip the API call
      if (existing && existing.value === String(value)) {
        console.log(`SKIPPED: "${key}" -> Content identical`);
        results.skipped++;
        pushedCount++;
        // Use a faster progress update for skips
        const progress = 40 + Math.floor((pushedCount / totalValues) * 55);
        if (pushedCount % 10 === 0) { // Throttle progress updates for skips
          onProgress?.({
            step: 'push_values',
            progress,
            message: `Verified ${pushedCount}/${totalValues} values...`,
            current: key
          });
        }
        continue;
      }

      if (existingId) {
        matchCount++;
        console.log(`MATCH: "${key}" -> updating existing ID ${existingId}`);
      } else {
        newCount++;
        console.log(`NEW: "${key}" -> creating new custom value`);
      }

      // Push/update
      const result = await pushSingleCustomValue(
        locationId,
        accessToken,
        key,
        value,
        existingId
      );

      if (result.success) {
        if (existingId) {
          results.updated.push({
            key,
            oldValue: existing.value,
            newValue: value
          });
        } else {
          results.created.push({ key, value });
        }
      } else {
        results.failed.push({
          key,
          value,
          error: result.error
        });
      }

      pushedCount++;
      const progress = 40 + Math.floor((pushedCount / totalValues) * 55);
      onProgress?.({
        step: 'push_values',
        progress,
        message: `Pushed ${pushedCount}/${totalValues} values...`,
        current: key
      });

      // Rate limiting: 120ms between requests (500 req/min max)
      await new Promise(resolve => setTimeout(resolve, 120));
    }

    // Step 6: Complete
    onProgress?.({ step: 'complete', progress: 100, message: 'Push complete!' });

    const duration = Date.now() - startTime;
    const successCount = results.created.length + results.updated.length;

    // Update operation record with full details
    await supabaseAdmin
      .from('ghl_push_operations')
      .update({
        status: results.failed.length === 0 ? 'completed' : 'partial',
        total_items: totalValues,
        completed_items: successCount,
        failed_items: results.failed.length,
        metadata: {
          content_hash: currentContentHash, // Store hash for future caching
          skipped_items: results.skipped
        },
        custom_values_pushed: {
          // Store full objects with key and value for UI display
          created: results.created,
          updated: results.updated,
          failed: results.failed,
          skipped_count: results.skipped
        },
        errors: results.failed.map(f => ({
          key: f.key,
          error: f.error
        })),
        completed_at: new Date(),
        duration_ms: duration
      })
      .eq('id', operationId);

    return {
      success: true,
      operationId,
      summary: {
        total: totalValues,
        created: results.created.length,
        updated: results.updated.length,
        failed: results.failed.length,
        skipped: results.skipped,
        successRate: (totalValues - results.skipped) > 0
          ? Math.round((successCount / (totalValues - results.skipped)) * 100)
          : 100,
        duration: Math.round(duration / 1000) + 's'
      },
      details: {
        created: results.created,
        updated: results.updated,
        failed: results.failed
      },
      usage: {
        howToUse: 'In GHL funnel pages, use merge tags like: {{custom_values.headline}}',
        allKeys: Object.keys(allGeneratedValues)
      }
    };

  } catch (error) {
    console.error('Push operation error:', error);

    // Update operation record with error
    await supabaseAdmin
      .from('ghl_push_operations')
      .update({
        status: 'failed',
        errors: [{ message: error.message, stack: error.stack }],
        completed_at: new Date(),
        duration_ms: Date.now() - startTime
      })
      .eq('id', operationId);

    throw error;
  }
}

/**
 * Get operation status
 */
export async function getOperationStatus(operationId) {
  const { data, error } = await supabaseAdmin
    .from('ghl_push_operations')
    .select('*')
    .eq('id', operationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Generate MD5 hash of content for caching
 */
function generateHash(content) {
  return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
}

/**
 * Push Vault Content to GHL
 * Works with vault_content and vault_content_fields tables
 * Includes caching for optimal performance
 */
export async function pushVaultToGHL({
  userId,
  funnelId,
  locationId,
  accessToken,
  onProgress
}) {
  const startTime = Date.now();

  // Create operation record
  const { data: opRecord, error: opError } = await supabaseAdmin
    .from('ghl_push_operations')
    .insert({
      user_id: userId,
      session_id: funnelId, // Using funnelId as session_id for compatibility
      status: 'in_progress',
      total_items: 0,
      completed_items: 0,
      failed_items: 0,
      started_at: new Date()
    })
    .select()
    .single();

  let operationId = null;
  if (opError) {
    // Operation tracking failed - continue without it
    console.warn('Failed to create operation record (continuing anyway):', opError.message);
  } else {
    operationId = opRecord?.id;
  }
  const results = {
    operationId,
    created: [],
    updated: [],
    failed: [],
    existingValues: [],
    skipped: 0
  };

  let currentContentHash = null;

  try {
    onProgress?.({ step: 'fetch_existing', progress: 0, message: 'Checking existing GHL custom values...' });

    console.log(`[VaultPush] Fetching content for funnel_id: ${funnelId}`);

    // Parallel fetch: GHL values + previous operation + vault content + media
    const [existingValues, previousOpResult, vaultContent, mediaFields] = await Promise.all([
      fetchGHLCustomValues(locationId, accessToken),
      supabaseAdmin
        .from('ghl_push_operations')
        .select('*')
        .eq('session_id', funnelId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('vault_content')
        .select('section_id, content')
        .eq('funnel_id', funnelId)
        .eq('is_current_version', true),
      supabaseAdmin
        .from('vault_content_fields')
        .select('section_id, field_id, field_value, field_type')
        .eq('funnel_id', funnelId) // Fetch ALL fields, not just media
        .eq('is_current_version', true)
    ]);

    results.existingValues = existingValues.map(v => ({
      name: v.name,
      id: v.id,
      value: v.value
    }));

    console.log(`[VaultPush] Found ${existingValues.length} existing GHL values`);
    console.log(`[VaultPush] Found ${vaultContent.data?.length || 0} vault sections for funnel ${funnelId}`);
    console.log(`[VaultPush] Found ${mediaFields.data?.length || 0} granular fields for funnel ${funnelId}`); // Renamed log

    // Build existing values map
    const existingMap = new Map();
    existingValues.forEach(v => {
      existingMap.set(v.name, v);
      existingMap.set(v.name.toLowerCase(), v);
      // Normalize: 02 VSL Text -> 02_vsl_text
      const normalized = v.name.toLowerCase().replace(/\s+/g, '_');
      existingMap.set(normalized, v);
    });

    onProgress?.({ step: 'map_content', progress: 20, message: 'Mapping vault content to custom values...' });

    // === MERGE FIELDS INTO CONTENT ===
    // This ensures user edits (stored in vault_content_fields) override or augment the AI-generated JSON blob
    const allFields = mediaFields.data || [];
    const fieldsBySection = {};

    allFields.forEach(field => {
      if (!fieldsBySection[field.section_id]) fieldsBySection[field.section_id] = {};

      // Parse array/object values if needed
      let val = field.field_value;
      if (field.field_type === 'array' || field.field_type === 'object') {
        try {
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            val = JSON.parse(val);
          }
        } catch (e) {
          // Keep as string if parse fails
        }
      }
      fieldsBySection[field.section_id][field.field_id] = val;
    });

    const mergedContent = (vaultContent.data || []).map(section => {
      const fieldOverrides = fieldsBySection[section.section_id] || {};
      // Create a merged content object: JSON blob + granular fields
      // Granular fields take precedence (or are simply added if they didn't exist in JSON)
      const mergedData = { ...(section.content || {}), ...fieldOverrides };
      return { ...section, content: mergedData };
    });

    // === AI-POWERED CUSTOM VALUE GENERATION ===
    // Import AI prompting modules
    const { generateCustomValuesWithPrompts } = await import('./promptEngine.js');
    const { fillMissingWithInference, validateInferredValues } = await import('./inferenceEngine.js');
    const { ALL_CUSTOM_VALUE_KEYS, validateCriticalValues } = await import('./newSchema.js');

    let allGeneratedValues;

    try {
      onProgress?.({ step: 'prompt_generation', progress: 25, message: 'Generating custom values with AI...' });

      // Build merged content object for AI prompting
      const mergedContentObj = {};
      mergedContent.forEach(section => {
        mergedContentObj[section.section_id] = section.content;
      });

      console.log(`[VaultPush] Starting AI-powered custom value generation`);
      console.log(`[VaultPush] Vault sections available:`, Object.keys(mergedContentObj));

      // === INITIALIZE BRAND COLORS FROM INTAKE FORM ===
      // Extract brand colors from intake_form field Q15 (brandColors)
      const { initializeBrandColors, clearBrandColorCache } = await import('./inferenceEngine.js');

      // Clear previous cache to ensure fresh colors for this funnel
      clearBrandColorCache();

      // Look for brandColors in multiple possible locations
      let brandColorsInput = null;

      // Try intake_form section first
      if (mergedContentObj.intake_form?.brandColors) {
        brandColorsInput = mergedContentObj.intake_form.brandColors;
        console.log('[VaultPush] Found brandColors in intake_form');
      }
      // Try media section (might have brandColors field)
      else if (fieldsBySection.media?.brandColors) {
        brandColorsInput = fieldsBySection.media.brandColors;
        console.log('[VaultPush] Found brandColors in media fields');
      }
      // Try root level
      else if (mergedContentObj.brandColors) {
        brandColorsInput = mergedContentObj.brandColors;
        console.log('[VaultPush] Found brandColors at root level');
      }

      // Initialize brand color palette
      if (brandColorsInput) {
        initializeBrandColors(brandColorsInput);
        console.log('[VaultPush] ✓ Brand colors initialized from user input');
      } else {
        console.log('[VaultPush] No brand colors found, using default palette');
        initializeBrandColors(null); // Will use defaults
      }

      // Step 1: Execute prompt-based generation
      const promptedValues = await generateCustomValuesWithPrompts(
        mergedContentObj,
        (promptProgress) => {
          // Forward progress updates
          onProgress?.({
            step: 'prompt_generation',
            progress: 25 + Math.floor(promptProgress.progress * 0.35), // 25-60%
            message: promptProgress.message,
            details: promptProgress.details
          });
        }
      );

      onProgress?.({ step: 'direct_mapping', progress: 60, message: 'Mapping email content directly...' });

      // Step 2: DIRECT EMAIL MAPPING (replaces AI email prompts)
      // This is more reliable than AI for structured email extraction
      console.log('[VaultPush] Applying direct email mapping...');
      const directEmailValues = mapEmailsToGHLValues(mergedContentObj.emails);

      // Validate email content
      const emailValidation = validateEmailContent(mergedContentObj.emails);
      console.log('[VaultPush] Email validation:', {
        ...emailValidation.stats,
        warnings: emailValidation.warnings.length
      });

      // Merge direct mappings with prompted values (direct takes precedence for emails)
      const mergedWithDirectMappings = {
        ...promptedValues,
        ...directEmailValues // Email values override any AI-generated email values
      };

      console.log(`[VaultPush] Direct email mapping added ${Object.keys(directEmailValues).length} email values`);

      onProgress?.({ step: 'funnel_copy_mapping', progress: 62, message: 'Extracting funnel page copy...' });

      // Step 2.5: FUNNEL COPY DIRECT MAPPING
      // Extract Funnel Copy custom values with ghl_key mapping
      console.log('[VaultPush] Extracting Funnel Copy custom values...');
      const funnelCopyValues = extractFunnelCopyCustomValues(mergedContentObj.funnelCopy);

      console.log(`[VaultPush] Funnel Copy mapping added ${Object.keys(funnelCopyValues).length} values`);

      // Merge Funnel Copy values
      const mergedWithFunnelCopy = {
        ...mergedWithDirectMappings,
        ...funnelCopyValues // Funnel Copy values added
      };

      onProgress?.({ step: 'sms_mapping', progress: 64, message: 'Extracting SMS sequences...' });

      // Step 2.6: SMS DIRECT MAPPING
      // Extract SMS custom values (sms1-sms15 with time variants)
      console.log('[VaultPush] Extracting SMS custom values...');
      const smsValues = mapSMSToGHLValues(mergedContentObj.sms);

      // Validate SMS content
      const smsValidation = validateSMSContent(mergedContentObj.sms);
      console.log('[VaultPush] SMS validation:', {
        ...smsValidation.stats,
        warnings: smsValidation.warnings.length
      });

      console.log(`[VaultPush] SMS mapping added ${Object.keys(smsValues).length} SMS values`);

      // Merge SMS values
      const mergedWithSMS = {
        ...mergedWithFunnelCopy,
        ...smsValues // SMS values added
      };

      onProgress?.({ step: 'appointment_reminders_mapping', progress: 66, message: 'Extracting appointment reminders...' });

      // Step 2.7: APPOINTMENT REMINDERS DIRECT MAPPING
      // Extract appointment reminder emails and SMS
      console.log('[VaultPush] Extracting appointment reminder custom values...');
      const appointmentReminderValues = mapAppointmentRemindersToGHLValues(mergedContentObj.appointmentReminders);

      // Validate appointment reminder content
      const appointmentValidation = validateAppointmentRemindersContent(mergedContentObj.appointmentReminders);
      console.log('[VaultPush] Appointment reminders validation:', {
        ...appointmentValidation.stats,
        warnings: appointmentValidation.warnings.length
      });

      console.log(`[VaultPush] Appointment reminders mapping added ${Object.keys(appointmentReminderValues).length} values`);

      // Merge appointment reminder values
      const mergedWithAppointmentReminders = {
        ...mergedWithSMS,
        ...appointmentReminderValues // Appointment reminder values added
      };

      onProgress?.({ step: 'inference', progress: 70, message: 'Filling gaps with smart inference...' });

      // Step 3: Fill missing values with inference engine
      allGeneratedValues = fillMissingWithInference(mergedWithAppointmentReminders, ALL_CUSTOM_VALUE_KEYS, mergedContentObj);

      onProgress?.({ step: 'validation', progress: 70, message: 'Validating custom values...' });

      // Step 3: Validate completeness
      const missingCritical = validateCriticalValues(allGeneratedValues);
      if (missingCritical.length > 0) {
        console.warn('[VaultPush] Missing critical values:', missingCritical);
        // Continue with defaults from schema
      }

      // Step 4: Validate inferred values (check for issues)
      const warnings = validateInferredValues(allGeneratedValues);
      if (warnings.length > 0) {
        console.warn(`[VaultPush] Validation warnings (${warnings.length}):`, warnings.slice(0, 5));
      }

      console.log(`[VaultPush] ✓ AI generation complete: ${Object.keys(allGeneratedValues).length} custom values generated`);

    } catch (error) {
      console.error('[VaultPush] AI prompting error:', error);

      // Fallback: Use old mapping function
      console.log('[VaultPush] Falling back to legacy mapping system...');
      onProgress?.({ step: 'fallback', progress: 70, message: 'Using fallback mapping...' });

      allGeneratedValues = mapVaultToCustomValues(
        mergedContent,
        allFields.filter(f => f.section_id === 'media')
      );
    }

    const totalValues = Object.keys(allGeneratedValues).length;

    console.log(`[VaultPush] Generated ${totalValues} custom values from vault`);

    // === CACHING CHECK ===
    currentContentHash = generateHash(allGeneratedValues);

    if (previousOpResult?.data) {
      const prevHash = previousOpResult.data.metadata?.content_hash;

      if (prevHash === currentContentHash) {
        console.log('[VaultPush] CACHE HIT: Content unchanged since last push');
        onProgress?.({ step: 'complete', progress: 100, message: 'Content unchanged - using cache!' });

        await supabaseAdmin
          .from('ghl_push_operations')
          .update({
            status: 'completed',
            total_items: totalValues,
            completed_items: totalValues,
            failed_items: 0,
            metadata: {
              content_hash: currentContentHash,
              cached: true,
              cache_source_op: previousOpResult.data.id
            },
            completed_at: new Date(),
            duration_ms: Date.now() - startTime
          })
          .eq('id', operationId);

        return {
          success: true,
          operationId,
          cached: true,
          summary: {
            total: totalValues,
            created: 0,
            updated: 0,
            failed: 0,
            skipped: totalValues,
            successRate: 100,
            duration: Math.round((Date.now() - startTime) / 1000) + 's (Cached)'
          },
          details: { created: [], updated: [], failed: [] }
        };
      }
    }

    // === PUSH VALUES ===
    onProgress?.({ step: 'push_values', progress: 30, message: `Pushing ${totalValues} values to GHL...` });

    // Log all values being pushed (for debugging)
    console.log('\n[VaultPush] === VALUES TO PUSH ===');
    for (const [key, value] of Object.entries(allGeneratedValues)) {
      const preview = String(value).substring(0, 80).replace(/\n/g, ' ');
      console.log(`  ${key}: "${preview}${String(value).length > 80 ? '...' : ''}"`);
    }
    console.log('[VaultPush] === END VALUES ===\n');

    const entries = Object.entries(allGeneratedValues);
    let processedCount = 0;

    for (const [key, value] of entries) {
      const existing = existingMap.get(key) || existingMap.get(key.toLowerCase());

      // Per-item skip if identical
      if (existing && existing.value === String(value)) {
        console.log(`[VaultPush] SKIPPED: ${key} (identical)`);
        results.skipped++;
        processedCount++;
        continue;
      }

      // Push to GHL
      const result = await pushSingleCustomValue(
        locationId,
        accessToken,
        key,
        value,
        existing?.id || null
      );

      if (result.success) {
        const action = existing ? 'UPDATED' : 'CREATED';
        console.log(`[VaultPush] ${action}: ${key}`);
        if (existing) {
          results.updated.push({ key, id: result.data?.id, value: String(value).substring(0, 100) });
        } else {
          results.created.push({ key, id: result.data?.id, value: String(value).substring(0, 100) });
        }
      } else {
        console.log(`[VaultPush] FAILED: ${key} - ${result.error}`);
        results.failed.push({ key, error: result.error });
      }

      processedCount++;
      const progress = 30 + Math.round((processedCount / entries.length) * 60);
      onProgress?.({
        step: 'push_values',
        progress,
        message: `Pushed ${processedCount}/${entries.length} values...`
      });
    }

    // === FINALIZE ===
    const endTime = Date.now();
    const duration = endTime - startTime;
    const successCount = results.created.length + results.updated.length;

    await supabaseAdmin
      .from('ghl_push_operations')
      .update({
        status: 'completed',
        total_items: totalValues,
        completed_items: successCount + results.skipped,
        failed_items: results.failed.length,
        metadata: {
          content_hash: currentContentHash,
          skipped_items: results.skipped
        },
        completed_at: new Date(),
        duration_ms: duration
      })
      .eq('id', operationId);

    onProgress?.({ step: 'complete', progress: 100, message: 'Deployment complete!' });

    return {
      success: true,
      operationId,
      cached: false,
      summary: {
        total: totalValues,
        created: results.created.length,
        updated: results.updated.length,
        failed: results.failed.length,
        skipped: results.skipped,
        successRate: (totalValues - results.skipped) > 0
          ? Math.round((successCount / (totalValues - results.skipped)) * 100)
          : 100,
        duration: Math.round(duration / 1000) + 's'
      },
      details: {
        created: results.created,
        updated: results.updated,
        failed: results.failed
      }
    };

  } catch (error) {
    console.error('[VaultPush] Error:', error);

    await supabaseAdmin
      .from('ghl_push_operations')
      .update({
        status: 'failed',
        errors: [{ message: error.message }],
        completed_at: new Date(),
        duration_ms: Date.now() - startTime
      })
      .eq('id', operationId);

    throw error;
  }
}

/**
 * Map vault content + media fields to GHL custom values
 * Comprehensive mapping based on ghlSchema.js
 */
/**
 * Extract Funnel Copy custom values with direct GHL key mapping
 * Maps the 4-page structure (optinPage, salesPage, bookingPage, thankYouPage) to GHL custom values
 */
function extractFunnelCopyCustomValues(funnelCopyContent) {
  const customValues = {};

  if (!funnelCopyContent) {
    console.log('[FunnelCopyMapper] No funnelCopy content available');
    return customValues;
  }

  // Field mappings for each page
  const FUNNEL_COPY_FIELD_MAPPINGS = {
    optinPage: {
      'logo_image': '02_optin_logo_image',
      'mockup_image': '02_optin_mockup_image',
      'cta_text': '02_optin_cta_text',
      'headline_text': '02_optin_headline_text',
      'subheadline_text': '02_optin_subheadline_text',
      'footer_company_name': '02_footer_company_name'
    },
    salesPage: {
      'hero_headline_text': '02_vsl_hero_headline_text',
      'video': '02_vsl_video',
      'cta_text': '02_vsl_cta_text',
      'acknowledge_pill_text': '02_vsl_acknowledge_pill_text',
      'process_headline_text': '02_vsl_process_headline_text',
      'process_sub_headline_text': '02_vsl_process_sub_headline_text',
      'process_bullet_1_text': '02_vsl_process_bullet_1_text',
      'process_bullet_2_text': '02_vsl_process_bullet_2_text',
      'process_bullet_3_text': '02_vsl_process_bullet_3_text',
      'process_bullet_4_text': '02_vsl_process_bullet_4_text',
      'process_bullet_5_text': '02_vsl_process_bullet_5_text',
      'audience_callout_headline_text': '02_vsl_audience_callout_headline_text',
      'audience_callout_bullet_1_text': '02_vsl_audience_callout_bullet_1_text',
      'audience_callout_bullet_2_text': '02_vsl_audience_callout_bullet_2_text',
      'audience_callout_bullet_3_text': '02_vsl_audience_callout_bullet_3_text',
      'audience_callout_cta_text': '02_vsl_audience_callout_cta_text',
      'testimonials_headline_text': '02_vsl_testimonials_headline_text',
      'testimonials_profile_pic_1': '02_vsl_testimonials_profile_pic_1',
      'testimonials_profile_pic_2': '02_vsl_testimonials_profile_pic_2',
      'testimonials_profile_pic_3': '02_vsl_testimonials_profile_pic_3',
      'testimonials_profile_pic_4': '02_vsl_testimonials_profile_pic_4',
      'call_details_headline_text': '02_vsl_call_details_headline_text',
      'call_details_is_not_heading': '02_vsl_call_details_is_not_heading',
      'call_details_is_heading': '02_vsl_call_details_is_heading',
      'call_details_is_not_bullet_1_text': '02_vsl_call_details_is_not_bullet_1_text',
      'call_details_is_not_bullet_2_text': '02_vsl_call_details_is_not_bullet_2_text',
      'call_details_is_not_bullet_3_text': '02_vsl_call_details_is_not_bullet_3_text',
      'call_details_is_bullet_1_text': '02_vsl_call_details_is_bullet_1_text',
      'call_details_is_bullet_2_text': '02_vsl_call_details_is_bullet_2_text',
      'call_details_is_bullet_3_text': '02_vsl_call_details_is_bullet_3_text',
      'bio_photo_text': '02_vsl_bio_photo_text',
      'bio_headline_text': '02_vsl_bio_headline_text',
      'bio_paragraph_text': '02_vsl_bio_paragraph_text',
      'faq_headline_text': '02_vsl_faq_headline_text',
      'faq_question_1_text': '02_vsl_faq_question_1_text',
      'faq_answer_1_text': '02_vsl_faq_answer_1_text',
      'faq_question_2_text': '02_vsl_faq_question_2_text',
      'faq_question_3_text': '02_vsl_faq_question_3_text',
      'faq_question_4_text': '02_vsl_faq_question_4_text'
    },
    bookingPage: {
      'logo_image': '02_optin_logo_image', // reused
      'booking_pill_text': '02_booking_pill_text',
      'calendar_embedded_code': '03_booking_calendar_embedded_code',
      'footer_company_name': '02_footer_company_name' // reused
    },
    thankYouPage: {
      'logo_image': '02_optin_logo_image', // reused
      'headline_text': '02_thankyou_page_headline_text',
      'subheadline_text': '02_thankyou_page_subheadline_text',
      'video': '02_thankyou_page_video',
      'testimonials_headline_text': '02_vsl_testimonials_headline_text', // reused
      'testimonials_subheadline_text': '02_vsl_testimonials_subheadline_text',
      'testimonial_review_1_headline': '02_vsl_testimonial_review_1_headline',
      'testimonial_review_1_paragraph_with_name': '02_vsl_testimonial_review_1_paragraph_with_name',
      'testimonial_review_2_headline': '02_vsl_testimonial_review_2_headline',
      'testimonial_review_2_paragraph_with_name': '02_vsl_testimonial_review_2_paragraph_with_name',
      'testimonial_review_3_headline': '02_vsl_testimonial_review_3_headline',
      'testimonial_review_3_paragraph_with_name': '02_vsl_testimonial_review_3_paragraph_with_name',
      'testimonial_review_4_headline': '02_vsl_testimonial_review_4_headline',
      'testimonial_review_4_paragraph_with_name': '02_vsl_testimonial_review_4_paragraph_with_name',
      'testimonials_profile_pic_1': '02_vsl_testimonials_profile_pic_1', // reused
      'testimonials_profile_pic_2': '02_vsl_testimonials_profile_pic_2', // reused
      'testimonials_profile_pic_3': '02_vsl_testimonials_profile_pic_3', // reused
      'testimonials_profile_pic_4': '02_vsl_testimonials_profile_pic_4', // reused
      'footer_company_name': '02_footer_company_name' // reused
    }
  };

  // Extract from optinPage
  if (funnelCopyContent.optinPage) {
    Object.entries(funnelCopyContent.optinPage).forEach(([key, value]) => {
      const ghlKey = FUNNEL_COPY_FIELD_MAPPINGS.optinPage[key];
      if (ghlKey && value) {
        customValues[ghlKey] = value;
      }
    });
  }

  // Extract from salesPage
  if (funnelCopyContent.salesPage) {
    Object.entries(funnelCopyContent.salesPage).forEach(([key, value]) => {
      const ghlKey = FUNNEL_COPY_FIELD_MAPPINGS.salesPage[key];
      if (ghlKey && value) {
        customValues[ghlKey] = value;
      }
    });
  }

  // Extract from bookingPage
  if (funnelCopyContent.bookingPage) {
    Object.entries(funnelCopyContent.bookingPage).forEach(([key, value]) => {
      const ghlKey = FUNNEL_COPY_FIELD_MAPPINGS.bookingPage[key];
      if (ghlKey && value) {
        customValues[ghlKey] = value;
      }
    });
  }

  // Extract from thankYouPage
  if (funnelCopyContent.thankYouPage) {
    Object.entries(funnelCopyContent.thankYouPage).forEach(([key, value]) => {
      const ghlKey = FUNNEL_COPY_FIELD_MAPPINGS.thankYouPage[key];
      if (ghlKey && value) {
        customValues[ghlKey] = value;
      }
    });
  }

  console.log(`[FunnelCopyMapper] Extracted ${Object.keys(customValues).length} custom values from Funnel Copy`);

  return customValues;
}

function mapVaultToCustomValues(vaultContent, mediaFields) {
  const values = {};

  // Helper to safely get nested value
  const get = (obj, path, def = '') => {
    if (!obj || !path) return def;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) return def;
      // Handle array index notation like [0]
      const match = key.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        result = result[match[1]];
        if (Array.isArray(result)) {
          result = result[parseInt(match[2])];
        } else {
          return def;
        }
      } else {
        result = result[key];
      }
    }
    return result || def;
  };

  // Section mapping: section_id -> wrapper key in content
  const sectionContentKeys = {
    'idealClient': 'idealClientProfile',
    'message': 'millionDollarMessage',
    'story': 'signatureStory',
    'offer': 'programBlueprint',
    'salesScripts': 'closerCallScript',
    'setterScript': 'setterCallScript',
    'leadMagnet': 'leadMagnet',
    'vsl': 'vslScript',
    'emails': 'emailSequence',
    'facebookAds': 'facebookAds',
    'funnelCopy': 'funnelCopy',
    'bio': 'bio',
    'appointmentReminders': 'appointmentReminders'
  };

  // Extract content from each vault section
  vaultContent.forEach(section => {
    const { section_id, content } = section;
    if (!content) return;

    const wrapperKey = sectionContentKeys[section_id];
    const data = wrapperKey ? (content[wrapperKey] || content) : content;

    switch (section_id) {
      // === IDEAL CLIENT / QUESTIONNAIRE ===
      case 'idealClient':
        // Discovery questions -> Questionnaire questions 1-10
        const questions = data.discoveryQuestions || data.qualifyingQuestions || [];
        questions.slice(0, 10).forEach((q, i) => {
          values[`Question_${i + 1}`] = typeof q === 'object' ? (q.question || q.text || '') : String(q);
        });
        // Pain points can be used for headlines
        if (data.painPoints?.[0]) {
          values['questionnaire_hero_headline'] = data.painPoints[0];
        }
        break;

      // === MILLION DOLLAR MESSAGE ===
      case 'message':
        if (data.oneLiner) {
          values['optin_headline_text'] = data.oneLiner;
          values['questionnaire_hero_headline'] = data.oneLiner;
        }
        if (data.headlines?.[0]) values['vsl_hero_headline'] = data.headlines[0];
        if (data.headlines?.[1]) values['vsl_hero_sub_headline'] = data.headlines[1];
        if (data.outcomePromise) values['vsl_process_headline'] = data.outcomePromise;
        if (data.targetAudience) values['optin_popup_headline'] = `For ${data.targetAudience}`;
        break;

      // === SIGNATURE STORY ===
      case 'story':
        if (data.shortVersion) values['vsl_bio_description'] = data.shortVersion;
        if (data.fullVersion) values['vsl_bio_description'] = data.fullVersion;
        if (data.headline) values['vsl_bio_headline'] = data.headline;
        if (data.founderName) values['vsl_bio_founder_name'] = data.founderName;
        break;

      // === PROGRAM BLUEPRINT / OFFER ===
      case 'offer':
        if (data.programName) {
          values['vsl_cta_headline'] = data.programName;
          values['booking_calender_headline'] = data.programName;
        }
        if (data.uniqueFramework) values['vsl_process_sub_headline'] = data.uniqueFramework;
        // Steps/pillars to success
        const steps = data.pillars || data.steps || data.deliverables || [];
        steps.slice(0, 5).forEach((step, i) => {
          const stepText = typeof step === 'object' ? (step.name || step.title || step.description || '') : String(step);
          values[`vsl_process_description_pt_${i + 1}`] = stepText;
        });
        break;

      // === LEAD MAGNET ===
      case 'leadMagnet':
        if (data.mainTitle || data.title) values['optin_headline_text'] = data.mainTitle || data.title;
        if (data.subtitle || data.hook) values['optin_sub_headline_text'] = data.subtitle || data.hook;
        if (data.ctaButtonText || data.cta) values['optin_cta_text'] = data.ctaButtonText || data.cta;
        // Delivery email
        if (data.deliveryEmail?.subject) values['Free_Gift_Email_Subject'] = data.deliveryEmail.subject;
        if (data.deliveryEmail?.body) values['Free_Gift_Email_Body'] = data.deliveryEmail.body;
        break;

      // === VSL SCRIPT ===
      case 'vsl':
        // NEW GRANULAR FIELDS (from vault_content_fields)
        if (data.opening_story) values['vsl_opening_story'] = data.opening_story;
        if (data.problem_agitation) values['vsl_problem_agitation'] = data.problem_agitation;

        // Core Tips (object fields with title/description/action)
        if (data.core_tip_1) {
          const tip1 = typeof data.core_tip_1 === 'object' ? data.core_tip_1 : {};
          if (tip1.title) values['vsl_tip_1_title'] = tip1.title;
          if (tip1.description) values['vsl_tip_1_description'] = tip1.description;
          if (tip1.action) values['vsl_tip_1_action'] = tip1.action;
        }
        if (data.core_tip_2) {
          const tip2 = typeof data.core_tip_2 === 'object' ? data.core_tip_2 : {};
          if (tip2.title) values['vsl_tip_2_title'] = tip2.title;
          if (tip2.description) values['vsl_tip_2_description'] = tip2.description;
          if (tip2.action) values['vsl_tip_2_action'] = tip2.action;
        }
        if (data.core_tip_3) {
          const tip3 = typeof data.core_tip_3 === 'object' ? data.core_tip_3 : {};
          if (tip3.title) values['vsl_tip_3_title'] = tip3.title;
          if (tip3.description) values['vsl_tip_3_description'] = tip3.description;
          if (tip3.action) values['vsl_tip_3_action'] = tip3.action;
        }

        if (data.method_reveal) values['vsl_method_reveal'] = data.method_reveal;
        if (data.social_proof) values['vsl_social_proof'] = data.social_proof;
        if (data.the_offer) values['vsl_offer_description'] = data.the_offer;

        // Objection handlers (separate question/response fields)
        if (data.objection_1_question) values['vsl_faq_ques_1'] = data.objection_1_question;
        if (data.objection_1_response) values['vsl_faq_answer_1'] = data.objection_1_response;
        if (data.objection_2_question) values['vsl_faq_ques_2'] = data.objection_2_question;
        if (data.objection_2_response) values['vsl_faq_answer_2'] = data.objection_2_response;
        if (data.objection_3_question) values['vsl_faq_ques_3'] = data.objection_3_question;
        if (data.objection_3_response) values['vsl_faq_answer_3'] = data.objection_3_response;
        if (data.objection_4_question) values['vsl_faq_ques_4'] = data.objection_4_question;
        if (data.objection_4_response) values['vsl_faq_answer_4'] = data.objection_4_response;

        if (data.guarantee) values['vsl_guarantee'] = data.guarantee;
        if (data.closing_urgency) values['vsl_closing_urgency'] = data.closing_urgency;
        if (data.closing_vision) values['vsl_closing_vision'] = data.closing_vision;
        if (data.closing_cta) values['vsl_closing_cta'] = data.closing_cta;

        // LEGACY FIELDS (from original vault_content JSON blob)
        // Hook options for hero headline
        if (data.hookOptions?.[0]) values['vsl_hero_headline'] = data.hookOptions[0];
        if (data.hookOptions?.[1]) values['vsl_hero_sub_headline'] = data.hookOptions[1];
        // CTA name
        if (data.ctaName || data.callToActionName) {
          values['vsl_cta_headline'] = data.ctaName || data.callToActionName;
          values['booking_calender_headline'] = data.ctaName || data.callToActionName;
        }
        // CTA sub-headline
        if (data.ctaSubheadline) values['vsl_cta_sub_headline'] = data.ctaSubheadline;
        // Urgency elements
        if (data.urgencyElements?.[0]) values['vsl_hero_timer_headline'] = data.urgencyElements[0];
        // Acknowledgement pill
        if (data.acknowledgementPill) values['vsl_hero_acknowledgement_pill'] = data.acknowledgementPill;
        // FAQ from objection handlers (legacy array format)
        const objections = data.objectionHandlers || [];
        objections.slice(0, 7).forEach((obj, i) => {
          if (!values[`vsl_faq_ques_${i + 1}`]) values[`vsl_faq_ques_${i + 1}`] = obj.objection || obj.question || '';
          if (!values[`vsl_faq_answer_${i + 1}`]) values[`vsl_faq_answer_${i + 1}`] = obj.response || obj.answer || '';
        });
        // Steps to success (legacy)
        const vslSteps = data.stepsToSuccess || [];
        vslSteps.slice(0, 5).forEach((step, i) => {
          values[`vsl_process_description_pt_${i + 1}`] = step.description || step.title || '';
        });
        // Social proof (legacy)
        if (data.socialProofMentions?.[0]) values['vsl_testimonial_sub_headline'] = data.socialProofMentions[0];
        break;

      // === BIO ===
      case 'bio':
        if (data.shortBio) values['vsl_bio_description'] = data.shortBio;
        if (data.fullBio) values['vsl_bio_description'] = data.fullBio;
        if (data.headline) values['vsl_bio_headline'] = data.headline;
        if (data.name || data.founderName) values['vsl_bio_founder_name'] = data.name || data.founderName;
        break;

      // === EMAIL SEQUENCE ===
      case 'emails':
        const emails = data.emails || data.sequence || [];
        emails.slice(0, 17).forEach((email, i) => {
          const num = i + 1;
          values[`Optin_Email_Subject_${num}`] = email.subject || email.subjectLine || '';
          values[`Optin_Email_Body_${num}`] = email.body || email.content || '';
        });
        // FAQs if present
        const faqs = data.faqs || [];
        faqs.slice(0, 5).forEach((faq, i) => {
          values[`vsl_faq_ques_${i + 1}`] = faq.question || '';
          values[`vsl_faq_answer_${i + 1}`] = faq.answer || '';
        });
        break;

      // === FACEBOOK ADS ===
      case 'facebookAds':
        const ads = data.ads || (Array.isArray(data) ? data : []);
        if (ads[0]?.headline) values['fb_ad_headline_1'] = ads[0].headline;
        if (ads[0]?.primaryText) values['fb_ad_primary_1'] = ads[0].primaryText;
        if (ads[1]?.headline) values['fb_ad_headline_2'] = ads[1].headline;
        if (ads[1]?.primaryText) values['fb_ad_primary_2'] = ads[1].primaryText;
        break;

      // === FUNNEL COPY ===
      case 'funnelCopy':
        // Map specific funnel page copy
        if (data.optinPage?.headline) values['optin_headline_text'] = data.optinPage.headline;
        if (data.optinPage?.subheadline) values['optin_sub_headline_text'] = data.optinPage.subheadline;
        if (data.optinPage?.cta) values['optin_cta_text'] = data.optinPage.cta;
        if (data.thankYouPage?.headline) values['thankyou_page_headline'] = data.thankYouPage.headline;
        if (data.thankYouPage?.subheadline) values['thankyou_page_sub_headline'] = data.thankYouPage.subheadline;
        if (data.vslPage?.headline) values['vsl_hero_headline'] = data.vslPage.headline;
        break;

      // === APPOINTMENT REMINDERS ===  
      case 'appointmentReminders':
        const reminders = data.reminders || (Array.isArray(data) ? data : []);
        reminders.forEach((reminder, i) => {
          values[`appointment_reminder_${i + 1}_subject`] = reminder.subject || '';
          values[`appointment_reminder_${i + 1}_body`] = reminder.body || reminder.message || '';
        });
        break;

      // === SALES SCRIPTS ===
      case 'salesScripts':
        if (data.opener) values['closer_script_opener'] = data.opener;
        if (data.closeAttempt) values['closer_script_close'] = data.closeAttempt;
        break;

      // === SETTER SCRIPT ===
      case 'setterScript':
        if (data.opener) values['setter_script_opener'] = data.opener;
        if (data.qualifyingQuestions) {
          data.qualifyingQuestions.slice(0, 5).forEach((q, i) => {
            values[`setter_question_${i + 1}`] = typeof q === 'string' ? q : (q.question || '');
          });
        }
        break;
    }
  });

  // === MAP MEDIA FIELDS ===
  const mediaMapping = {
    'logo': 'optin_logo_image',
    'bio_author': 'vsl_bio_image',
    'author_image': 'vsl_bio_image',
    'product_mockup': 'optin_mockup_image',
    'lead_magnet_mockup': 'optin_mockup_image',
    'results_image': 'optin_mockup_image',
    'main_vsl': 'vsl_video_url',
    'vsl_video': 'vsl_video_url',
    'testimonial_video': 'testimonial_video_url',
    'thankyou_video': 'thankyou_video_url'
  };

  mediaFields.forEach(field => {
    const ghlKey = mediaMapping[field.field_id];
    if (ghlKey && field.field_value) {
      values[ghlKey] = field.field_value;
    }
    // Also map main_vsl to test_video for user's testing
    if (field.field_id === 'main_vsl' && field.field_value) {
      values['TEst_video'] = field.field_value;
    }
  });

  // === DEFAULT COLORS (brand consistency) ===
  const defaultColors = {
    'optin_headline_text_color': '#0891b2',
    'optin_sub_headline_text_color': '#06b6d4',
    'optin_cta_background_color': '#0891b2',
    'optin_cta_text_color': '#ffffff',
    'optin_header_bgcolor': '#131314',
    'optin_popup_headline_color': '#0891b2',
    'vsl_hero_headline_color': '#0891b2',
    'vsl_hero_sub_headline_color': '#06b6d4',
    'vsl_process_headline_color': '#0891b2',
    'vsl_process_sub_headline_color': '#06b6d4',
    'vsl_bio_headline_colour': '#0891b2',
    'vsl_bio_founder_name_colour': '#06b6d4',
    'vsl_bio_description_colour': '#a1a1aa',
    'vsl_cta_headline_color': '#ffffff',
    'vsl_cta_sub_headline_text_color': '#e5e5e5',
    'vsl_cta_bgcolor': '#0891b2',
    'vsl_faq_headline_color': '#0891b2',
    'vsl_faq_ques_color': '#0891b2',
    'vsl_faq_answer_color': '#a1a1aa',
    'questionnaire_hero_headline_color': '#0891b2',
    'questionnaire_form_headline_color': '#06b6d4',
    'questionnaire_form_bgcolor': '#1b1b1d',
    'questionnaire_hero_headline_pill_bgcolor': '#0891b2',
    'thankyou_page_headline_color': '#0891b2',
    'thankyou_page_sub_headline_color': '#06b6d4',
    'thankyou_testimonial_bgcolor': '#1b1b1d',
    'booking_calender_headline_color': '#0891b2',
    'booking_calender_headline_pill_color': '#06b6d4',
    'footer_bgcolor': '#0e0e0f',
    'footer_text_color': '#a1a1aa',
    'Questionnaire_CTA_color': '#0891b2',
    'VSL_Process_Description_color': '#a1a1aa',
    'VSL_Process_Border_color': '#0891b2'
  };

  // Add default colors (won't override if already set)
  for (const [key, value] of Object.entries(defaultColors)) {
    if (!values[key]) {
      values[key] = value;
    }
  }

  return values;
}
