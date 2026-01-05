import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * POST /api/ghl/custom-values/push
 *
 * Push custom values to GoHighLevel location
 *
 * Body:
 * {
 *   mappingId: string (required) - ID of saved custom value mapping
 *   ghlAccessToken: string (required) - GHL API access token
 *   ghlLocationId: string (required) - GHL location ID
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   updatedFields: number,
 *   ghlResponse: {...}
 * }
 */
export async function POST(req) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { mappingId, ghlAccessToken, ghlLocationId } = await req.json();

    if (!mappingId || !ghlAccessToken || !ghlLocationId) {
      return NextResponse.json(
        { error: 'mappingId, ghlAccessToken, and ghlLocationId are required' },
        { status: 400 }
      );
    }

    // Fetch custom value mapping from database
    const { data: mapping, error: fetchError } = await supabaseAdmin
      .from('ghl_custom_value_mappings')
      .select('*')
      .eq('id', mappingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !mapping) {
      return NextResponse.json(
        { error: 'Mapping not found or access denied' },
        { status: 404 }
      );
    }

    const customValues = mapping.custom_values;

    // Push to GoHighLevel API
    // GHL Custom Fields API: https://highlevel.stoplight.io/docs/integrations/2a800ab9d1609-update-custom-field
    const ghlApiUrl = `https://services.leadconnectorhq.com/locations/${ghlLocationId}/customFields`;

    const responses = [];
    const errors = [];

    // Push each custom value as a separate custom field
    for (const [key, value] of Object.entries(customValues)) {
      try {
        const response = await fetch(ghlApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlAccessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            name: key,
            dataType: typeof value === 'number' ? 'NUMBER' : 'TEXT',
            model: 'contact', // Store in contact custom fields
            position: Object.keys(customValues).indexOf(key),
            placeholder: `Auto-generated: ${key}`,
            defaultValue: String(value)
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          errors.push({
            field: key,
            status: response.status,
            error: errorData.message || response.statusText
          });
        } else {
          const data = await response.json();
          responses.push({ field: key, success: true, data });
        }
      } catch (error) {
        errors.push({
          field: key,
          error: error.message
        });
      }
    }

    // If more than 50% failed, consider it a failure
    const successCount = responses.length;
    const totalCount = Object.keys(customValues).length;
    const successRate = successCount / totalCount;

    if (successRate < 0.5) {
      return NextResponse.json(
        {
          error: 'Push failed for majority of fields',
          successCount,
          totalCount,
          errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedFields: successCount,
      totalFields: totalCount,
      successRate: Math.round(successRate * 100) + '%',
      responses,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error pushing to GHL:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Alternative: Batch update using GHL Custom Values API
 * This is more efficient but requires the custom fields to already exist in GHL
 */
export async function PUT(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mappingId, ghlAccessToken, ghlLocationId, contactId } = await req.json();

    if (!mappingId || !ghlAccessToken || !ghlLocationId || !contactId) {
      return NextResponse.json(
        { error: 'mappingId, ghlAccessToken, ghlLocationId, and contactId are required' },
        { status: 400 }
      );
    }

    // Fetch mapping
    const { data: mapping, error: fetchError } = await supabaseAdmin
      .from('ghl_custom_value_mappings')
      .select('*')
      .eq('id', mappingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    // Update contact with custom field values
    // Note: This assumes custom fields already exist in GHL
    const ghlContactUrl = `https://services.leadconnectorhq.com/contacts/${contactId}`;

    const response = await fetch(ghlContactUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ghlAccessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        customFields: Object.entries(mapping.custom_values).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'GHL API error', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      contact: data.contact
    });

  } catch (error) {
    console.error('Error updating GHL contact:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

