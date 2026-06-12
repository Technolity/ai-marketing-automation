/**
 * GHL Deploy Workflow - Strict Update-Only Mode
 * ONLY updates existing custom values, never creates new ones
 * Uses exact key names from Custom Values.xlsx
 * Team members can deploy using their owner's GHL sub-account
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { toEmbedUrl } from '@/lib/utils/videoUrl';
import { KEY_TEMPLATE } from '@/lib/ghl/slots';
import { buildSlotDeployCustomValues, extractSmsMessage } from '@/lib/ghl/slotDeployMapper';

const TOTAL_SLOT_KEYS = KEY_TEMPLATE.length;

export const dynamic = 'force_dynamic';
export const maxDuration = 300; // Increased to 5 minutes to prevent timeout (current deployment takes ~74s)

// === DEFAULT MEDIA VALUES (fallback when user hasn't uploaded) ===
const DEFAULT_MEDIA_VALUES = {
    logo: 'https://res.cloudinary.com/df3br07tk/image/upload/v1769618595/ai-marketing-uploads/1769618595666_TMB_Logo.png.png',
    profile_photo: 'https://homebusinessmag.com/wp-content/uploads/2019/09/IMG_2881-R1-1.jpg',
    bio_author: 'https://homebusinessmag.com/wp-content/uploads/2019/09/IMG_2881-R1-1.jpg', // Alias for profile_photo
    product_mockup: 'https://res.cloudinary.com/df3br07tk/image/upload/v1769624666/ai-marketing-uploads/1769624666701_TedOS_Frame_1__2_.png.png',
    vsl_video: '', // No default for video
    main_vsl: '', // Alias - no default for video
    thankyou_video: '', // No default for video
    testimonial_review_1_image: 'https://e7.pngegg.com/pngimages/226/870/png-clipart-computer-icons-user-profile-others-rectangle-logo.png',
    testimonial_review_2_image: 'https://e7.pngegg.com/pngimages/226/870/png-clipart-computer-icons-user-profile-others-rectangle-logo.png',
    testimonial_review_3_image: 'https://e7.pngegg.com/pngimages/226/870/png-clipart-computer-icons-user-profile-others-rectangle-logo.png',
    testimonial_review_4_image: 'https://e7.pngegg.com/pngimages/226/870/png-clipart-computer-icons-user-profile-others-rectangle-logo.png'
};

// === CALENDAR PAGE MAPPINGS (2 fields; footer handled elsewhere) ===
const CALENDAR_PAGE_MAP = {
    'headline': '03_calender_page_headline',
    'calendar_embedded_code': '03_calender_page_embedded_calender_code'
};

// === THANK YOU PAGE MAPPINGS (2 fields; footer handled elsewhere) ===
const THANK_YOU_PAGE_MAP = {
    'headline': '03_thankyou_page_headline',
    'subheadline': '03_thankyou_page_sub__headline'  // Note: double underscore for GHL's "Sub - Headline"
};

// Duplicate POST function removed


/**
 * NEW Custom Value Mappings - Updated to 03_* structure
 * Maps vault field names to GHL custom value keys
 */

// === OPTIN PAGE MAPPINGS (4 fields; footer handled elsewhere) ===
const OPTIN_PAGE_MAP = {
    'headline_text': '03_optin_headline_text',
    'subheadline_text': '03_optin_subheadline_text',
    'cta_button_text': '03_optin_cta_button_text',
    'popup_form_headline': '03_opt_in_popup_form_headline'
};

