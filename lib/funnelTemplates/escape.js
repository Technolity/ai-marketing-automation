/**
 * Coded Funnel — HTML escaping & safety helpers
 *
 * Every piece of AI-generated / user-edited copy gets baked into a raw HTML
 * string that is pushed into a GoHighLevel custom value and rendered RAW on a
 * published page. That means any unescaped `<`, `>`, `"`, or `{{ }}` in the
 * copy can either (a) break the page layout, (b) open an XSS hole, or
 * (c) collide with GHL's own `{{custom_values.x}}` merge-tag syntax.
 *
 * Rule for the whole template layer:
 *   - ALL text from the vault must pass through `safeText()` before it touches HTML.
 *   - Raw HTML is allowed ONLY for known-safe embed slots (GHL form/calendar codes),
 *     which go through `rawEmbed()` so the intent is explicit and greppable.
 */

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape the five HTML-significant characters. Order matters: `&` must go first. */
export function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}

/**
 * Neutralize literal `{{` / `}}` so user copy can never be mistaken for a GHL
 * merge tag. We swap the braces for their HTML entities — they still DISPLAY as
 * `{{` to the visitor, but GHL's parser won't treat them as a tag.
 * Must run AFTER escapeHtml (so the entity `&` we add here isn't re-escaped).
 */
export function neutralizeMergeTags(input) {
  return String(input ?? '')
    .replace(/\{\{/g, '&#123;&#123;')
    .replace(/\}\}/g, '&#125;&#125;');
}

/** The one function templates should call for any vault text. Escape, then de-fang braces. */
export function safeText(input) {
  return neutralizeMergeTags(escapeHtml(input));
}

/**
 * Pass-through for trusted raw HTML (GHL form/calendar embed codes ONLY).
 * It does NOT escape — that is the entire point — so never feed it vault copy.
 * Wrapping it in a named function makes every raw-HTML injection easy to audit.
 */
export function rawEmbed(trustedHtml) {
  return String(trustedHtml ?? '');
}

/**
 * Emit a LITERAL GHL merge tag — `{{custom_values.<key>}}` — that must survive
 * baking completely untouched, so GHL substitutes a USER-controlled custom value
 * at render time (e.g. their calendar/form embed code).
 *
 * This is the deliberate opposite of safeText(): safeText() de-fangs `{{` so user
 * COPY can never be mistaken for a tag; mergeTag() produces a REAL tag on purpose.
 * Because the two are mutually destructive, a merge tag must NEVER be passed
 * through safeText(). minifyHtml() is safe — it only touches whitespace.
 *
 * The key is validated against /^[a-z0-9_]+$/ so vault copy can never reach this
 * path and smuggle markup into a "trusted" tag.
 */
export function mergeTag(key) {
  if (!/^[a-z0-9_]+$/.test(String(key))) {
    throw new Error(`Unsafe merge-tag key: ${key}`);
  }
  return `{{custom_values.${key}}}`;
}

/**
 * Collapse rendered HTML to a SINGLE LINE before baking it into a GHL custom value.
 *
 * Why this exists: GHL's UI silently strips newlines when you paste into a custom
 * value field, but the API does not. A multiline value breaks GHL's merge-tag
 * rendering on the published page ({{custom_values.x}} won't resolve until the
 * value is manually re-saved) — the same class of bug as the funnel bio section
 * that had to be made "paragraph-less". Stripping newlines + inter-tag whitespace
 * makes the API push render directly, with no manual cut/paste in GHL.
 *
 * Safe for this block-level template; do NOT use on markup that relies on
 * significant whitespace between inline elements or inside <pre>.
 */
export function minifyHtml(html) {
    return String(html ?? '')
        .replace(/\r?\n/g, '')     // drop newlines (the actual culprit)
        .replace(/\t/g, '')        // drop tabs
        .replace(/>\s+</g, '><')   // remove whitespace-only gaps between tags
        .replace(/\s{2,}/g, ' ')   // collapse remaining whitespace runs
        .trim();
}

/**
 * Choose black or white body text for a given background hex, by luminance,
 * so a dark brand color never ends up with unreadable dark text on it.
 *
 * NOTE: this is a deliberately small stand-in. When we wire the render pipeline
 * we will swap this for the project's existing `getContrastingTextColor()` /
 * `ensureReadableColor()` utilities rather than maintain two copies.
 */
export function readableTextColor(hex) {
  const h = String(hex || '').replace('#', '').trim();
  if (h.length !== 3 && h.length !== 6) return '#111111';
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Relative luminance (sRGB approximation). > 0.55 = light bg → use dark text.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#111111' : '#ffffff';
}
