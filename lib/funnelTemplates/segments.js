/**
 * Coded Funnel — page SEGMENTS.
 *
 * A "doc" page (coded-v1) renders to ONE HTML string → ONE GHL custom value.
 * A "segments" page (booking-v1) renders to an ORDERED list of named chunks:
 *
 *     [ { name: 'bv1_landing_head',  html: '<!DOCTYPE html>...<body>' },
 *       { name: 'bv1_landing_body1', html: '<section>...</section>' },
 *       { name: 'bv1_landing_body2', html: '<section>...</section>' },
 *       { name: 'bv1_landing_foot',  html: '<script>...</script></body></html>' } ]
 *
 * Why split a page at all: a full animated landing page with inline CSS can exceed
 * GHL's per-custom-value size limit. Each segment is pushed to its own custom value
 * and stitched back together IN ORDER inside the GHL page builder:
 *     {{custom_values.bv1_landing_head}}{{custom_values.bv1_landing_body1}}...
 *
 * The split points are authored by hand inside each renderer (CSS in *_head, whole
 * <section>s in *_body*, closing tags in *_foot) — we never chop a string blindly,
 * so a tag is never split down the middle.
 *
 * `name` becomes the GHL custom-value name, so it must satisfy the same charset as
 * mergeTag() keys: lowercase letters, digits, underscores.
 */

const SEGMENT_NAME_RE = /^[a-z0-9_]+$/;

/** True if `x` is a non-empty array of { name, html } in valid shape. */
export function isSegments(x) {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.every(
      (s) =>
        s &&
        typeof s.name === 'string' &&
        SEGMENT_NAME_RE.test(s.name) &&
        typeof s.html === 'string'
    )
  );
}

/**
 * Concatenate segments back into one full HTML document — exactly the order GHL
 * will stitch them. Used for the local browser preview and the admin iframe.
 */
export function assembleSegments(segments) {
  if (!isSegments(segments)) {
    throw new Error('assembleSegments: expected a non-empty array of { name, html }');
  }
  // GHL splits HTML (custom-code element) from CSS (external/custom-CSS field). A segment
  // whose name ends in `_css` holds the raw stylesheet; the rest are body HTML fragments.
  // For LOCAL preview we re-assemble a real document by wrapping the CSS in <style>.
  const cssSeg = segments.find((s) => s.name.endsWith('_css'));
  if (!cssSeg) return segments.map((s) => s.html).join(''); // legacy full-doc fragments (coded-v1)
  const body = segments.filter((s) => s !== cssSeg).map((s) => s.html).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${cssSeg.html}</style></head><body>${body}</body></html>`;
}

/** True if a segment name is the CSS segment (its content is a raw stylesheet, not HTML). */
export function isCssSegment(name) {
  return typeof name === 'string' && name.endsWith('_css');
}

/**
 * Minify each segment INDEPENDENTLY (so a head/body/foot boundary is never re-joined
 * into one over-limit value). Imported lazily to avoid a circular import with escape.js.
 */
export function minifySegments(segments, minifyFn) {
  if (!isSegments(segments)) {
    throw new Error('minifySegments: expected a non-empty array of { name, html }');
  }
  return segments.map((s) => ({ name: s.name, html: minifyFn(s.html) }));
}

/** UTF-8 byte length of one string (matches what GHL stores, not JS char count). */
export function byteLength(str) {
  return Buffer.byteLength(String(str ?? ''), 'utf8');
}

/** Sum of byte lengths across all segments — for the size-limit check. */
export function totalBytes(segments) {
  if (!isSegments(segments)) return 0;
  return segments.reduce((sum, s) => sum + byteLength(s.html), 0);
}
