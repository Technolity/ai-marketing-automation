/**
 * clientDocRenderer.js  (CommonJS — used by the Next API route AND the CLI script)
 * -----------------------------------------------------------------------------
 * Turns vault export data (the shape produced by /api/admin/funnels/export json)
 * into a polished, CLIENT-FACING HTML document that prints cleanly to PDF.
 *
 * Generic + dependency-free: walks each section's content JSONB recursively,
 * humanizes field keys, groups sections by phase, lays out with print CSS.
 *
 * Input shape (array of funnels):
 *   [{ funnel_name, funnel_description, selected_funnel_type,
 *      user:{ full_name, email, subscription_tier },
 *      vault_content:[{ section_id, section_title, phase, status, content }] }]
 */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// camelCase / snake_case / "email1" -> "Email 1", "oneLineMessage" -> "One Line Message"
function humanize(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

const SKIP_KEYS = new Set(['id', 'field_id', 'numericKey', 'numeric_key', 'version', '__typename', 'is_current_version']);

function paragraphs(text) {
  return String(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function renderValue(value, depth) {
  if (isEmpty(value)) return '';

  if (typeof value === 'string') return paragraphs(value);
  if (typeof value === 'number' || typeof value === 'boolean') return `<p>${esc(value)}</p>`;

  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => typeof v !== 'object' || v === null);
    if (allPrimitive) {
      return `<ul>${value.filter((v) => !isEmpty(v)).map((v) => `<li>${esc(v)}</li>`).join('')}</ul>`;
    }
    return value
      .filter((v) => !isEmpty(v))
      .map((v, i) => `<div class="item"><div class="item-no">${i + 1}</div><div class="item-body">${renderValue(v, depth + 1)}</div></div>`)
      .join('\n');
  }

  const level = Math.min(depth, 6);
  return Object.entries(value)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && !isEmpty(v))
    .map(([k, v]) => {
      const label = humanize(k);
      const body = renderValue(v, depth + 1);
      const nested = typeof v === 'object' && v !== null;
      if (nested) {
        return `<div class="field"><h${level} class="field-label">${esc(label)}</h${level}>${body}</div>`;
      }
      return `<div class="field"><div class="kv-label">${esc(label)}</div>${body}</div>`;
    })
    .join('\n');
}

const PHASE_LABELS = {
  1: 'Phase 1 — Business Core',
  2: 'Phase 2 — Funnel Assets',
  3: 'Phase 3 — Traffic & Content',
  4: 'Phase 4 — Scripts & Follow-up',
};

function renderFunnel(funnel) {
  const sections = (funnel.vault_content || []).filter((s) => !isEmpty(s.content));
  const byPhase = new Map();
  for (const s of sections) {
    const p = s.phase || 1;
    if (!byPhase.has(p)) byPhase.set(p, []);
    byPhase.get(p).push(s);
  }
  const phases = [...byPhase.keys()].sort((a, b) => a - b);
  const sectionCount = sections.length;

  const cover = `
    <header class="cover">
      <div class="brand">TedOS</div>
      <h1>${esc(funnel.funnel_name || 'Generated Content')}</h1>
      ${funnel.funnel_description ? `<p class="subtitle">${esc(funnel.funnel_description)}</p>` : ''}
      <dl class="meta">
        ${funnel.user?.full_name ? `<div><dt>Prepared for</dt><dd>${esc(funnel.user.full_name)}</dd></div>` : ''}
        ${funnel.user?.email ? `<div><dt>Account</dt><dd>${esc(funnel.user.email)}</dd></div>` : ''}
        ${funnel.selected_funnel_type ? `<div><dt>Funnel type</dt><dd>${esc(String(funnel.selected_funnel_type).toUpperCase())}</dd></div>` : ''}
        <div><dt>Sections</dt><dd>${sectionCount}</dd></div>
      </dl>
    </header>`;

  const body = phases
    .map((p) => {
      const items = byPhase.get(p);
      const secHtml = items
        .map(
          (s) => `
        <section class="vault-section">
          <h2>${esc(s.section_title || humanize(s.section_id))}</h2>
          <div class="section-content">${renderValue(s.content, 3) || '<p class="muted">No content.</p>'}</div>
        </section>`
        )
        .join('\n');
      return `<div class="phase"><div class="phase-rule"><span>${esc(PHASE_LABELS[p] || `Phase ${p}`)}</span></div>${secHtml}</div>`;
    })
    .join('\n');

  return `<article class="funnel">${cover}${body}</article>`;
}

