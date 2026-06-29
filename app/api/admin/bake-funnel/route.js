/**
 * ADMIN-ONLY — Bake a baked-engine funnel from its REAL vault content.
 *
 * End-to-end local test path: an admin generates a funnel, picks the baked "Appointment
 * Booking" type, then bakes here. Reads the funnel's vault (funnelCopy + media + colors)
 * READ-ONLY, runs it through funnelCopyToRenderData → renderCodedSegments → minify.
 *
 *   POST { funnelId }                 → JSON { pages:[{page,segments,assembledHtml,...}], ... } (for the admin UI)
 *   GET  ?funnelId=…&page=landing     → raw text/html of that page (full-page viewer in a new tab)
 *
 * NO database writes (honors the shared-prod-DB rule). NO GHL push yet.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { renderCodedSegments } from '@/lib/funnelTemplates/coded-v1/registry';
import { minifySegments, byteLength, assembleSegments, isCssSegment } from '@/lib/funnelTemplates/segments';
import { minifyHtml } from '@/lib/funnelTemplates/escape';
import { funnelCopyToRenderData } from '@/lib/funnelTemplates/booking-v1/funnelCopyMapper';
import { getFunnelConfig } from '@/lib/funnelTemplates/funnelTypeRegistry';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdmin() {
  const { userId } = auth();
  if (!userId) return { error: 'Unauthorized', status: 401 };
  if (!(await verifyAdmin(userId))) return { error: 'Admin access required', status: 403 };
  return { userId };
}

const parse = (v) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
};

/** Group current-version vault_content_fields rows into { sectionId: { field_id: value } }. */
function groupFields(rows) {
  const out = {};
  for (const r of rows || []) {
    if (String(r.field_id).includes('.')) continue; // nested entry already merged into parent
    (out[r.section_id] = out[r.section_id] || {})[r.field_id] = parse(r.field_value);
  }
  return out;
}

/** Read a funnel's vault + bake all its pages. Returns { error,status } on failure. */
async function bakeFunnel(funnelId) {
  if (!funnelId) return { error: 'funnelId is required', status: 400 };

  const { data: funnel } = await supabaseAdmin
    .from('user_funnels')
    .select('id, user_id, selected_funnel_type')
    .eq('id', funnelId)
    .maybeSingle();
  if (!funnel) return { error: 'Funnel not found', status: 404 };

  const ownerId = funnel.user_id;
  const cfg = getFunnelConfig(funnel.selected_funnel_type);

  const { data: rows, error: rowsErr } = await supabaseAdmin
    .from('vault_content_fields')
    .select('section_id, field_id, field_value')
    .eq('funnel_id', funnelId)
    .eq('user_id', ownerId)
    .eq('is_current_version', true)
    .in('section_id', ['funnelCopy', 'media', 'colors']);
  if (rowsErr) return { error: 'Failed to read vault fields', status: 500 };

  const grouped = groupFields(rows);
  const funnelCopy = grouped.funnelCopy || {};
  const media = grouped.media || {};
  let colorPalette = (grouped.colors && grouped.colors.colorPalette) || grouped.colors || {};

  if (!colorPalette || !Object.keys(colorPalette).length) {
    const { data: vc } = await supabaseAdmin
      .from('vault_content').select('content')
      .eq('funnel_id', funnelId).eq('user_id', ownerId).eq('section_id', 'colors').maybeSingle();
    colorPalette = (vc && vc.content && vc.content.colorPalette) || colorPalette;
  }

  const { data: profile } = await supabaseAdmin
    .from('user_profiles').select('business_name').eq('id', ownerId).maybeSingle();
  const businessName = profile?.business_name || '';

  // Diagnostic: resolve the brand colors exactly as the renderer does, so the admin can SEE
  // whether the vault palette was read (vs falling back to template defaults).
  const hex = (v) => (v && typeof v === 'object' ? v.hex : v) || null;
  const resolvedBrand = {
    primary: hex(colorPalette.primary) || hex(colorPalette.primaryColor) || null,
    secondary: hex(colorPalette.secondary) || hex(colorPalette.secondaryColor) || null,
    accent: hex(colorPalette.accent) || hex(colorPalette.tertiary) || hex(colorPalette.accentColor) || null,
  };
  const colorsFound = Boolean(resolvedBrand.primary || resolvedBrand.secondary || resolvedBrand.accent);

  const design = cfg.design || 'booking-v1';
  const pageKeys = cfg.engine === 'baked' ? cfg.pages : ['landing', 'calendar', 'thankYou'];

  const pages = pageKeys.map((page) => {
    const data = funnelCopyToRenderData(page, { funnelCopy, media, colorPalette, businessName });
    const segments = minifySegments(renderCodedSegments(design, page, data), minifyHtml);
    const sized = segments.map((s) => ({ name: s.name, bytes: byteLength(s.html), kind: isCssSegment(s.name) ? 'css' : 'html', html: s.html }));
    // The CSS segment goes to GHL's CSS field; the HTML chunks concat in a custom-code element.
    const htmlNames = sized.filter((s) => s.kind === 'html').map((s) => s.name);
    return {
      page,
      segments: sized.map(({ name, bytes, kind }) => ({ name, bytes, kind })),
      assembledHtml: assembleSegments(sized),
      totalBytes: sized.reduce((sum, s) => sum + s.bytes, 0),
      mergeTagString: htmlNames.map((n) => `{{custom_values.${n}}}`).join(''),
    };
  });

  return {
    success: true,
    funnelId,
    ownerId,
    selectedFunnelType: funnel.selected_funnel_type || null,
    design,
    hasContent: Object.keys(funnelCopy).length > 0,
    brand: resolvedBrand,
    colorsFound,
    pages,
  };
}

export async function POST(req) {
  try {
    const gate = await requireAdmin();
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { funnelId } = await req.json();
    const result = await bakeFunnel(funnelId);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[BakeFunnel] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Full-page viewer: returns ONE baked page as a real HTML document for a new tab. */
export async function GET(req) {
  try {
    const gate = await requireAdmin();
    if (gate.error) {
      return new Response(`<!DOCTYPE html><meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">${gate.error}</body>`, {
        status: gate.status, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnelId');
    const page = searchParams.get('page') || 'landing';

    const result = await bakeFunnel(funnelId);
    if (result.error) {
      return new Response(`<!DOCTYPE html><meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">Bake failed: ${result.error}</body>`, {
        status: result.status, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    const pg = result.pages.find((p) => p.page === page) || result.pages[0];
    return new Response(pg.assembledHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[BakeFunnel GET] Error:', err);
    return new Response(`<!DOCTYPE html><meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">Error: ${err.message}</body>`, {
      status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
