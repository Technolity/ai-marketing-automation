/**
 * GHL Direct Push System
 * Creates ALL custom values from generated content directly in GHL
 * On first push: Creates values | On subsequent pushes: Updates existing values
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapSessionToCustomValues, getSessionImages } from './customValueMapper';

/**
 * Fetch existing custom values from GHL location
 */
export async function fetchGHLCustomValues(locationId, accessToken) {
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GHL API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.customValues || [];

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
  const results = {
    operationId,
    created: [],
    updated: [],
    failed: [],
    existingValues: []
  };

  try {
    // Step 1: Fetch existing custom values from GHL to determine create vs update
    onProgress?.({ step: 'fetch_existing', progress: 0, message: 'Checking existing custom values in GHL...' });

    const existingValues = await fetchGHLCustomValues(locationId, accessToken);
    results.existingValues = existingValues.map(v => ({
      name: v.name,
      id: v.id
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

    // DEBUG: Log generated keys for comparison
    console.log('Sample generated keys:', Object.keys(allGeneratedValues).slice(0, 10));

    // Step 5: Push ALL values to GHL (create or update)
    onProgress?.({ step: 'push_values', progress: 40, message: `Pushing ${totalValues} values to GHL...` });

    let pushedCount = 0;
    let matchCount = 0;
    let newCount = 0;

    for (const [key, value] of Object.entries(allGeneratedValues)) {
      // Check if value already exists in GHL (try both exact and lowercase match)
      const existing = existingMap.get(key) || existingMap.get(key.toLowerCase());
      const existingId = existing?.id || null;

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
        custom_values_pushed: {
          // Store full objects with key and value for UI display
          created: results.created,
          updated: results.updated,
          failed: results.failed
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
        successRate: totalValues > 0 ? Math.round((successCount / totalValues) * 100) : 0,
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
