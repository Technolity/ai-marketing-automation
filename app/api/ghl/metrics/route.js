
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Base API URL for GHL V2
const GHL_API_URL = 'https://services.leadconnectorhq.com';

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/ghl/metrics
 * Fetches commercial metrics from GHL for the dashboard
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check cache first
        const cacheKey = `ghl_metrics_${userId}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('[GHL Metrics] Serving from cache');
            return NextResponse.json(cached.data);
        }

        // 1. Get GHL Credentials
        const { data: credentials, error } = await supabaseAdmin
            .from('ghl_credentials')
            .select('access_token, location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error || !credentials) {
            return NextResponse.json({
                connected: false,
                metrics: {
                    pipelineValue: 0,
                    activeOpportunities: 0,
                    pipelines: 0
                }
            });
        }

        const { access_token, location_id } = credentials;

        // 2. Fetch Metrics from GHL
        // We'll fetch Opportunities to calculate value and count
        const metrics = await fetchGHLMetrics(access_token, location_id);

        const response = {
            connected: true,
            locationId: location_id,
            metrics
        };

        // Store in cache
        cache.set(cacheKey, { data: response, timestamp: Date.now() });

        return NextResponse.json(response);

    } catch (error) {
        console.error('[GHL Metrics] Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch metrics',
            details: error.message
        }, { status: 500 });
    }
}

async function fetchGHLMetrics(accessToken, locationId) {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
    };

    try {
        // A. Get Pipelines (for stage names)
        const pipelinesRes = await fetch(`${GHL_API_URL}/opportunities/pipelines?locationId=${locationId}`, { headers });
        const pipelinesData = await pipelinesRes.json();
        const pipelineCount = pipelinesData.pipelines ? pipelinesData.pipelines.length : 0;

        // Map stage IDs to names
        const stageNames = {};
        if (pipelinesData.pipelines) {
            pipelinesData.pipelines.forEach(p => {
                p.stages.forEach(s => {
                    stageNames[s.id] = s.name;
                });
            });
        }

        // B. Get ALL Opportunities (not just open) to calculate efficiency/win-rates
        // GHL uses POST for opportunities/search endpoint
        console.log('[GHL Metrics] Fetching opportunities for location:', locationId);

        const oppsRes = await fetch(
            `${GHL_API_URL}/opportunities/search`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    locationId: locationId,
                    limit: 100
                })
            }
        );

        console.log('[GHL Metrics] Opportunities response status:', oppsRes.status);

        if (!oppsRes.ok) {
            console.error('[GHL Metrics] Opportunities API error:', oppsRes.status, oppsRes.statusText);
            // Clone response to read body twice
            const errorText = await oppsRes.clone().text();
            console.error('[GHL Metrics] Error response:', errorText);
        }

        const oppsData = await oppsRes.json();
        console.log('[GHL Metrics] Opportunities data structure:', {
            hasOpportunities: !!oppsData.opportunities,
            count: oppsData.opportunities?.length || 0,
            totalCount: oppsData.total || oppsData.count || 'N/A',
            keys: Object.keys(oppsData)
        });

        const opps = oppsData.opportunities || oppsData.opps || [];

        // Debug: Log first 5 opportunities to inspect values
        if (opps.length > 0) {
            console.log('[GHL Metrics] Sample opportunities (first 5):',
                opps.slice(0, 5).map(opp => ({
                    id: opp.id,
                    monetaryValue: opp.monetaryValue,
                    status: opp.status,
                    source: opp.source || opp.contact?.source,
                    pipelineStageId: opp.pipelineStageId
                }))
            );
        }

        // --- AGGREGATIONS ---

        let totalValue = 0;
        let activeOpps = 0;
        let wonValue = 0;

        // 1. Status Distribution (Donut Chart)
        const statusMap = { 'open': 0, 'won': 0, 'lost': 0, 'abandoned': 0 };

        // 2. Funnel Performance (Bar Chart)
        const funnelMap = {}; // stageId -> count

        // 3. Lead Source Report (Table)
        const sourceMap = {}; // source -> { total, value, won }

        // 4. Efficiency Metrics
        let totalDuration = 0; // ms
        let closedCount = 0;

        opps.forEach(opp => {
            const val = parseFloat(opp.monetaryValue) || 0;
            const status = (opp.status || 'open').toLowerCase();
            const source = opp.source || opp.contact?.source || 'Direct Traffic';
            const stageId = opp.pipelineStageId;

            // Totals
            if (status === 'open') {
                totalValue += val;
                activeOpps++;
            }
            if (status === 'won') {
                wonValue += val;
            }

            // Status Map
            if (statusMap[status] !== undefined) statusMap[status]++;
            else statusMap['abandoned']++; // Default to abandoned for unknown closed states

            // Funnel Map
            if (stageId) {
                funnelMap[stageId] = (funnelMap[stageId] || 0) + 1;
            }

            // Source Map
            if (!sourceMap[source]) sourceMap[source] = { total: 0, value: 0, won: 0 };
            sourceMap[source].total++;
            sourceMap[source].value += val;
            if (status === 'won') sourceMap[source].won++;

            // Duration (Mock logic if dates missing, else avg time to close)
            if (status === 'won' || status === 'lost') {
                const start = new Date(opp.createdAt || opp.dateAdded);
                const end = new Date(opp.updatedAt);
                const duration = end - start;
                if (duration > 0) {
                    totalDuration += duration;
                    closedCount++;
                }
            }
        });

        // --- FORMATTING FOR FRONTEND ---

        // 1. Status Data
        const statusData = [
            { name: 'Open', value: statusMap.open, color: '#06b6d4' }, // Cyan
            { name: 'Won', value: statusMap.won, color: '#22c55e' },   // Green
            { name: 'Lost', value: statusMap.lost, color: '#ef4444' }, // Red
            { name: 'Abandoned', value: statusMap.abandoned, color: '#64748b' } // Slate
        ].filter(d => d.value > 0);

        // 2. Funnel Data (Top 5 Stages by volume)
        const funnelData = Object.entries(funnelMap)
            .map(([id, count]) => ({
                name: stageNames[id] || 'Unknown Stage',
                value: count
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 3. Lead Sources (Sorted by Value)
        const leadSources = Object.entries(sourceMap)
            .map(([name, stats]) => ({
                source: name,
                leads: stats.total,
                value: stats.value,
                winRate: stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // 4. Efficiency
        const avgDurationDays = closedCount > 0 ? Math.round(totalDuration / closedCount / (1000 * 60 * 60 * 24)) : 0;
        const salesVelocity = avgDurationDays > 0 ? Math.round((wonValue / avgDurationDays) * 30) : 0; // Value per month roughly

        // 5. Revenue Trend (Last 6 Months)
        const revenueTrend = calculateRevenueTrend(opps);
        const totalRevenue = revenueTrend.reduce((sum, month) => sum + month.revenue, 0);
        const avgDealSize = opps.filter(o => o.status === 'won').length > 0
            ? Math.round(wonValue / opps.filter(o => o.status === 'won').length)
            : 0;

        // Calculate revenue growth (current month vs previous month)
        const currentMonthRevenue = revenueTrend.length > 0 ? revenueTrend[revenueTrend.length - 1].revenue : 0;
        const previousMonthRevenue = revenueTrend.length > 1 ? revenueTrend[revenueTrend.length - 2].revenue : 0;
        const revenueGrowth = previousMonthRevenue > 0
            ? `${currentMonthRevenue > previousMonthRevenue ? '+' : ''}${Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)}%`
            : '+0%';

        return {
            pipelineValue: totalValue,
            activeOpportunities: activeOpps,
            pipelines: pipelineCount,

            // New Aggregates
            statusData,
            funnelData,
            leadSources,
            efficiency: {
                avgDuration: avgDurationDays > 0 ? `${avgDurationDays}d` : '0s',
                totalWon: wonValue,
                velocity: salesVelocity
            },

            // Revenue Trend Data
            revenueTrend,
            totalRevenue,
            avgDealSize,
            revenueGrowth
        };

    } catch (error) {
        console.error('[GHL Metrics] Fetch error:', error);
        return {
            pipelineValue: 0,
            activeOpportunities: 0,
            pipelines: 0,
            statusData: [],
            funnelData: [],
            leadSources: [],
            efficiency: { avgDuration: '0s', totalWon: 0, velocity: 0 },
            revenueTrend: [],
            totalRevenue: 0,
            avgDealSize: 0,
            revenueGrowth: '+0%',
            error: 'API_ERROR'
        };
    }
}

/**
 * Calculate monthly revenue trend for the last 6 months
 */
function calculateRevenueTrend(opportunities) {
    const now = new Date();
    const monthsData = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        monthsData.push({
            month: monthName,
            monthKey: monthKey,
            revenue: 0
        });
    }

    // Aggregate won deals by month
    opportunities.forEach(opp => {
        if (opp.status !== 'won') return;

        const updatedDate = new Date(opp.updatedAt || opp.dateAdded);
        const oppMonthKey = updatedDate.toISOString().slice(0, 7);

        const monthData = monthsData.find(m => m.monthKey === oppMonthKey);
        if (monthData) {
            monthData.revenue += parseFloat(opp.monetaryValue) || 0;
        }
    });

    // Return formatted data (remove monthKey, keep only month and revenue)
    return monthsData.map(({ month, revenue }) => ({
        month,
        revenue: Math.round(revenue)
    }));
}
