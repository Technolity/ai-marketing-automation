/**
 * Coded Funnel — Design "coded-v1" — Sales Page renderer
 *
 * Returns ONE self-contained HTML document (its own <style>, no external CSS)
 * as a string. That string is what eventually gets pushed into a single GHL
 * custom value and rendered raw inside the GHL page's Custom Code element.
 *
 * Input `data` shape (all optional — every field has a fallback so the page
 * never renders blank):
 *   {
 *     brand:  { primary, secondary, businessName },
 *     copy:   { ...salesPage fields below... },
 *     media:  { logoUrl },
 *     embeds: { vslEmbedHtml }   // raw VSL video embed code, trusted
 *   }
 */

import { safeText, rawEmbed, readableTextColor } from '../escape.js';

const FALLBACK = {
  // Hero
  hero_headline_text: 'The Fastest Way To Get The Results You Want',
  hero_subheadline_text:
    'Watch the short video below, then book your call to see exactly how we can help you.',
  hero_cta_text: 'Book Your Call Now',

  // Process (6 steps)
  process_1_headline: 'Step 1',
  process_1_subheadline: 'We start by understanding your goals.',
  process_2_headline: 'Step 2',
  process_2_subheadline: 'We build a tailored plan around them.',
  process_3_headline: 'Step 3',
  process_3_subheadline: 'We put the systems in place for you.',
  process_4_headline: 'Step 4',
  process_4_subheadline: 'We launch and start getting results.',
  process_5_headline: 'Step 5',
  process_5_subheadline: 'We optimize based on real data.',
  process_6_headline: 'Step 6',
  process_6_subheadline: 'We scale what works and keep growing.',

  // How it works (3 points)
  how_it_works_headline: 'How It Works',
  how_it_works_point_1: 'Book a quick call so we can learn about your business.',
  how_it_works_point_2: 'We map out a clear, step-by-step plan for you.',
  how_it_works_point_3: 'We get to work and you start seeing results.',

  // Audience callout — who it's FOR
  audience_callout_for_1: 'You are serious about growing your business.',
  audience_callout_for_2: 'You are ready to invest in real results.',
  audience_callout_for_3: 'You want a proven system, not guesswork.',

  // Audience callout — who it's NOT for
  audience_callout_not_1: 'You are looking for a quick, overnight fix.',
  audience_callout_not_2: 'You are not willing to follow a process.',
  audience_callout_not_3: 'You are happy with where things are.',

  // Call expectations — what the call IS for
  call_expectations_is_for_bullet_1: 'A clear breakdown of your current situation.',
  call_expectations_is_for_bullet_2: 'A custom roadmap to your goal.',
  call_expectations_is_for_bullet_3: 'Honest advice, whether we work together or not.',

  // Call expectations — what the call is NOT for
  call_expectations_not_for_bullet_1: 'A high-pressure sales pitch.',
  call_expectations_not_for_bullet_2: 'Generic, one-size-fits-all advice.',
  call_expectations_not_for_bullet_3: 'Wasting your time.',

  // Bio
  bio_paragraph_text:
    'We have spent years helping businesses like yours get real, measurable results — and we would love to do the same for you.',

  // Testimonials (4)
  testimonial_review_1_headline: 'This changed everything for us.',
  testimonial_review_1_subheadline_with_name: 'Happy Client',
  testimonial_review_2_headline: 'Best decision we made this year.',
  testimonial_review_2_subheadline_with_name: 'Happy Client',
  testimonial_review_3_headline: 'The results speak for themselves.',
  testimonial_review_3_subheadline_with_name: 'Happy Client',
  testimonial_review_4_headline: 'I wish we had done this sooner.',
  testimonial_review_4_subheadline_with_name: 'Happy Client',

  // FAQ (4)
  faq_question_1: 'How quickly will I see results?',
  faq_answer_1: 'Most clients start seeing momentum within the first few weeks.',
  faq_question_2: 'Is this right for my business?',
  faq_answer_2: 'Book a call and we will tell you honestly if we can help.',
  faq_question_3: 'How much does it cost?',
  faq_answer_3: 'We will walk you through the options on your call.',
  faq_question_4: 'What happens after I book?',
  faq_answer_4: 'You will get a confirmation and we will see you on the call.',

  // Final CTA
  final_cta_headline: 'Ready To Get Started?',
  final_cta_subheadline: 'Book your call now and let us show you what is possible.',
  final_cta_text: 'Book Your Call Now',

  // Footer
  footer_text: 'All rights reserved.',

  // Brand
  primary: '#2563eb',
  secondary: '#1e3a8a',
  businessName: 'Your Business',
};

