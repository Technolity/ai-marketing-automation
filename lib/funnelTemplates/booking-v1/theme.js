/**
 * Coded Funnel — Design "booking-v1" — SHARED THEME.
 *
 * One source of truth for the dark editorial design system so the funnel-step pages
 * (qualify, calendar, thankYou) stay visually identical to the landing page without
 * copy-pasting CSS.
 *
 * GHL split: CSS goes to ONE custom value (external/custom-CSS field); HTML+JS go to
 * chunked custom values (custom-code element). So pages return a `*_css` segment (raw
 * stylesheet from themeCss, fonts via @import — NO <style> tag) plus body/foot HTML
 * fragments. assembleSegments() re-wraps the CSS in <style> for local preview.
 *
 * Minify-safe: no newlines relied upon. Brand color drives all tints via color-mix.
 */

/** Core CSS shared by every booking-v1 page (raw rules — no <style> tag). */
const CORE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: var(--body); color: var(--ink); background: var(--bg); line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; min-height: 100dvh;
    background-image: radial-gradient(60% 50% at 82% -5%, color-mix(in srgb, var(--brand-primary) 24%, transparent), transparent 70%), radial-gradient(55% 45% at -5% 6%, color-mix(in srgb, var(--brand-secondary) 32%, transparent), transparent 70%);
    background-attachment: fixed; }
  img { max-width: 100%; display: block; }
  .wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
  h1, h2, h3 { font-family: var(--display); line-height: 1.06; letter-spacing: -0.02em; font-weight: 700; }
  h1 { font-size: clamp(2rem, 4.6vw, 3.2rem); }
  h2 { font-size: clamp(1.6rem, 3.4vw, 2.4rem); }
  .eyebrow { display: inline-block; font-weight: 600; font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--brand-accent); margin-bottom: 14px; }
  .sub { color: var(--ink-dim); font-size: clamp(1.02rem, 1.5vw, 1.2rem); }
  .btn { display: inline-flex; align-items: center; gap: 10px; background: var(--brand-primary); color: var(--on-primary); font-family: var(--body); font-weight: 700; border: none; border-radius: 999px; padding: 15px 30px; text-decoration: none; cursor: pointer; box-shadow: 0 10px 30px color-mix(in srgb, var(--brand-primary) 42%, transparent); transition: transform .18s ease, box-shadow .18s ease; }
  .btn:hover { transform: translateY(-3px); box-shadow: 0 18px 44px color-mix(in srgb, var(--brand-primary) 54%, transparent); }
  .btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.4; }
  .btn-lg { padding: 18px 38px; font-size: 1.08rem; }
  .topbar { position: sticky; top: 0; z-index: 40; backdrop-filter: blur(12px); background: color-mix(in srgb, var(--brand-primary) 30%, var(--bg)); border-bottom: 1px solid color-mix(in srgb, var(--brand-accent) 45%, var(--line)); }
  .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; }
  .brand { font-family: var(--display); font-weight: 700; font-size: 1.1rem; color: var(--ink); }
  .brand .logo { max-height: 34px; }
  .step-pill { font-size: 0.8rem; letter-spacing: 0.05em; color: var(--ink-dim); border: 1px solid var(--line); border-radius: 999px; padding: 7px 16px; }
  .panel { background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: clamp(28px, 4vw, 48px); box-shadow: 0 30px 80px rgba(0,0,0,0.4); }
  .trust { list-style: none; display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-top: 24px; }
  .trust li { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--ink-dim); }
  .tick { width: 17px; height: 17px; fill: none; stroke: var(--brand-primary); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; flex: none; }
  footer { text-align: center; padding: 40px 24px; font-size: 0.85rem; color: var(--ink-dim); border-top: 1px solid var(--line); }
  .js .reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
  .js .reveal.in-view { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .js .reveal { opacity: 1; transform: none; transition: none; }
    .btn:hover { transform: none; }
  }
`;

/**
 * The page stylesheet as a RAW string (no <style> tag) — goes into GHL's CSS custom value.
 * Fonts load via @import (must be first). Tokens carry the per-user brand color.
 */
export function themeCss(primary, secondary, accent, onPrimary, onAccent, pageCss = '') {
  const acc = accent || secondary || primary;
  const onAcc = onAccent || onPrimary || '#111111';
  return `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
  :root { --brand-primary: ${primary}; --brand-secondary: ${secondary}; --brand-accent: ${acc}; --on-primary: ${onPrimary}; --on-accent: ${onAcc};
    --bg: color-mix(in srgb, var(--brand-secondary) 13%, #07070a);
    --surface: color-mix(in srgb, var(--brand-primary) 9%, #111118);
    --surface-2: color-mix(in srgb, var(--brand-secondary) 15%, #16161e);
    --ink: #f4f3ee; --ink-dim: #a3a39c; --line: color-mix(in srgb, var(--brand-primary) 16%, rgba(255,255,255,0.09));
    --display: 'Bricolage Grotesque', Georgia, serif; --body: 'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif; --maxw: 1120px; }
${CORE_CSS}
${pageCss}`;
}

/** Minimal funnel-step top bar: logo + optional step indicator. No nav links (reduce exits). */
export function miniTopbar({ logoUrl, businessName, step }) {
  return `<div class="topbar"><div class="wrap topbar-inner"><span class="brand">${logoUrl ? `<img class="logo" src="${logoUrl}" alt="${businessName}" />` : businessName}</span>${step ? `<span class="step-pill">${step}</span>` : ''}</div></div>`;
}

/** Footer + shared reveal-on-scroll observer. NO closing </body></html> (the assembler adds them). */
export function pageFoot({ businessName, footer }) {
  return `
<footer>&copy; ${businessName} &middot; ${footer}</footer>
<script>
(function(){
  if(!('IntersectionObserver' in window)){document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in-view');});return;}
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target);}});},{threshold:0.18});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
})();
</script>`;
}