// === APPOINTMENT BOOKING PAGE MAPPINGS (69 fields; footer handled elsewhere) ===
const SALES_PAGE_MAP = {
    // Hero Section (4)
    'hero_headline_text': '03_vsl_hero_headline_text',
    'hero_subheadline_text': '03_vsl_hero_subheadline_text',
    'hero_below_cta_sub_text': '03_vsl_hero_below_cta_sub_text',
    'cta_text': '03_vsl_cta_text',

    // Process Overview (2)
    'process_headline': '03_vsl_process_headline',
    'process_subheadline': '03_vsl_process_subheadline',

    // 6 Processes (12)
    'process_1_headline': '03_vsl_process_1_headline',
    'process_1_subheadline': '03_vsl_process_1_subheadline',
    'process_2_headline': '03_vsl_process_2_headline',
    'process_2_subheadline': '03_vsl_process_2_subheadline',
    'process_3_headline': '03_vsl_process_3_headline',
    'process_3_subheadline': '03_vsl_process_3_subheadline',
    'process_4_headline': '03_vsl_process_4_headline',
    'process_4_subheadline': '03_vsl_process_4_subheadline',
    'process_5_headline': '03_vsl_process_5_headline',
    'process_5_subheadline': '03_vsl_process_5_subheadline',
    'process_6_headline': '03_vsl_process_6_headline',
    'process_6_subheadline': '03_vsl_process_6_subheadline',

    // How It Works (5)
    'how_it_works_headline': '03_vsl_how_it_works_headline',
    'how_it_works_subheadline_above_cta': '03_vsl_how_it_works_subheadline_above_cta',
    'how_it_works_point_1': '03_vsl_how_it_works_point_1',
    'how_it_works_point_2': '03_vsl_how_it_works_point_2',
    'how_it_works_point_3': '03_vsl_how_it_works_point_3',

    // Audience Callout (10)
    'audience_callout_headline': '03_vsl_audience_callout_headline',
    'audience_callout_for_headline': '03_vsl_audience_callout_for_headline',
    'audience_callout_for_1': '03_vsl_audience_callout_for_1',
    'audience_callout_for_2': '03_vsl_audience_callout_for_2',
    'audience_callout_for_3': '03_vsl_audience_callout_for_3',
    'audience_callout_not_headline': '03_vsl_audience_callout_not_headline',
    'audience_callout_not_1': '03_vsl_audience_callout_not_1',
    'audience_callout_not_2': '03_vsl_audience_callout_not_2',
    'audience_callout_not_3': '03_vsl_audience_callout_not_3',
    'audience_callout_cta_sub_text': '03_vsl_audience_callout_cta_sub_text',

    // This Is For (1)
    'this_is_for_headline': '03_vsl_this_is_for_headline',

    // Call Expectations (9)
    'call_expectations_headline': '03_vsl_call_expectations_headline',
    'call_expectations_is_for_headline': '03_vsl_call_expectations_is_for_headline',
    'call_expectations_is_for_bullet_1': '03_vsl_call_expectations_is_for_bullet_1',
    'call_expectations_is_for_bullet_2': '03_vsl_call_expectations_is_for_bullet_2',
    'call_expectations_is_for_bullet_3': '03_vsl_call_expectations_is_for_bullet_3',
    'call_expectations_not_for_headline': '03_vsl_call_expectations_not_for_headline',
    'call_expectations_not_for_bullet_1': '03_vsl_call_expectations_not_for_bullet_1',
    'call_expectations_not_for_bullet_2': '03_vsl_call_expectations_not_for_bullet_2',
    'call_expectations_not_for_bullet_3': '03_vsl_call_expectations_not_for_bullet_3',

    // Bio (2)
    'bio_headline_text': '03_vsl_bio_headline_text',
    'bio_paragraph_text': '03_vsl_bio_paragraph_text',

    // Testimonials (10)
    'testimonial_headline_text': '03_vsl_testimonial_headline_text',
    'testimonial_subheadline_text': '03_vsl_testimonial_subheadline_text',
    'testimonial_review_1_headline': '03_vsl_testimonial_review_1_headline',
    'testimonial_review_1_subheadline_with_name': '03_vsl_testimonial_review_1_subheadline_with_name',
    'testimonial_review_2_headline': '03_vsl_testimonial_review_2_headline',
    'testimonial_review_2_subheadline_with_name': '03_vsl_testimonial_review_2_subheadline_with_name',
    'testimonial_review_3_headline': '03_vsl_testimonial_review_3_headline',
    'testimonial_review_3_subheadline_with_name': '03_vsl_testimonial_review_3_subheadline_with_name',
    'testimonial_review_4_headline': '03_vsl_testimonial_review_4_headline',
    'testimonial_review_4_subheadline_with_name': '03_vsl_testimonial_review_4_subheadline_with_name',

    // FAQ (9)
    'faq_headline_text': '03_vsl_faq_headline_text',
    'faq_question_1': '03_vsl_faq_question_1',
    'faq_answer_1': '03_vsl_faq_answer_1',
    'faq_question_2': '03_vsl_faq_question_2',
    'faq_answer_2': '03_vsl_faq_answer_2',
    'faq_question_3': '03_vsl_faq_question_3',
    'faq_answer_3': '03_vsl_faq_answer_3',
    'faq_question_4': '03_vsl_faq_question_4',
    'faq_answer_4': '03_vsl_faq_answer_4',

    // Final CTA (3)
    'final_cta_headline': '03_vsl_final_cta_headline',
    'final_cta_subheadline': '03_vsl_final_cta_subheadline',
    'final_cta_subtext': '03_vsl_final_cta_subtext'
};

// === COLORS MAPPINGS (3 colors) ===
const COLORS_MAP = {
    'primary': 'primary_color',
    'secondary': 'secondary_color',
    'tertiary': 'tertiary_color'
};

// === UNIVERSAL MAPPINGS (cross-page fields) ===
const UNIVERSAL_MAP = {
    'logo_image': 'logo_image',  // Universal logo across all pages
    'company_name': 'company_name'  // Universal company name
};

// Old mappings removed - now using new 03_* structure above

// === EMAIL KEY MAPPINGS ===
const EMAIL_KEY_MAP = {
    // Free Gift Email
    freeGift: { 'subject': 'free_gift_email_subject', 'body': 'free_gift_email_body' },
    // Optin Emails Day 1-15
    day1: { 'subject': 'optin_email_subject_1', 'preheader': 'optin_email_preheader_1', 'body': 'optin_email_body_1' },
    day2: { 'subject': 'optin_email_subject_2', 'preheader': 'optin_email_preheader_2', 'body': 'optin_email_body_2' },
    day3: { 'subject': 'optin_email_subject_3', 'preheader': 'optin_email_preheader_3', 'body': 'optin_email_body_3' },
    day4: { 'subject': 'optin_email_subject_4', 'preheader': 'optin_email_preheader_4', 'body': 'optin_email_body_4' },
    day5: { 'subject': 'optin_email_subject_5', 'preheader': 'optin_email_preheader_5', 'body': 'optin_email_body_5' },
    day6: { 'subject': 'optin_email_subject_6', 'preheader': 'optin_email_preheader_6', 'body': 'optin_email_body_6' },
    day7: { 'subject': 'optin_email_subject_7', 'preheader': 'optin_email_preheader_7', 'body': 'optin_email_body_7' },
    day8: { 'subject': 'optin_email_subject_8', 'preheader': 'optin_email_preheader_8', 'body': 'optin_email_body_8' },
    day9: { 'subject': 'optin_email_subject_9', 'preheader': 'optin_email_preheader_9', 'body': 'optin_email_body_9' },
    day10: { 'subject': 'optin_email_subject_10', 'preheader': 'optin_email_preheader_10', 'body': 'optin_email_body_10' },
    day11: { 'subject': 'optin_email_subject_11', 'preheader': 'optin_email_preheader_11', 'body': 'optin_email_body_11' },
    day12: { 'subject': 'optin_email_subject_12', 'preheader': 'optin_email_preheader_12', 'body': 'optin_email_body_12' },
    day13: { 'subject': 'optin_email_subject_13', 'preheader': 'optin_email_preheader_13', 'body': 'optin_email_body_13' },
    day14: { 'subject': 'optin_email_subject_14', 'preheader': 'optin_email_preheader_14', 'body': 'optin_email_body_14' },
};

