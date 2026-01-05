import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { ghlSchema } from '@/lib/ghl/schema';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * GET /api/ghl/inspect?locationId=xxx&accessToken=xxx
 * Fetches all custom values from a GHL location for inspection
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const locationId = searchParams.get('locationId');
        const accessToken = searchParams.get('accessToken');

        if (!locationId) {
            return NextResponse.json({
                error: 'Missing locationId parameter'
            }, { status: 400 });
        }

        if (!accessToken) {
            return NextResponse.json({
                error: 'Missing accessToken parameter. Get it from GHL Settings > API'
            }, { status: 400 });
        }

        console.log(`[GHL Inspector] Fetching custom values for location: ${locationId}`);

        // Fetch custom values from GHL using direct API call
        let customValues;
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
            customValues = data.customValues || [];
        } catch (ghlError) {
            console.error('[GHL Inspector] GHL API error:', ghlError);
            return NextResponse.json({
                error: 'Failed to fetch from GHL',
                details: ghlError.message
            }, { status: 500 });
        }

        console.log(`[GHL Inspector] Found ${customValues.length} custom values`);

        // Enrich with schema information
        const enrichedValues = customValues.map(cv => {
            const schemaInfo = findInSchema(cv.key);
            return {
                id: cv.id || '',
                key: cv.key || cv.name || '',
                name: cv.name || cv.key || '',
                value: cv.value || '',
                type: schemaInfo?.type || 'unknown',
                source: schemaInfo?.source || 'not mapped',
                category: getCategoryFromKey(cv.key || cv.name),
                description: schemaInfo?.description || '',
                isEmpty: !cv.value || (typeof cv.value === 'string' && cv.value.trim() === '')
            };
        });

        // Group by category for better organization
        const grouped = groupByCategory(enrichedValues);

        return NextResponse.json({
            success: true,
            locationId,
            total: enrichedValues.length,
            customValues: enrichedValues,
            grouped,
            stats: {
                total: enrichedValues.length,
                filled: enrichedValues.filter(cv => !cv.isEmpty).length,
                empty: enrichedValues.filter(cv => cv.isEmpty).length,
                byCategory: Object.fromEntries(
                    Object.entries(grouped).map(([cat, vals]) => [cat, vals.length])
                )
            }
        });

    } catch (error) {
        console.error('[GHL Inspector] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Find custom value definition in schema
 */
function findInSchema(key) {
    // Flatten schema to find matching key
    for (const [page, fields] of Object.entries(ghlSchema)) {
        for (const [fieldName, fieldDef] of Object.entries(fields)) {
            if (fieldDef.customValue === key) {
                return {
                    page,
                    field: fieldName,
                    type: fieldDef.type,
                    source: fieldDef.source,
                    description: fieldDef.generatedBy || fieldDef.source
                };
            }
        }
    }
    return null;
}

/**
 * Get category from key prefix
 */
function getCategoryFromKey(key) {
    // Safety check for undefined/null keys
    if (!key || typeof key !== 'string') {
        return '📄 Other';
    }

    const prefix = key.split('_')[0];
    const categories = {
        'optin': '🎯 Optin Page',
        'questionnaire': '❓ Questionnaire',
        'vsl': '🎬 VSL Page',
        'testimonial': '⭐ Testimonial',
        'faq': '❔ FAQ Page',
        'cta': '🚀 CTA Page',
        'booking': '📅 Booking'
    };
    return categories[prefix] || '📄 Other';
}

/**
 * Group custom values by category
 */
function groupByCategory(customValues) {
    const grouped = {};
    customValues.forEach(cv => {
        const category = cv.category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(cv);
    });
    return grouped;
}

