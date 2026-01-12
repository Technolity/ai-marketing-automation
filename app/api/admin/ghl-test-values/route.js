import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * Helper to get GHL credentials for current user from database
 */
async function getGHLCredentials(userId) {
    const { data: credentials, error } = await supabaseAdmin
        .from('ghl_credentials')
        .select('location_id, access_token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (error || !credentials) {
        console.log('[GHL Admin] No credentials found for user:', userId);
        return null;
    }

    return {
        locationId: credentials.location_id,
        accessToken: credentials.access_token
    };
}

/**
 * POST /api/admin/ghl-test-values
 * Create test custom values in GHL (Admin only)
 * 
 * Body:
 * - names: string[] - Array of custom value names to create
 */
export async function POST(req) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin access
        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch saved credentials
        const creds = await getGHLCredentials(userId);
        if (!creds) {
            return NextResponse.json({
                error: 'No GHL credentials found. Please connect your GHL account first in Settings.',
                code: 'NO_CREDENTIALS'
            }, { status: 400 });
        }

        const { locationId, accessToken } = creds;

        const body = await req.json();
        const { names = [] } = body;

        if (!names || !Array.isArray(names) || names.length === 0) {
            return NextResponse.json({ error: 'names array is required' }, { status: 400 });
        }

        console.log(`[GHL Admin] Creating ${names.length} test custom values in location: ${locationId}`);

        const results = {
            created: [],
            failed: [],
            skipped: []
        };

        // Helper function to create a single custom value
        const createCustomValue = async (name, index) => {
            const trimmedName = name.trim();
            if (!trimmedName) {
                return { status: 'skipped', name: '[empty]', reason: 'Empty name' };
            }

            try {
                const response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'Version': '2021-07-28'
                        },
                        body: JSON.stringify({
                            name: trimmedName,
                            value: `[Test value for: ${trimmedName}]`
                        })
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    console.log(`[GHL Admin] ✓ Created: "${trimmedName}" (key: ${data.customValue?.fieldKey})`);
                    return {
                        status: 'created',
                        name: trimmedName,
                        key: data.customValue?.fieldKey,
                        id: data.customValue?.id,
                        value: data.customValue?.value
                    };
                } else {
                    console.error(`[GHL Admin] ✗ Failed: "${trimmedName}" - ${data.message || data.error}`);
                    return {
                        status: 'failed',
                        name: trimmedName,
                        error: data.message || data.error || 'Unknown error',
                        statusCode: response.status
                    };
                }
            } catch (err) {
                console.error(`[GHL Admin] ✗ Error creating "${trimmedName}":`, err);
                return {
                    status: 'failed',
                    name: trimmedName,
                    error: err.message
                };
            }
        };

        // Create in parallel batches of 5 to respect rate limits
        const BATCH_SIZE = 5;
        for (let i = 0; i < names.length; i += BATCH_SIZE) {
            const batch = names.slice(i, i + BATCH_SIZE);
            console.log(`[GHL Admin] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(names.length / BATCH_SIZE)} (${batch.length} items)`);

            const batchResults = await Promise.all(
                batch.map((name, idx) => createCustomValue(name, i + idx))
            );

            // Categorize results
            batchResults.forEach(result => {
                if (result.status === 'created') {
                    results.created.push(result);
                } else if (result.status === 'failed') {
                    results.failed.push(result);
                } else {
                    results.skipped.push(result);
                }
            });

            // Small delay between batches to respect rate limits
            if (i + BATCH_SIZE < names.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        console.log(`[GHL Admin] Complete: ${results.created.length} created, ${results.failed.length} failed, ${results.skipped.length} skipped`);

        return NextResponse.json({
            success: true,
            locationId,
            summary: {
                total: names.length,
                created: results.created.length,
                failed: results.failed.length,
                skipped: results.skipped.length
            },
            results
        });

    } catch (error) {
        console.error('[GHL Admin] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/admin/ghl-test-values
 * List existing custom values from GHL location (Admin only)
 */
export async function GET(req) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin access
        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch saved credentials
        const creds = await getGHLCredentials(userId);
        if (!creds) {
            return NextResponse.json({
                error: 'No GHL credentials found. Please connect your GHL account first.',
                code: 'NO_CREDENTIALS'
            }, { status: 400 });
        }

        const { locationId, accessToken } = creds;

        console.log(`[GHL Admin] Fetching custom values from location: ${locationId}`);

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
            const errorData = await response.json();
            return NextResponse.json({
                error: errorData.message || 'Failed to fetch custom values',
                status: response.status
            }, { status: response.status });
        }

        const data = await response.json();
        const values = data.customValues || [];

        // Filter for test values if requested
        const { searchParams } = new URL(req.url);
        const filterTest = searchParams.get('testOnly') === 'true';
        const filteredValues = filterTest
            ? values.filter(v => v.fieldKey?.startsWith('test_') || v.name?.toLowerCase().includes('test'))
            : values;

        console.log(`[GHL Admin] Found ${values.length} total values, ${filteredValues.length} after filter`);

        return NextResponse.json({
            success: true,
            locationId,
            total: values.length,
            filtered: filteredValues.length,
            customValues: filteredValues.map(v => ({
                id: v.id,
                name: v.name,
                key: v.fieldKey,
                value: v.value?.substring(0, 100) + (v.value?.length > 100 ? '...' : '')
            }))
        });

    } catch (error) {
        console.error('[GHL Admin] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/ghl-test-values
 * Delete test custom values from GHL (Admin only)
 * 
 * Body:
 * - ids: string[] - Array of custom value IDs to delete
 */
export async function DELETE(req) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin access
        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch saved credentials
        const creds = await getGHLCredentials(userId);
        if (!creds) {
            return NextResponse.json({
                error: 'No GHL credentials found.',
                code: 'NO_CREDENTIALS'
            }, { status: 400 });
        }

        const { locationId, accessToken } = creds;

        const body = await req.json();
        const { ids = [] } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
        }

        console.log(`[GHL Admin] Deleting ${ids.length} custom values from location: ${locationId}`);

        const results = {
            deleted: [],
            failed: []
        };

        for (const id of ids) {
            try {
                const response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${id}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Version': '2021-07-28'
                        }
                    }
                );

                if (response.ok) {
                    console.log(`[GHL Admin] ✓ Deleted: ${id}`);
                    results.deleted.push(id);
                } else {
                    const data = await response.json();
                    console.error(`[GHL Admin] ✗ Failed to delete ${id}: ${data.message}`);
                    results.failed.push({ id, error: data.message });
                }
            } catch (err) {
                results.failed.push({ id, error: err.message });
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`[GHL Admin] Delete complete: ${results.deleted.length} deleted, ${results.failed.length} failed`);

        return NextResponse.json({
            success: true,
            summary: {
                total: ids.length,
                deleted: results.deleted.length,
                failed: results.failed.length
            },
            results
        });

    } catch (error) {
        console.error('[GHL Admin] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