// === SMS KEY MAPPINGS ===
const SMS_KEY_MAP = {
    // Days 1-7
    'sms1': 'optin_sms_1',
    'sms2': 'optin_sms_2',
    'sms3': 'optin_sms_3',
    'sms4': 'optin_sms_4',
    'sms5': 'optin_sms_5',
    'sms6': 'optin_sms_6',
    'sms7a': 'optin_sms_7',
    'sms7b': 'optin_sms_7_evening',

    // Day 8 (Closing Day 1)
    'sms8a': 'optin_sms_8_morning',
    'sms8b': 'optin_sms_8_afternoon',
    'sms8c': 'optin_sms_8_evening',

    // Days 9-14
    'sms9': 'optin_sms_9',
    'sms10': 'optin_sms_10',
    'sms11': 'optin_sms_11',
    'sms12': 'optin_sms_12',
    'sms13': 'optin_sms_13',
    'sms14': 'optin_sms_14',

    // Day 15 (Final Closing Day)
    'sms15a': 'optin_sms_15_morning',
    'sms15b': 'optin_sms_15_afternoon',
    'sms15c': 'optin_sms_15_evening'
};

// === APPOINTMENT REMINDER EMAIL KEY MAPPINGS ===
const APPOINTMENT_EMAIL_KEY_MAP = {
    'whenCallBooked': { 'subject': 'email_subject_when_call_booked', 'preheader': 'email_preheader_when_call_booked', 'body': 'email_body_when_call_booked' },
    '48HourBefore': { 'subject': 'email_subject_48_hour_before_call_time', 'preheader': 'email_preheader_48_hour_before_call_time', 'body': 'email_body_48_hour_before_call_time' },
    '24HourBefore': { 'subject': 'email_subject_24_hour_before_call_time', 'preheader': 'email_preheader_24_hour_before_call_time', 'body': 'email_body_24_hour_before_call_time' },
    '1HourBefore': { 'subject': 'email_subject_1_hour_before_call_time', 'preheader': 'email_preheader_1_hour_before_call_time', 'body': 'email_body_1_hour_before_call_time' },
    '10MinBefore': { 'subject': 'email_subject_10_min_before_call_time', 'preheader': 'email_preheader_10_min_before_call_time', 'body': 'email_body_10_min_before_call_time' },
    'atCallTime': { 'subject': 'email_subject_at_call_time', 'preheader': 'email_preheader_at_call_time', 'body': 'email_body_at_call_time' },
};

// === APPOINTMENT REMINDER SMS KEY MAPPINGS ===
const APPOINTMENT_SMS_KEY_MAP = {
    'whenCallBooked': 'sms_when_call_booked',
    '48HourBefore': 'sms_48_hour_before_call_time',
    '24HourBefore': 'sms_24_hour_before_call_time',
    '1HourBefore': 'sms_1_hour_before_call_time',
    '10MinBefore': 'sms_10_min_before_call_time',
    'atCallTime': 'sms_at_call_time',
};

/**
 * Get OAuth location token with timeout
 */
async function refreshGHLToken(tokenData) {
    console.log('[Deploy] Attempting to refresh expired token...');

    if (!tokenData?.refresh_token) {
        console.log('[Deploy] ERROR: No refresh token available');
        return null;
    }

    try {
        const refreshResp = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
            }),
        });

        if (!refreshResp.ok) {
            console.log('[Deploy] ERROR: Token refresh failed:', refreshResp.status);
            return null;
        }

        const newTokens = await refreshResp.json();

        // Update tokens in database
        await supabaseAdmin
            .from('ghl_tokens')
            .update({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || tokenData.refresh_token,
                expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', tokenData.id);

        console.log('[Deploy] ✓ Token refreshed successfully');
        return newTokens.access_token;
    } catch (e) {
        console.log('[Deploy] ERROR: Token refresh exception:', e.message);
        return null;
    }
}

async function getLocationToken(userId, locationId) {
    console.log('[Deploy] Getting OAuth token...');

    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!tokenData?.access_token || !tokenData?.company_id) {
        console.log('[Deploy] ERROR: No agency token found');
        return { success: false, error: 'No agency token found' };
    }

    let accessToken = tokenData.access_token;
    let attemptCount = 0;
    const maxAttempts = 2; // Try original token, then refreshed token

    while (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`[Deploy] Attempt ${attemptCount}/${maxAttempts} - Requesting OAuth token from GHL...`);
        console.log('[Deploy] Company ID:', tokenData.company_id?.substring(0, 10) + '...');
        console.log('[Deploy] Location ID:', locationId?.substring(0, 10) + '...');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
                signal: controller.signal,
            });

            clearTimeout(timeout);
            const text = await resp.text();

            console.log('[Deploy] OAuth response status:', resp.status);
            console.log('[Deploy] OAuth response preview:', text.substring(0, 100));

            // Success case
            if (resp.ok && !text.trim().startsWith('<')) {
                const data = JSON.parse(text);
                console.log('[Deploy] ✓ OAuth token obtained successfully');
                return { success: true, access_token: data.access_token };
            }

            // If 401 Unauthorized and we haven't tried refreshing yet, refresh and retry
            if (resp.status === 401 && attemptCount === 1) {
                console.log('[Deploy] Token expired (401), attempting refresh...');
                const newToken = await refreshGHLToken(tokenData);

                if (newToken) {
                    accessToken = newToken;
                    continue; // Retry with new token
                } else {
                    console.log('[Deploy] ERROR: Token refresh failed - user needs to reconnect GHL');
                    return {
                        success: false,
                        error: 'GHL token expired and refresh failed. Please reconnect your GHL account.',
                        needsReconnect: true
                    };
                }
            }

            // Other errors
            console.log('[Deploy] ERROR: OAuth failed - HTML response or bad status');
            console.log('[Deploy] Full response:', text.substring(0, 500));
            return {
                success: false,
                error: 'OAuth failed',
                status: resp.status,
                preview: text.substring(0, 200)
            };

        } catch (e) {
            clearTimeout(timeout);
            console.log('[Deploy] ERROR: OAuth timeout/error:', e.message);
            if (attemptCount >= maxAttempts) {
                return { success: false, error: e.message };
            }
        }
    }

    return { success: false, error: 'Max OAuth attempts exceeded' };
}

/**
 * Fetch existing GHL custom values with timeout
 */