/**
 * @param {Array} funnels  array of funnel export objects (or a single object)
 * @param {object} [opts]
 * @param {string} [opts.generatedOn]  human date string for the footer
 * @returns {string} full standalone HTML document
 */
function renderClientDoc(funnels, opts = {}) {
  const list = Array.isArray(funnels) ? funnels : [funnels];
  const generatedOn = opts.generatedOn || '';
  const clientName = list[0]?.user?.full_name || list[0]?.user?.email || 'Client';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(clientName)} — Generated Content</title>
<style>
  :root{ --ink:#10192B; --muted:#5A6B82; --rule:#E2E8F0; --accent:#0E7C86; --accent-soft:#E6F3F4; --paper:#FFFFFF; }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:#EEF1F5;color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    font-size:11.5pt;line-height:1.6;}
  .page{max-width:820px;margin:24px auto;background:var(--paper);padding:56px 64px;box-shadow:0 1px 4px rgba(16,25,43,.08);}
  h1,h2,h3,h4,h5,h6{font-family:Georgia,"Times New Roman",serif;color:var(--ink);line-height:1.25;}
  .funnel + .funnel{margin-top:48px;}
  .cover{padding-bottom:28px;border-bottom:2px solid var(--ink);margin-bottom:36px;}
  .brand{font-weight:700;letter-spacing:.18em;color:var(--accent);font-size:12pt;text-transform:uppercase;font-family:-apple-system,Segoe UI,sans-serif;}
  .cover h1{font-size:30pt;margin:.25em 0 .1em;}
  .cover .subtitle{color:var(--muted);font-size:13pt;margin:.2em 0 1.2em;max-width:46em;}
  dl.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 32px;margin:0;}
  dl.meta>div{display:flex;gap:10px;align-items:baseline;}
  dl.meta dt{color:var(--muted);font-size:9.5pt;text-transform:uppercase;letter-spacing:.06em;min-width:90px;font-family:-apple-system,Segoe UI,sans-serif;}
  dl.meta dd{margin:0;font-weight:600;}
  .phase{margin-top:30px;}
  .phase-rule{display:flex;align-items:center;gap:14px;margin:36px 0 18px;}
  .phase-rule span{font-family:-apple-system,Segoe UI,sans-serif;font-size:9.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);white-space:nowrap;}
  .phase-rule::after{content:"";flex:1;height:1px;background:var(--rule);}
  .vault-section{padding:18px 0;border-bottom:1px solid var(--rule);}
  .vault-section h2{font-size:18pt;margin:0 0 .5em;}
  .section-content h3,.section-content h4,.section-content h5,.section-content h6{font-family:-apple-system,Segoe UI,sans-serif;margin:1.1em 0 .3em;color:var(--ink);}
  .section-content h3{font-size:12.5pt;font-weight:700;}
  .section-content h4{font-size:11pt;font-weight:700;color:#33405A;}
  .field{margin:.4em 0;}
  .kv-label{font-family:-apple-system,Segoe UI,sans-serif;font-size:9pt;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-top:.8em;}
  p{margin:.35em 0;}
  ul{margin:.35em 0 .6em;padding-left:1.2em;}
  li{margin:.2em 0;}
  .muted{color:var(--muted);font-style:italic;}
  .item{display:flex;gap:14px;padding:12px 0;border-top:1px dashed var(--rule);}
  .item:first-child{border-top:none;}
  .item-no{flex:0 0 26px;height:26px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-family:-apple-system,Segoe UI,sans-serif;font-weight:700;font-size:10pt;display:flex;align-items:center;justify-content:center;}
  .item-body{flex:1;min-width:0;}
  @page{size:A4;margin:18mm 16mm;}
  @media print{
    html,body{background:#fff;font-size:10.5pt;}
    .page{box-shadow:none;margin:0;max-width:none;padding:0;}
    .funnel{break-before:page;}
    .funnel:first-child{break-before:auto;}
    .vault-section{break-inside:avoid;}
    .item{break-inside:avoid;}
  }
</style>
</head>
<body>
  <div class="page">
    ${list.map(renderFunnel).join('\n')}
    <footer style="margin-top:40px;padding-top:14px;border-top:1px solid var(--rule);color:var(--muted);font-size:9pt;">
      Generated by TedOS · ${esc(clientName)}${generatedOn ? ` · ${esc(generatedOn)}` : ''}
    </footer>
  </div>
</body>
</html>`;
}

module.exports = { renderClientDoc, humanize, renderValue };
