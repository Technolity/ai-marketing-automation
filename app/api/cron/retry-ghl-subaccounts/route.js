/**
 * GHL Sub-Account Retry Cron Job
 * Automatically retries failed sub-account creations every hour
 *
 * GET /api/cron/retry-ghl-subaccounts
 *
 * Setup: Add to Vercel cron (vercel.json) with schedule "0 * * * *" (hourly)
 *
 * Algorithm:
 * 1. Query users with failed status, retry eligible (not permanently failed, retry count < 5)
 * 2. Process in batches of 10 to prevent timeouts
 * 3. Track all attempts in ghl_subaccount_logs
 * 4. Update retry metadata after each attempt
 * 5. Classify errors to determine retry vs permanent failure
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount } from '@/lib/ghl/createSubAccount';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_RETRY_ATTEMPTS = 5;
const BATCH_SIZE = 10;

export async function GET(req) {
  const startTime = Date.now();

  try {
    // Verify cron secret (same pattern as refresh-ghl-token)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[GHL Retry Cron] Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GHL Retry Cron] Starting retry job...');

    // Query retry-eligible users
    const now = new Date().toISOString();
    const { data: retryUsers, error: queryError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, business_name, phone, timezone, ghl_retry_count, ghl_last_retry_at')
      .eq('ghl_sync_status', 'failed')
      .eq('ghl_permanently_failed', false)
      .lt('ghl_retry_count', MAX_RETRY_ATTEMPTS)
      .or(`ghl_next_retry_at.is.null,ghl_next_retry_at.lte.${now}`)
      .is('ghl_location_id', null) // Only retry if no location created yet
      .limit(BATCH_SIZE);

    if (queryError) {
      console.error('[GHL Retry Cron] Query error:', queryError);
      throw queryError;
    }

    if (!retryUsers || retryUsers.length === 0) {
      console.log('[GHL Retry Cron] No users eligible for retry');
      return NextResponse.json({
        message: 'No users to retry',
        processed: 0,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[GHL Retry Cron] Found ${retryUsers.length} users to retry`);

    // Process each user
    const results = {
      success: 0,
      failed: 0,
      permanentFailures: 0,
      errors: []
    };

    for (const user of retryUsers) {
      try {
        const retryAttempt = user.ghl_retry_count + 1;
        console.log(`[GHL Retry Cron] Retrying user ${user.email} (attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS})`);

        // Update to pending before retry
        await supabase
          .from('user_profiles')
          .update({
            ghl_sync_status: 'pending',
            ghl_last_retry_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // Attempt sub-account creation
        const result = await createGHLSubAccount(user.id, {
          email: user.email,
          fullName: user.full_name,
          businessName: user.business_name,
          phone: user.phone,
          timezone: user.timezone
        });

        if (result.success) {
          // Success - reset retry count
          await supabase
            .from('user_profiles')
            .update({
              ghl_retry_count: 0,
              ghl_next_retry_at: null,
              ghl_permanently_failed: false
            })
            .eq('id', user.id);

          // Log successful retry
          await supabase
            .from('ghl_subaccount_logs')
            .insert({
              user_id: user.id,
              request_payload: { email: user.email, fullName: user.full_name },
              ghl_location_id: result.locationId,
              status: 'success',
              retry_attempt: retryAttempt,
              is_retry: true,
              triggered_by: 'cron'
            });

          results.success++;
          console.log(`[GHL Retry Cron] ✓ User ${user.email} sub-account created successfully`);

        } else {
          // Failed - determine if retryable
          const errorType = classifyError(result.error);
          const isLastAttempt = retryAttempt >= MAX_RETRY_ATTEMPTS;
          const isPermanentError = errorType === 'permanent';

          if (isLastAttempt || isPermanentError) {
            // Permanent failure - stop retrying
            await supabase
              .from('user_profiles')
              .update({
                ghl_sync_status: 'permanently_failed',
                ghl_permanently_failed: true,
                ghl_retry_count: retryAttempt,
                ghl_next_retry_at: null
              })
              .eq('id', user.id);

            results.permanentFailures++;
            console.error(`[GHL Retry Cron] ✗ User ${user.email} permanently failed (${isPermanentError ? 'permanent error' : 'max retries exceeded'})`);

          } else {
            // Retryable failure - schedule next retry
            const nextRetryTime = calculateNextRetry(retryAttempt, errorType);

            await supabase
              .from('user_profiles')
              .update({
                ghl_sync_status: 'failed',
                ghl_retry_count: retryAttempt,
                ghl_next_retry_at: nextRetryTime
              })
              .eq('id', user.id);

            results.failed++;
            console.log(`[GHL Retry Cron] ⟳ User ${user.email} will retry at ${nextRetryTime}`);
          }

          // Log the retry attempt
          await supabase
            .from('ghl_subaccount_logs')
            .insert({
              user_id: user.id,
              request_payload: { email: user.email, fullName: user.full_name },
              status: 'failed',
              error_message: result.error,
              error_type: errorType,
              retry_attempt: retryAttempt,
              is_retry: true,
              triggered_by: 'cron'
            });
        }

      } catch (userError) {
        console.error(`[GHL Retry Cron] Error processing user ${user.id}:`, userError);
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: userError.message
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[GHL Retry Cron] Completed in ${duration}ms`, results);

    return NextResponse.json({
      message: 'Retry job completed',
      results,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GHL Retry Cron] Fatal error:', error);
    return NextResponse.json({
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * Classify error type for retry logic
 * @param {string} errorMessage - Error message from GHL API
 * @returns {string} - 'permanent', 'rate_limit', or 'retryable'
 */
function classifyError(errorMessage) {
  if (!errorMessage) return 'retryable';

  const msg = errorMessage.toLowerCase();

  // Permanent errors (don't retry) - these won't fix themselves
  if (
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('invalid') ||
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('bad request') ||
    msg.includes('400') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('409')
  ) {
    return 'permanent';
  }

  // Rate limit errors (exponential backoff)
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many')) {
    return 'rate_limit';
  }

  // Everything else is retryable (network errors, timeouts, 500s)
  return 'retryable';
}

/**
 * Calculate next retry timestamp based on attempt count and error type
 * @param {number} attemptCount - Current retry attempt (1-5)
 * @param {string} errorType - Error classification
 * @returns {string} - ISO timestamp for next retry
 */
function calculateNextRetry(attemptCount, errorType) {
  // Rate limit: exponential backoff (1hr, 2hr, 4hr, 8hr, 16hr max)
  if (errorType === 'rate_limit') {
    const hours = Math.pow(2, Math.min(attemptCount - 1, 4));
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }

  // Default: fixed 1-hour retry interval
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}