async function fetchExistingValues(locationId, accessToken) {
    console.log('[Deploy] Fetching existing custom values...');
    const allValues = [];
    let skip = 0;
    const maxPages = 3; // Limit to 300 values max
    let page = 0;

    while (page < maxPages) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per page

        try {
            const resp = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' },
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!resp.ok) {
                console.log(`[Deploy] Warning: Failed to fetch page ${page + 1}`);
                break;
            }

            const data = await resp.json();
            const values = data.customValues || [];
            allValues.push(...values);
            console.log(`[Deploy] Fetched page ${page + 1}: ${values.length} values (total: ${allValues.length})`);

            if (values.length < 100) break;
            skip += 100;
            page++;
        } catch (e) {
            clearTimeout(timeout);
            console.log(`[Deploy] Warning: Timeout/error fetching page ${page + 1}:`, e.message);
            break;
        }
    }

    console.log(`[Deploy] Total existing values found: ${allValues.length}`);
    return allValues;
}

/**
 * Update a single custom value (NEVER creates new)
 */
async function updateValue(locationId, accessToken, existingId, ghlKey, value) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const resp = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ name: ghlKey, value: String(value) }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);
        return { success: resp.ok, key: ghlKey };
    } catch (e) {
        clearTimeout(timeout);
        return { success: false, key: ghlKey, error: e.message };
    }
}