export function renderSalesPage(data = {}) {
  const brand = data.brand || {};
  const copy = data.copy || {};
  const media = data.media || {};
  const embeds = data.embeds || {};

  // Resolve colors and the readable text color that sits ON the primary button.
  const primary = brand.primary || FALLBACK.primary;
  const secondary = brand.secondary || FALLBACK.secondary;
  const onPrimary = readableTextColor(primary);
  const businessName = safeText(brand.businessName || FALLBACK.businessName);

  // Small helper: resolve a copy field, fall back, then escape. All vault text
  // goes through safeText() — only the VSL embed uses rawEmbed().
  const t = (key) => safeText(copy[key] || FALLBACK[key]);

  // Hero
  const heroHeadline = t('hero_headline_text');
  const heroSubheadline = t('hero_subheadline_text');
  const heroCta = t('hero_cta_text');

  // Process (6 steps)
  const processSteps = [1, 2, 3, 4, 5, 6].map((n) => ({
    headline: t(`process_${n}_headline`),
    subheadline: t(`process_${n}_subheadline`),
  }));

  // How it works (3 points)
  const howHeadline = t('how_it_works_headline');
  const howPoints = [
    t('how_it_works_point_1'),
    t('how_it_works_point_2'),
    t('how_it_works_point_3'),
  ];

  // Audience callout (for / not)
  const audienceFor = [
    t('audience_callout_for_1'),
    t('audience_callout_for_2'),
    t('audience_callout_for_3'),
  ];
  const audienceNot = [
    t('audience_callout_not_1'),
    t('audience_callout_not_2'),
    t('audience_callout_not_3'),
  ];

  // Call expectations (is / not)
  const callIsFor = [
    t('call_expectations_is_for_bullet_1'),
    t('call_expectations_is_for_bullet_2'),
    t('call_expectations_is_for_bullet_3'),
  ];
  const callNotFor = [
    t('call_expectations_not_for_bullet_1'),
    t('call_expectations_not_for_bullet_2'),
    t('call_expectations_not_for_bullet_3'),
  ];

  // Bio
  const bio = t('bio_paragraph_text');

  // Testimonials (4)
  const testimonials = [1, 2, 3, 4].map((n) => ({
    headline: t(`testimonial_review_${n}_headline`),
    name: t(`testimonial_review_${n}_subheadline_with_name`),
  }));

  // FAQ (4)
  const faqs = [1, 2, 3, 4].map((n) => ({
    question: t(`faq_question_${n}`),
    answer: t(`faq_answer_${n}`),
  }));

  // Final CTA
  const finalHeadline = t('final_cta_headline');
  const finalSubheadline = t('final_cta_subheadline');
  const finalCta = t('final_cta_text');

  // Footer
  const footer = t('footer_text');

  // Logo is a URL attribute, not body text → escape it the same way (handles quotes).
  const logoUrl = media.logoUrl ? safeText(media.logoUrl) : '';

  // The VSL video embed is TRUSTED raw HTML. If absent, show a labelled slot
  // so the page is obviously "video goes here" instead of silently empty.
  const vslBlock = embeds.vslEmbedHtml
    ? rawEmbed(embeds.vslEmbedHtml)
    : '<div class="vsl-slot">[ VSL video embeds here ]</div>';

  const processHtml = processSteps
    .map(
      (s) =>
        `<div class="step"><h3>${s.headline}</h3><p>${s.subheadline}</p></div>`
    )
    .join('');

  const howPointsHtml = howPoints
    .map((p) => `<li>${p}</li>`)
    .join('');

  const audienceForHtml = audienceFor
    .map((p) => `<li class="yes">${p}</li>`)
    .join('');
  const audienceNotHtml = audienceNot
    .map((p) => `<li class="no">${p}</li>`)
    .join('');

  const callIsForHtml = callIsFor
    .map((p) => `<li class="yes">${p}</li>`)
    .join('');
  const callNotForHtml = callNotFor
    .map((p) => `<li class="no">${p}</li>`)
    .join('');

  const testimonialsHtml = testimonials
    .map(
      (tm) =>
        `<figure class="testimonial"><blockquote>${tm.headline}</blockquote><figcaption>${tm.name}</figcaption></figure>`
    )
    .join('');

  const faqHtml = faqs
    .map(
      (f) =>
        `<div class="faq"><h3>${f.question}</h3><p>${f.answer}</p></div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${heroHeadline}</title>
<style>
  :root {
    --brand-primary: ${primary};
    --brand-secondary: ${secondary};
    --on-primary: ${onPrimary};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: #f8fafc;
    line-height: 1.5;
  }
  .wrap { max-width: 960px; margin: 0 auto; padding: 0 20px; }
  header.site {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px 0;
    text-align: center;
  }
  header.site .logo { max-height: 48px; }
  header.site .brand-name { font-size: 18px; font-weight: 700; color: var(--brand-secondary); }
  section { padding: 56px 0; }
  .hero {
    background: linear-gradient(160deg, var(--brand-secondary) 0%, var(--brand-primary) 100%);
    color: #ffffff;
    text-align: center;
  }
  .hero h1 { font-size: 38px; line-height: 1.15; margin-bottom: 18px; }
  .hero .sub { font-size: 19px; opacity: 0.92; max-width: 700px; margin: 0 auto 28px; }
  .vsl-slot {
    border: 2px dashed rgba(255,255,255,0.6);
    border-radius: 12px;
    padding: 64px 24px;
    color: rgba(255,255,255,0.85);
    font-size: 15px;
    max-width: 720px;
    margin: 0 auto 28px;
  }
  .vsl-embed { max-width: 720px; margin: 0 auto 28px; }
  .cta {
    display: inline-block;
    background: var(--brand-primary);
    color: var(--on-primary);
    font-size: 18px;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    padding: 16px 36px;
    cursor: pointer;
    text-decoration: none;
  }
  .hero .cta {
    background: #ffffff;
    color: var(--brand-primary);
  }
  h2 { font-size: 28px; text-align: center; margin-bottom: 36px; color: #111827; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .step {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
  }
  .step h3 { font-size: 18px; margin-bottom: 8px; color: var(--brand-primary); }
  .step p { font-size: 15px; color: #4b5563; }
  .how { background: #ffffff; }
  .how ul { list-style: none; max-width: 640px; margin: 0 auto; }
  .how li {
    font-size: 17px;
    padding: 16px 0 16px 36px;
    border-bottom: 1px solid #f1f5f9;
    position: relative;
  }
  .how li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--brand-primary);
    font-weight: 700;
  }
  .two-col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .callout-col {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 28px;
  }
  .callout-col h3 { font-size: 18px; margin-bottom: 16px; }
  .callout-col ul { list-style: none; }
  .callout-col li {
    font-size: 16px;
    padding: 8px 0 8px 28px;
    position: relative;
  }
  .callout-col li.yes::before { content: '✓'; color: #16a34a; position: absolute; left: 0; font-weight: 700; }
  .callout-col li.no::before { content: '✗'; color: #dc2626; position: absolute; left: 0; font-weight: 700; }
  .bio { background: #ffffff; }
  .bio p { max-width: 720px; margin: 0 auto; font-size: 18px; color: #374151; text-align: center; }
  .testimonials { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .testimonial {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
  }
  .testimonial blockquote { font-size: 17px; color: #111827; margin-bottom: 12px; }
  .testimonial figcaption { font-size: 14px; font-weight: 600; color: var(--brand-primary); }
  .faqs { max-width: 720px; margin: 0 auto; }
  .faq {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 14px;
  }
  .faq h3 { font-size: 17px; margin-bottom: 8px; }
  .faq p { font-size: 15px; color: #4b5563; }
  .final {
    background: linear-gradient(160deg, var(--brand-secondary) 0%, var(--brand-primary) 100%);
    color: #ffffff;
    text-align: center;
  }
  .final h2 { color: #ffffff; }
  .final .sub { font-size: 18px; opacity: 0.92; margin-bottom: 28px; }
  .final .cta { background: #ffffff; color: var(--brand-primary); }
  footer.site {
    background: #0f172a;
    color: #94a3b8;
    text-align: center;
    padding: 24px 0;
    font-size: 13px;
  }
  @media (max-width: 480px) {
    .hero h1 { font-size: 28px; }
    h2 { font-size: 23px; }
    section { padding: 40px 0; }
    .steps { grid-template-columns: 1fr; }
    .two-col { grid-template-columns: 1fr; }
    .testimonials { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <header class="site">
    <div class="wrap">
      ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="${businessName}" />` : `<div class="brand-name">${businessName}</div>`}
    </div>
  </header>
  <section class="hero">
    <div class="wrap">
      <h1>${heroHeadline}</h1>
      <p class="sub">${heroSubheadline}</p>
      ${embeds.vslEmbedHtml ? `<div class="vsl-embed">${vslBlock}</div>` : vslBlock}
      <a class="cta" href="#book">${heroCta}</a>
    </div>
  </section>
  <section class="process">
    <div class="wrap">
      <h2>Our Process</h2>
      <div class="steps">${processHtml}</div>
    </div>
  </section>
  <section class="how">
    <div class="wrap">
      <h2>${howHeadline}</h2>
      <ul>${howPointsHtml}</ul>
    </div>
  </section>
  <section class="audience">
    <div class="wrap">
      <h2>Is This For You?</h2>
      <div class="two-col">
        <div class="callout-col"><h3>This is for you if&hellip;</h3><ul>${audienceForHtml}</ul></div>
        <div class="callout-col"><h3>This is NOT for you if&hellip;</h3><ul>${audienceNotHtml}</ul></div>
      </div>
    </div>
  </section>
  <section class="expectations">
    <div class="wrap">
      <h2>What To Expect On The Call</h2>
      <div class="two-col">
        <div class="callout-col"><h3>What the call IS for</h3><ul>${callIsForHtml}</ul></div>
        <div class="callout-col"><h3>What the call is NOT for</h3><ul>${callNotForHtml}</ul></div>
      </div>
    </div>
  </section>
  <section class="bio">
    <div class="wrap">
      <h2>About Us</h2>
      <p>${bio}</p>
    </div>
  </section>
  <section class="testimonials-section">
    <div class="wrap">
      <h2>What Our Clients Say</h2>
      <div class="testimonials">${testimonialsHtml}</div>
    </div>
  </section>
  <section class="faq-section">
    <div class="wrap">
      <h2>Frequently Asked Questions</h2>
      <div class="faqs">${faqHtml}</div>
    </div>
  </section>
  <section class="final" id="book">
    <div class="wrap">
      <h2>${finalHeadline}</h2>
      <p class="sub">${finalSubheadline}</p>
      <a class="cta" href="#book">${finalCta}</a>
    </div>
  </section>
  <footer class="site">
    <div class="wrap">${footer} &middot; ${businessName}</div>
  </footer>
</body>
</html>`;
}
