/**
 * Coded Funnel — CONTRAST helpers (pure hex math, no deps).
 *
 * THE RULE (every bake, every page): every piece of text — CTA, section copy, navbar,
 * footer, eyebrow — must contrast its background, and every brand accent must be visible
 * against the surface it sits on. Brand colors are arbitrary (a user may pick dark navy,
 * black, pastels), so we never trust them to be readable as-is:
 *   - text ON a colored surface  → readableText(surface)  (near-black or cream, whichever wins)
 *   - a brand color USED as an accent/CTA on a dark page → contrastColor() lightens (or darkens)
 *     it, keeping its hue, until it meets a minimum contrast ratio against that page.
 *
 * WCAG relative luminance + contrast ratio. Self-contained so it's trivially testable.
 */

const CREAM = '#F5F1EA';
const NEAR_BLACK = '#0B0B0F';

const clamp = (n) => Math.max(0, Math.min(255, n));

function parseHex(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toHex(r, g, b) {
  return '#' + [r, g, b].map((x) => clamp(Math.round(x)).toString(16).padStart(2, '0')).join('');
}
function channelLum(c) {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0–1). */
export function luminance(hex) {
  const p = parseHex(hex);
  if (!p) return 0;
  return 0.2126 * channelLum(p[0]) + 0.7152 * channelLum(p[1]) + 0.0722 * channelLum(p[2]);
}

/** WCAG contrast ratio (1–21) between two colors. */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Linear blend a→b by t (0..1). */
export function mix(a, b, t) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  return toHex(pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t);
}

/** Best readable text color (cream or near-black) for a given background. */
export function readableText(bg) {
  return contrastRatio(CREAM, bg) >= contrastRatio(NEAR_BLACK, bg) ? CREAM : NEAR_BLACK;
}

/**
 * Return `hex` adjusted (lightened on a dark bg, darkened on a light bg) just enough to meet
 * `minRatio` contrast against `bg`, keeping the hue direction. If it already passes, returns it
 * normalized. If it can't reach the ratio, returns the closest (most contrasting) attempt.
 */
export function contrastColor(hex, bg, minRatio = 4.5) {
  const p = parseHex(hex);
  if (!p) return readableText(bg);
  const normalized = toHex(p[0], p[1], p[2]);
  if (contrastRatio(normalized, bg) >= minRatio) return normalized;
  const target = luminance(bg) < 0.18 ? '#ffffff' : '#000000';
  let best = normalized;
  let bestRatio = contrastRatio(normalized, bg);
  for (let t = 0.08; t <= 1.0001; t += 0.08) {
    const c = mix(normalized, target, t);
    const r = contrastRatio(c, bg);
    if (r > bestRatio) { best = c; bestRatio = r; }
    if (r >= minRatio) return c;
  }
  return best;
}