export async function POST(req) {
    const startTime = Date.now();
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push({ time: Date.now() - startTime, msg });
    };

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        const body = await req.json();
        const funnelId = body.funnelId || body.funnel_id;

        if (!funnelId) {
            return NextResponse.json({ error: 'funnelId required' }, { status: 400 });
        }

        // slot_index = GHL prefix number (3–12). Slot 3 is the base slot (03_ already in codebase).
        // Slots 4–12 are additional funnel slots created by admin.
        // Tier limits (by slot count): starter=1 (slot 3 only), growth=3 (03–05), scale=10 (03–12), admin=unlimited
        const slotIndexRaw = body.slot_index ?? body.slotIndex ?? null;
        let slotIndex = 3;
        // Auto-resolve slot from funnel assignment if not explicitly provided
        if (slotIndexRaw === null) {
            const { data: assignment } = await supabaseAdmin
                .from('funnel_slot_assignments')
                .select('slot_index')
                .eq('funnel_id', funnelId)
                .single();
            if (assignment?.slot_index) {
                slotIndex = assignment.slot_index;
                log(`[Deploy] Auto-resolved slot ${slotIndex} from funnel assignment`);
            }
        }
        if (slotIndexRaw !== null) {
            slotIndex = Number(slotIndexRaw);
            if (!Number.isInteger(slotIndex) || slotIndex < 3 || slotIndex > 12) {
                return NextResponse.json({ error: 'slot_index must be an integer 3–12' }, { status: 400 });
            }
            // Starter=1 slot (max 3), Growth=3 slots (max 5), Scale=10 slots (max 12), admin=unlimited
            const TIER_SLOT_LIMITS = { starter: 1, growth: 3, scale: 10, admin: 10 };
            const [{ data: authProfile }, { data: targetProfile }] = await Promise.all([
                supabaseAdmin
                    .from('user_profiles')
                    .select('subscription_tier, is_admin')
                    .eq('id', userId)
                    .maybeSingle(),
                supabaseAdmin
                    .from('user_profiles')
                    .select('subscription_tier, is_admin')
                    .eq('id', targetUserId)
                    .maybeSingle(),
            ]);
            const authTier = authProfile?.subscription_tier || 'starter';
            const targetTier = targetProfile?.subscription_tier || 'starter';
            const isTargetAdmin = authProfile?.is_admin || targetProfile?.is_admin || authTier === 'admin' || targetTier === 'admin';
            const tier = isTargetAdmin ? 'admin' : targetTier;
            const limit = TIER_SLOT_LIMITS[tier] ?? 1;
            // Admins bypass tier slot limits
            if (!isTargetAdmin && slotIndex > 2 + limit) {
                return NextResponse.json({ error: `Your plan allows up to ${limit} slot(s). Upgrade to access more.` }, { status: 403 });
            }
        }
        const slotPrefix = String(slotIndex).padStart(2, '0') + '_';
        const p = slotPrefix;
        // Base keys (emails, SMS, etc.) have no prefix on the default slot 3; all other slots prepend slot prefix
        const basePrefix = slotIndex === 3 ? '' : slotPrefix;

        log(`[Deploy] ========== STARTING DEPLOY ==========`);
        log(`[Deploy] Slot index: ${slotIndex} (prefix: "${p}"`);
        log(`[Deploy] Funnel ID: ${funnelId}`);
        log(`[Deploy] Auth User ID: ${userId}`);
        log(`[Deploy] Target User ID: ${targetUserId}`);

        // 1. Get sub-account (use targetUserId for owner's sub-account)
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, snapshot_id')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return NextResponse.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        log(`[Deploy] Location ID: ${subaccount.location_id}`);
        log(`[Deploy] Snapshot ID: ${subaccount.snapshot_id || 'none'}`);

        // Load stored GHL value IDs for this slot (ID fast-path)
        const { data: storedIds } = await supabaseAdmin
            .from('ghl_slot_custom_value_ids')
            .select('ghl_key, ghl_id')
            .eq('user_id', targetUserId)
            .eq('location_id', subaccount.location_id)
            .eq('slot_index', slotIndex);
        const idMap = new Map((storedIds || []).map(r => [r.ghl_key, r.ghl_id]));
        log(`[Deploy] Loaded ${idMap.size} stored IDs for slot ${slotIndex}`);

        // Remap module-level page maps from '03_' values to current slot prefix
        const dynMap = (map) => slotIndex === 3 ? map : Object.fromEntries(
            Object.entries(map).map(([k, v]) => [k, v.replace(/^03_/, slotPrefix)])
        );
        const OPTIN_MAP = dynMap(OPTIN_PAGE_MAP);
        const SALES_MAP = dynMap(SALES_PAGE_MAP);
        const CALENDAR_MAP = dynMap(CALENDAR_PAGE_MAP);
        const THANKYOU_MAP = dynMap(THANK_YOU_PAGE_MAP);

        // 2. Get OAuth token (use targetUserId for owner's token)
        const tokenResult = await getLocationToken(targetUserId, subaccount.location_id);
        if (!tokenResult.success) {
            return NextResponse.json({ error: tokenResult.error }, { status: 401 });
        }

        // 3. Fetch existing values (skip when all slot IDs are cached)
        let existingValues = [];
        if (idMap.size >= TOTAL_SLOT_KEYS) {
            log('[Deploy] All slot IDs cached — skipping fetchExistingValues');
        } else {
            existingValues = await fetchExistingValues(subaccount.location_id, tokenResult.access_token);
        }

        // Build lookup map with multiple key formats
        const existingMap = new Map();
        existingValues.forEach(v => {
            // Store by name in various formats
            existingMap.set(v.name, { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase(), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/\s+/g, '_'), { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), { id: v.id, name: v.name });
            // Remove dashes and spaces
            existingMap.set(v.name.replace(/[-\s]+/g, '_').toLowerCase(), { id: v.id, name: v.name });
            // Handle "Sub -Headline" -> "sub_headline"
            existingMap.set(v.name.replace(/\s*-\s*/g, '_').replace(/\s+/g, '_').toLowerCase(), { id: v.id, name: v.name });
        });

        // Add manual fixes for GHL typos - search by name patterns that exist in GHL
        // These keys have typos or special formats in GHL
        const typoFixes = {
            // Bio photo - GHL doesn't have "_text" suffix
            '02_vsl_bio_photo_text': existingMap.get('02_vsl_bio_photo') || existingMap.get('02 vsl bio photo'),
            // Optin headline - can be with or without "page"
            '02_optin_page_headline_text': existingMap.get('02_optin_headline_text') || existingMap.get('02 optin headline text'),
            // Text fields with typos
            '02_optin_subhealine_text': existingMap.get('02_optin_sub_headline_text') || existingMap.get('02_optin_sub-headline_text'),
            '02_vsl_process_sub_headline_text': existingMap.get('02_vsl_process_sub_headline_text') || existingMap.get('02_vsl_process_sub-headline_text'),
            '02_thankyou_page_subheadline_text': existingMap.get('02_thankyou_page_sub_headline_text') || existingMap.get('02_thankyou_page_sub-headline_text'),
            '02_vsl_testimonials_subheadline_text': existingMap.get('02_vsl_testimonials_sub_headline_text') || existingMap.get('02_vsl_testimonials_sub-headline_text'),
            // Color fields with typos - search by actual GHL names
            '02_optin_healine_text_colour': existingMap.get('02_optin_headline_text_colour'),
            '02_optin_subhealine_text_colour': existingMap.get('02_optin_sub_headline_text_colour') || existingMap.get('02_optin_sub-headline_text_colour'),
            '02_vsl_testimonials_subheadline_text_colour': existingMap.get('02_vsl_testimonials_sub_headline_text_colour') || existingMap.get('02_vsl_testimonials_sub-headline_text_colour'),
            '02_vsl_testimonial_review_1_headline_colour': existingMap.get('02_vsl_testimonial_reviews_headline_colour'),
            '02_vsl_testimonial_review_3_paragraph_with_name_colour': existingMap.get('02_vsl_testimonial_reviews_paragraph_with_name_colour'),
            '02_thankyou_page_subheadline_text_colour': existingMap.get('02_thankyou_page_sub_headline_text_colour') || existingMap.get('02_thankyou_page_sub-headline_text_colour'),
        };
        for (const [key, val] of Object.entries(typoFixes)) {
            if (val) existingMap.set(key, val);
        }

        // Also store by the GHL key format (from the custom value name patterns)
        existingValues.forEach(v => {
            // Try to extract the key from common patterns
            // "02 Optin Headline Text Colour" -> "02_optin_healine_text_colour" (GHL typo)
            if (v.name.includes('Optin') && v.name.includes('Headline') && v.name.includes('Colour')) {
                existingMap.set('02_optin_healine_text_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Optin') && v.name.includes('Sub') && v.name.includes('Colour')) {
                existingMap.set('02_optin_subhealine_text_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Testimonials') && v.name.includes('Sub') && v.name.includes('Text Colour')) {
                existingMap.set('02_vsl_testimonials_subheadline_text_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Testimonials') && v.name.includes('Sub') && !v.name.includes('Colour')) {
                existingMap.set('02_vsl_testimonials_subheadline_text', { id: v.id, name: v.name });
            }
            if (v.name === '02 VSL Testimonial Reviews Headline Colour') {
                existingMap.set('02_vsl_testimonial_review_1_headline_colour', { id: v.id, name: v.name });
            }
            if (v.name === '02 VSL Testimonial Reviews Paragraph with Name Colour') {
                existingMap.set('02_vsl_testimonial_review_3_paragraph_with_name_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Thankyou') && v.name.includes('Sub') && v.name.includes('Colour')) {
                existingMap.set('02_thankyou_page_subheadline_text_colour', { id: v.id, name: v.name });
            }
        });

        log(`[Deploy] Existing values in lookup: ${existingMap.size} entries`);

        // Debug: Show all custom value names that contain "bio" or "photo"
        const bioPhotoValues = existingValues.filter(v =>
            v.name.toLowerCase().includes('bio') || v.name.toLowerCase().includes('photo')
        );
        if (bioPhotoValues.length > 0) {
            log(`[Deploy] Bio/Photo custom values found in GHL:`);
            bioPhotoValues.forEach(v => log(`[Deploy]   - "${v.name}" (ID: ${v.id})`));
        }

        // 4. Fetch vault content (use targetUserId for owner's vault)
        const { data: vaultSections } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, content')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .eq('is_current_version', true);

        let vaultContent = {};
        (vaultSections || []).forEach(s => {
            vaultContent[s.section_id] = s.content;
        });

        log(`[Deploy] Vault sections loaded: ${Object.keys(vaultContent).join(', ')}`);

        // 4b. Fetch media fields from vault_content_fields (separate table for uploaded media)
        const { data: mediaFields } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .eq('section_id', 'media')
            .eq('is_current_version', true);

        // Build media object from uploaded fields
        const mediaFromFields = {};
        (mediaFields || []).forEach(f => {
            if (f.field_value) {
                mediaFromFields[f.field_id] = f.field_value;
            }
        });

        log(`[Deploy] Media fields from uploads: ${Object.keys(mediaFromFields).join(', ')} (${Object.keys(mediaFromFields).length} fields)`);

        const { data: colorField } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
            .eq('section_id', 'colors')
            .eq('field_id', 'colorPalette')
            .eq('is_current_version', true)
            .maybeSingle();

        let colorPaletteFromFields = null;
        if (colorField?.field_value) {
            try {
                colorPaletteFromFields = typeof colorField.field_value === 'string'
                    ? JSON.parse(colorField.field_value)
                    : colorField.field_value;
                log(`[Deploy] Color palette loaded from fields: ${Object.keys(colorPaletteFromFields || {}).join(', ')}`);
            } catch (error) {
                log(`[Deploy] ⚠ Failed to parse colorPalette field: ${error.message}`);
            }
        }

        // 5. Collect values to update (ONLY if existing key found)
        const results = { updated: 0, skipped: 0, notFound: 0, failed: 0 };
        const updatedKeys = [];
        const skippedKeys = [];
        const notFoundKeys = [];

        // Helper to find existing value - tries MULTIPLE naming formats
        // GHL uses inconsistent naming: "03_vsl_bio_image" vs "03 VSL Bio Image" vs "03 VSL Sub-Headline Text"
        const findExisting = (ghlKey) => {
            // 0. FAST PATH: direct lookup by stored ID (skips name-matching entirely)
            if (idMap.has(ghlKey)) return { id: idMap.get(ghlKey), name: ghlKey, source: 'stored_id' };

            // 1. Exact match
            if (existingMap.has(ghlKey)) return existingMap.get(ghlKey);

            // 2. Lowercase
            const lower = ghlKey.toLowerCase();
            if (existingMap.has(lower)) return existingMap.get(lower);

            // 3. Replace spaces with underscores
            const spacesToUnder = ghlKey.replace(/\s+/g, '_');
            if (existingMap.has(spacesToUnder)) return existingMap.get(spacesToUnder);

            // 4. Lowercase + replace spaces
            const lowerUnder = lower.replace(/\s+/g, '_');
            if (existingMap.has(lowerUnder)) return existingMap.get(lowerUnder);

            // 5. Replace underscores with spaces (GHL Title Case format)
            const underToSpaces = ghlKey.replace(/_/g, ' ');
            if (existingMap.has(underToSpaces)) return existingMap.get(underToSpaces);

            // 6. Title Case with spaces: "03_vsl_bio_image" → "03 VSL Bio Image"
            const titleCase = ghlKey
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            if (existingMap.has(titleCase)) return existingMap.get(titleCase);

            // 7. Lowercase with spaces
            const lowerSpaces = ghlKey.replace(/_/g, ' ').toLowerCase();
            if (existingMap.has(lowerSpaces)) return existingMap.get(lowerSpaces);

            // 8. Try matching without prefix (03_ or 02_)
            const withoutPrefix = ghlKey.replace(/^0[23]_/, '');
            const titleCaseNoPrefix = withoutPrefix.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            // Try "03 " + titleCase version
            if (existingMap.has('03 ' + titleCaseNoPrefix)) return existingMap.get('03 ' + titleCaseNoPrefix);
            if (existingMap.has('02 ' + titleCaseNoPrefix)) return existingMap.get('02 ' + titleCaseNoPrefix);

            // 9. Handle GHL's hyphenated naming: "subheadline" → "Sub-Headline"
            // Based on actual GHL custom value names:
            // - "03 Optin Sub-Headline Text" (Optin as one word)
            // - "03 VSL hero Sub-Headline Text" (hero lowercase)
            const toGhlFormat = (key) => {
                return key
                    // First handle double underscores → space-dash-space (like "Sub - Headline")
                    .replace(/__/g, ' - ')
                    // Then regular underscores to spaces
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                    // Specific word transforms for GHL naming
                    .replace(/Subheadline/gi, 'Sub-Headline')  // Hyphenated Sub-Headline
                    .replace(/Subtext/gi, 'Sub-Text')
                    .replace(/Thankyou/gi, 'Thankyou')
                    // Keep Optin as one word (NOT "Opt In") based on actual GHL names
                    .replace(/Opt In/gi, 'Optin')
                    .replace(/Vsl/gi, 'VSL')
                    .replace(/Cta/gi, 'CTA')
                    .replace(/Faq/gi, 'FAQ')
                    .replace(/Calender/gi, 'Calender')  // GHL spelling
                    .replace(/\bAbove\b/g, 'above')  // GHL uses lowercase 'above'
                    // GHL uses lowercase 'hero' in "03 VSL hero Sub-Headline Text"
                    .replace(/\bHero\b/g, 'hero');
            };

            const ghlFormat = toGhlFormat(ghlKey);
            if (existingMap.has(ghlFormat)) return existingMap.get(ghlFormat);

            // 10. Try with 03/02 prefix in GHL format
            const ghlFormatNoPrefix = toGhlFormat(withoutPrefix);
            if (existingMap.has('03 ' + ghlFormatNoPrefix)) return existingMap.get('03 ' + ghlFormatNoPrefix);
            if (existingMap.has('02 ' + ghlFormatNoPrefix)) return existingMap.get('02 ' + ghlFormatNoPrefix);

            // 11. Try lowercase hero → "hero" (GHL keeps some words lowercase)
            const ghlFormatLowerHero = ghlFormat.replace(/Hero/g, 'hero');
            if (existingMap.has(ghlFormatLowerHero)) return existingMap.get(ghlFormatLowerHero);

            return null;
        };

        // === PROCESS FUNNEL COPY (NEW 03_* STRUCTURE) ===
        log('[Deploy] Processing funnelCopy with new 03_* structure...');
        const funnelCopy = vaultContent.funnelCopy || {};
        const fcContent = funnelCopy.funnelCopy || funnelCopy; // Handle double-nesting

        log(`[Deploy] FunnelCopy pages: ${Object.keys(fcContent).join(', ')}`);

        // Process optinPage (4 fields)
        const optinPage = fcContent.optinPage || {};
        log(`[Deploy] optinPage fields: ${Object.keys(optinPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(optinPage)) {
            const ghlKey = OPTIN_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Not found: ${ghlKey}`);
            }
        }

        // Process salesPage/VSL (69 fields)
        const salesPage = fcContent.salesPage || {};
        log(`[Deploy] salesPage fields count: ${Object.keys(salesPage).length}`);

        for (const [vaultKey, value] of Object.entries(salesPage)) {
            const ghlKey = SALES_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Not found: ${ghlKey}`);
            }
        }

        // === PROCESS CALENDAR PAGE (2 fields) ===
        const calendarPage = fcContent.calendarPage || {};
        log(`[Deploy] calendarPage fields: ${Object.keys(calendarPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(calendarPage)) {
            const ghlKey = CALENDAR_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Not found: ${ghlKey}`);
            }
        }

        // === PROCESS THANK YOU PAGE (3 fields) ===
        const thankYouPage = fcContent.thankYouPage || {};
        log(`[Deploy] thankYouPage fields: ${Object.keys(thankYouPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(thankYouPage)) {
            const ghlKey = THANKYOU_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Not found: ${ghlKey}`);
            }
        }

        // === PROCESS COMPANY INFO FROM USER_PROFILES ===
        log('[Deploy] Fetching company info from user_profiles...');
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('business_name, email')
            .eq('id', targetUserId)  // Use targetUserId for owner's profile
            .single();

        if (profileError) {
            log(`[Deploy] ⚠ Profile fetch error: ${profileError.message}`);
        }

        if (userProfile) {
            log(`[Deploy] User profile found: business_name="${userProfile.business_name}", email="${userProfile.email}"`);

            // Company Name
            if (userProfile.business_name) {
                const companyNameKey = basePrefix + 'company_name';
                const existing = findExisting(companyNameKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, companyNameKey, userProfile.business_name);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(companyNameKey);
                        log(`[Deploy] ✓ Updated ${companyNameKey} = ${userProfile.business_name}`);
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(companyNameKey);
                    log(`[Deploy] ⚠ Not found: ${companyNameKey}`);
                }
            }

            // Company Email
            if (userProfile.email) {
                const companyEmailKey = `${p}company_email`;
                const existing = findExisting(companyEmailKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, companyEmailKey, userProfile.email);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(companyEmailKey);
                        log(`[Deploy] ✓ Updated ${companyEmailKey} = ${userProfile.email}`);
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(companyEmailKey);
                    log(`[Deploy] ⚠ Not found: ${companyEmailKey}`);
                }
            }
        } else {
            log('[Deploy] ⚠ No user profile found for Company Name/Email');
        }

        // === NORMALIZED SLOT BACKFILL ===
        // Keeps slots 04-12 aligned with the real vault shapes used by the editor.
        const normalizedSlotValues = buildSlotDeployCustomValues({
            vaultContent,
            mediaFromFields,
            userProfile,
            colorPaletteFromFields,
            // IMPORTANT: do NOT inject DEFAULT_MEDIA_VALUES here.
            // Passing the TMB/TedOS placeholders made every deploy overwrite the
            // customer's real, previously-pushed images with defaults whenever a
            // media field wasn't loaded that run — the "reverts to default image"
            // bug (Hoang Wellness / Lawrence Aquino opt-in pages). When a real
            // value is absent, the key is simply skipped and the existing GHL
            // value is preserved. Mirrors the safe admin push path.
            defaultMediaValues: {},
            slotIndex,
        });
        const normalizedSlotKeys = new Set(Object.keys(normalizedSlotValues));

        log(`[Deploy] Processing normalized slot mappings: ${Object.keys(normalizedSlotValues).length} values`);
        for (const [ghlKey, value] of Object.entries(normalizedSlotValues)) {
            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated normalized ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed normalized ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Normalized key not found: ${ghlKey}`);
            }
        }

        // === PROCESS COLORS (3 UNIVERSAL KEYS) ===
        log('[Deploy] Processing colors with 3 UNIVERSAL KEYS...');
        // Handle various storage locations for colors
        const colorsData = colorPaletteFromFields || vaultContent.colors || vaultContent.colorPalette || null;
        const palette = colorsData?.colorPalette || colorsData; // Handle nesting

        if (palette && typeof palette === 'object' && Object.keys(palette).length > 0) {
            log(`[Deploy] Color palette found: ${JSON.stringify(palette)}`);

            // Extract core colors (handle object with .hex or direct string)
            const getHex = (val) => (val && typeof val === 'object' ? val.hex : val) || null;

            const primary = getHex(palette.primary) || '#000000';
            const secondary = getHex(palette.secondary) || '#6B7280';
            const tertiary = getHex(palette.tertiary) || '#3B82F6';

            log(`[Deploy] Colors extracted: primary=${primary}, secondary=${secondary}, tertiary=${tertiary}`);

            // 3 Universal Color Keys (these exist in GHL)
            const universalColorMap = {
                [basePrefix + 'primary_color']: primary,
                [basePrefix + 'secondary_color']: secondary,
                [basePrefix + 'tertiary_color']: tertiary
            };

            for (const [ghlKey, hexVal] of Object.entries(universalColorMap)) {
                if (!hexVal) continue;
                if (normalizedSlotKeys.has(ghlKey)) continue;

                const existing = findExisting(ghlKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, hexVal);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(ghlKey);
                        log(`[Deploy] ✓ Updated ${ghlKey} = ${hexVal}`);
                    } else {
                        results.failed++;
                        log(`[Deploy] ✗ Failed to update ${ghlKey}`);
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(ghlKey);
                    log(`[Deploy] ⚠ Color key not found: ${ghlKey}`);
                }
            }
        } else {
            log('[Deploy] No color palette found in vault content');
        }

        // === PROCESS MEDIA (STRICT MAPPING) ===
        log('[Deploy] Processing media with STRICT MAPPING...');
        const mediaLibraryContent = vaultContent.mediaLibrary || vaultContent.media || {};

        // Use ONLY real media (vault content + uploaded fields).
        // DEFAULT_MEDIA_VALUES is intentionally NOT spread in here: pushing the
        // TMB/TedOS placeholder URLs on every deploy was overwriting the
        // customer's real images whenever a field wasn't loaded this run, causing
        // funnels to "revert to the default image." When a media key has no real
        // value, `if (!val) continue` below skips it and the existing GHL value
        // (the customer's real image, or the template's own placeholder) is left
        // untouched.
        const combinedMedia = {
            ...mediaLibraryContent,   // Vault content
            ...mediaFromFields        // Uploaded fields take priority
        };

        log(`[Deploy] Combined Media keys: ${Object.keys(combinedMedia).join(', ')}`);
        log(`[Deploy] Media source breakdown:`);
        for (const [key, val] of Object.entries(combinedMedia)) {
            if (!val) continue;
            const isDefault = DEFAULT_MEDIA_VALUES[key] === val;
            const isUploaded = mediaFromFields[key] === val;
            const source = isUploaded ? 'UPLOADED' : (isDefault ? 'DEFAULT' : 'VAULT');
            log(`[Deploy]   ${key}: ${source} (${val?.substring(0, 50)}...)`);
        }

        // Strict Mapping Definition - using ACTUAL vault field names
        // Vault fields: logo, bio_author, product_mockup, main_vsl, thankyou_video
        const strictMediaMap = {
            // Logo — slot-prefixed (04_logo_image for slot 4, etc.; '' for slot 3 = 'logo_image')
            [basePrefix + 'logo_image']: combinedMedia.logo || combinedMedia.logoUrl || combinedMedia.logo_url,

            // Bio/Author Photo — `profile_photo` is the LIVE vault field_id; rest are legacy aliases
            [`${p}vsl_bio_image`]: combinedMedia.profile_photo || combinedMedia.bio_author || combinedMedia.bioPhoto || combinedMedia.bio_photo,

            // Free Gift / Opt-in Mockup — `banner_image` is the LIVE vault field_id
            // (product_mockup is legacy). Reading banner_image first fixes the
            // "free gift image reverts to default" bug.
            [`${p}optin_mockup_image`]: combinedMedia.banner_image || combinedMedia.product_mockup || combinedMedia.mockup || combinedMedia.mockupImage,

            // VSL Video (convert YouTube watch URLs to embed format)
            [`${p}vsl_video_link`]: toEmbedUrl(combinedMedia.main_vsl || combinedMedia.vslVideo || combinedMedia.vsl_video),

            // Thank You Video (convert YouTube watch URLs to embed format)
            [`${p}thankyou_page_video_link`]: toEmbedUrl(combinedMedia.thankyou_video || combinedMedia.thankYouVideo || combinedMedia.thank_you_video),

            // Testimonials (from defaults or user uploads)
            [`${p}vsl_testimonial_review_1_image`]: combinedMedia.testimonial_review_1_image || combinedMedia.testimonial1Photo || combinedMedia.testimonial_1_photo,
            [`${p}vsl_testimonial_review_2_image`]: combinedMedia.testimonial_review_2_image || combinedMedia.testimonial2Photo || combinedMedia.testimonial_2_photo,
            [`${p}vsl_testimonial_review_3_image`]: combinedMedia.testimonial_review_3_image || combinedMedia.testimonial3Photo || combinedMedia.testimonial_3_photo,
            [`${p}vsl_testimonial_review_4_image`]: combinedMedia.testimonial_review_4_image || combinedMedia.testimonial4Photo || combinedMedia.testimonial_4_photo
        };

        // Log each media field attempt for debugging
        log(`[Deploy] Media mapping attempts:`);
        log(`[Deploy]   logo: ${strictMediaMap[basePrefix + 'logo_image'] ? '✓' : '✗'}`);
        log(`[Deploy]   bio_author: ${strictMediaMap[`${p}vsl_bio_image`] ? '✓' : '✗'}`);
        log(`[Deploy]   product_mockup: ${strictMediaMap[`${p}optin_mockup_image`] ? '✓' : '✗'}`);
        log(`[Deploy]   main_vsl: ${strictMediaMap[`${p}vsl_video_link`] ? '✓' : '✗'}`);
        log(`[Deploy]   thankyou_video: ${strictMediaMap[`${p}thankyou_page_video_link`] ? '✓' : '✗'}`);


        for (const [ghlKey, val] of Object.entries(strictMediaMap)) {
            if (!val) continue;
            if (normalizedSlotKeys.has(ghlKey)) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, val);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Media key not found: ${ghlKey}`);
            }
        }

        // Company Name from funnelCopy content
        const companyName = fcContent.company_name || optinPage.company_name || vaultContent.company_name;

        if (companyName) {
            const ghlKey = basePrefix + 'company_name';
            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, companyName);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                }
            } else {
                results.notFound++;
            }
        }

        // Note: Legacy bookingPage fields removed - not in new 03_* structure
        // Note: Emails, SMS, and appointment reminders are now pushed via /api/ghl/push-campaigns (Phase 3)

        const duration = Math.round((Date.now() - startTime) / 1000);
        log(`[Deploy] ========== DEPLOY COMPLETE ==========`);
        log(`[Deploy] Duration: ${duration}s`);
        log(`[Deploy] Updated: ${results.updated}`);
        log(`[Deploy] Not found in GHL: ${results.notFound}`);
        log(`[Deploy] Failed: ${results.failed}`);
        log(`[Deploy] Updated keys: ${updatedKeys.join(', ')}`);
        if (notFoundKeys.length > 0) {
            log(`[Deploy] Keys not found in GHL: ${notFoundKeys.join(', ')}`);
        }

        // Log deployment (use targetUserId for owner's logs)
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: targetUserId,
            event_type: 'deploy_completed',
            location_id: subaccount.location_id,
            metadata: { funnel_id: funnelId, ...results, duration_seconds: duration, updatedKeys, notFoundKeys, deployed_by: userId }
        });

        // Update funnel with deployed timestamp (use targetUserId for owner's funnel)
        await supabaseAdmin
            .from('user_funnels')
            .update({
                deployed_at: new Date().toISOString(),
                vault_generation_status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', funnelId)
            .eq('user_id', targetUserId);

        log(`[Deploy] ✓ Marked funnel ${funnelId} as deployed`);

        return NextResponse.json({
            success: results.updated > 0,
            message: `Updated ${results.updated} values (${results.notFound} not found in GHL, ${results.failed} failed)`,
            summary: results,
            duration: `${duration}s`,
            updatedKeys: updatedKeys.slice(0, 20),
            notFoundKeys: notFoundKeys.slice(0, 10),
            logs: logs, // Include all deployment logs for debugging
        });

    } catch (error) {
        console.error('[Deploy] FATAL ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
