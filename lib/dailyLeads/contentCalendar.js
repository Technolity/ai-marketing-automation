/**
 * Curated 30-Day Content Calendar — Daily Leads
 *
 * A researched, proven organic-content framework for SERVICE BUSINESSES running an
 * appointment-generating VSL funnel with a free-gift (lead magnet) on the front.
 * Goal of the calendar: build authority + trust and drive traffic to the free-gift
 * opt-in page, where a direct free-gift CTA lands roughly every 6th day
 * (days 1, 7, 13, 19, 25, 30) and the rest mix education, proof, story, objection
 * handling, behind-the-scenes and engagement.
 *
 * Templates are PARAMETRIZED with the user's vault context (free gift, niche, offer,
 * transformation) and are fully editable in the UI — proven structure, not a cage.
 *
 * Placeholders supported in caption/imageBrief templates:
 *   {{freeGiftName}} {{niche}} {{transformation}} {{offerName}} {{keyword}}
 */

export const CATEGORIES = {
  CTA: 'Free Gift CTA',
  EDUCATIONAL: 'Educational',
  PROOF: 'Proof',
  STORY: 'Story',
  MYTHBUST: 'Myth-bust',
  OBJECTION: 'Objection',
  ENGAGEMENT: 'Engagement',
  BEHIND: 'Behind-the-scenes',
  AUTHORITY: 'Authority',
};

// Reusable DM call-to-action used on free-gift days (mirrors buildCaptionPrompt in generate/route.js).
const DM_CTA = 'Comment "{{keyword}}" and I\'ll send "{{freeGiftName}}" straight to your DMs. 📩';

/**
 * The 30-day framework. `day` is 1-30. `angle` is a short human label.
 * `captionTemplate` is the post caption; `imageBriefTemplate` is fed to the image
 * generator as the creative brief (user_description).
 */
export const CONTENT_CALENDAR = [
  {
    day: 1, category: CATEGORIES.CTA, angle: 'Free gift announcement',
    captionTemplate:
      `If you're in {{niche}} and you want to {{transformation}}, I made something for you.\n\n` +
      `"{{freeGiftName}}" breaks it down step by step — no fluff, no theory.\n\n` + DM_CTA,
    imageBriefTemplate: 'Bold premium announcement post for a free guide. Dark background, high-contrast headline, the guide cover as the hero. Clean, trustworthy, no clutter.',
  },
  {
    day: 2, category: CATEGORIES.EDUCATIONAL, angle: 'Quick tactical tip',
    captionTemplate:
      `One small change that helps {{niche}} clients {{transformation}} faster:\n\n` +
      `Stop doing more. Start removing the one bottleneck that's quietly costing you the most.\n\n` +
      `Save this for when you need the reminder.`,
    imageBriefTemplate: 'Clean educational tip post. Minimalist, single bold statement, lots of negative space, professional.',
  },
  {
    day: 3, category: CATEGORIES.MYTHBUST, angle: 'Common mistake',
    captionTemplate:
      `The biggest mistake I see in {{niche}}:\n\n` +
      `Chasing more leads when the real problem is conversion. More traffic on a broken funnel just loses money faster.\n\n` +
      `Fix the leak first.`,
    imageBriefTemplate: 'Myth-vs-truth style post. Split visual energy, bold red accent for the "wrong" idea, confident tone.',
  },
  {
    day: 4, category: CATEGORIES.PROOF, angle: 'Client result',
    captionTemplate:
      `A {{niche}} client came to me stuck. Within weeks they started to {{transformation}} — predictably, not by luck.\n\n` +
      `The difference was a system, not more effort.`,
    imageBriefTemplate: 'Results showcase post. Premium, an upward graph or "booked" calendar motif, credible and aspirational.',
  },
  {
    day: 5, category: CATEGORIES.ENGAGEMENT, angle: 'Engagement question',
    captionTemplate:
      `Quick question for {{niche}} owners 👇\n\n` +
      `What's the #1 thing standing between you and being able to {{transformation}} right now?\n\n` +
      `Drop it below — I read every reply.`,
    imageBriefTemplate: 'Conversational question post. Friendly, approachable, big readable question, soft brand colors.',
  },
  {
    day: 6, category: CATEGORIES.STORY, angle: 'Founder why',
    captionTemplate:
      `I didn't start in {{niche}} to sell anything.\n\n` +
      `I started because I watched good people work hard and still struggle to {{transformation}}. So I built a better way.\n\n` +
      `That's still why I do this.`,
    imageBriefTemplate: 'Personal story post. Warm, authentic, founder-led mood, the author headshot used for style reference only.',
  },
  {
    day: 7, category: CATEGORIES.CTA, angle: 'Free gift (value-stack)',
    captionTemplate:
      `Inside "{{freeGiftName}}" you'll get the exact framework I use to help {{niche}} clients {{transformation}} — for free.\n\n` + DM_CTA,
    imageBriefTemplate: 'Free guide CTA post. The guide cover as hero, "FREE" badge, premium dark background, strong call-to-action energy.',
  },
  {
    day: 8, category: CATEGORIES.EDUCATIONAL, angle: 'How-to framework',
    captionTemplate:
      `How {{niche}} businesses {{transformation}} in 3 steps:\n\n` +
      `1. Get clear on the one outcome you sell\n2. Remove every step that doesn't lead to it\n3. Make the next action obvious\n\n` +
      `Simple beats clever.`,
    imageBriefTemplate: 'Step-by-step framework post. Numbered, structured, clean diagram feel, professional and instructional.',
  },
  {
    day: 9, category: CATEGORIES.OBJECTION, angle: 'Objection: no time',
    captionTemplate:
      `"I don't have time for this."\n\n` +
      `That's exactly why it works. The whole point of a real system is that it helps you {{transformation}} without adding hours to your week.\n\n` +
      `Less busywork, more results.`,
    imageBriefTemplate: 'Objection-handling post. Calm, reassuring, a clock or time motif, confident tone.',
  },
  {
    day: 10, category: CATEGORIES.BEHIND, angle: 'Behind the scenes',
    captionTemplate:
      `Behind the scenes of how we help {{niche}} clients {{transformation}}:\n\n` +
      `It's not magic. It's the boring, repeatable stuff done consistently. Here's a peek.`,
    imageBriefTemplate: 'Behind-the-scenes post. Authentic workspace/process vibe, slightly editorial, real and relatable.',
  },
  {
    day: 11, category: CATEGORIES.PROOF, angle: 'Testimonial',
    captionTemplate:
      `"I finally feel in control of my pipeline."\n\n` +
      `That's what a {{niche}} client told me after we put the system in place to help them {{transformation}}.\n\n` +
      `Proof beats promises.`,
    imageBriefTemplate: 'Testimonial post. Quote-forward design, premium, trustworthy, subtle brand accent.',
  },
  {
    day: 12, category: CATEGORIES.EDUCATIONAL, angle: 'List of tips',
    captionTemplate:
      `5 things {{niche}} clients who {{transformation}} do differently:\n\n` +
      `→ They track one number, not ten\n→ They follow up faster\n→ They say no more often\n→ They systemize the repeatable\n→ They make decisions weekly, not yearly`,
    imageBriefTemplate: 'Listicle post. Clean checklist layout, scannable, bold headline, professional.',
  },
  {
    day: 13, category: CATEGORIES.CTA, angle: 'Free gift (problem-aware)',
    captionTemplate:
      `Still trying to {{transformation}} on willpower alone?\n\n` +
      `"{{freeGiftName}}" gives you the system instead. Free.\n\n` + DM_CTA,
    imageBriefTemplate: 'Free guide CTA post, problem-aware angle. Guide cover hero, bold contrast, "FREE" badge.',
  },
  {
    day: 14, category: CATEGORIES.MYTHBUST, angle: 'Industry myth',
    captionTemplate:
      `Myth: you need to be everywhere to grow in {{niche}}.\n\n` +
      `Truth: you need one offer, one audience, and one path that helps people {{transformation}}. Depth beats spread.`,
    imageBriefTemplate: 'Myth-vs-truth post. Strong contrast, red accent on the myth, confident and clarifying.',
  },
  {
    day: 15, category: CATEGORIES.STORY, angle: 'Relatable pain',
    captionTemplate:
      `If you're in {{niche}} and your calendar is full but your bank account doesn't show it — I've been there.\n\n` +
      `Busy isn't the same as profitable. Here's what changed it for me.`,
    imageBriefTemplate: 'Relatable struggle post. Honest, human, slightly moody, then hopeful. Editorial feel.',
  },
  {
    day: 16, category: CATEGORIES.EDUCATIONAL, angle: 'Quick win',
    captionTemplate:
      `A 10-minute win for {{niche}} owners:\n\n` +
      `Write down the one question every good lead asks before they buy. Answer it on your opt-in page. Watch conversions move.`,
    imageBriefTemplate: 'Quick-win tip post. Energetic, single actionable idea, clean and bold.',
  },
  {
    day: 17, category: CATEGORIES.ENGAGEMENT, angle: 'This or that',
    captionTemplate:
      `{{niche}} owners — be honest 👇\n\n` +
      `More leads, or better conversion on the leads you already have?\n\n` +
      `Comment 1 or 2. I'll share what I'd do for each.`,
    imageBriefTemplate: 'Interactive this-or-that post. Two clear options, playful but professional, brand colors.',
  },
  {
    day: 18, category: CATEGORIES.PROOF, angle: 'Before / after',
    captionTemplate:
      `Before: chasing every lead, posting randomly, hoping.\n` +
      `After: a system that helps {{niche}} clients {{transformation}} on repeat.\n\n` +
      `Same person. Different process.`,
    imageBriefTemplate: 'Before/after transformation post. Clear contrast, premium, credible, upward momentum.',
  },
  {
    day: 19, category: CATEGORIES.CTA, angle: 'Free gift (outcome-led)',
    captionTemplate:
      `Want the shortcut to {{transformation}} in {{niche}}?\n\n` +
      `Grab "{{freeGiftName}}" — the same framework I use with clients. Free.\n\n` + DM_CTA,
    imageBriefTemplate: 'Free guide CTA post, outcome-led. Guide cover hero, aspirational, "FREE" badge, strong CTA.',
  },
  {
    day: 20, category: CATEGORIES.AUTHORITY, angle: 'Credentials / experience',
    captionTemplate:
      `I've spent years helping {{niche}} businesses {{transformation}} — across every market condition.\n\n` +
      `The pattern is always the same: clarity, system, consistency. In that order.`,
    imageBriefTemplate: 'Authority post. Confident, premium, established-expert mood, brand-led.',
  },
  {
    day: 21, category: CATEGORIES.EDUCATIONAL, angle: 'Framework deep-dive',
    captionTemplate:
      `The framework I use to help {{niche}} clients {{transformation}}:\n\n` +
      `Attract the right people → give them one clear next step → prove you can help → make saying yes easy.\n\n` +
      `Each stage has a job. Skip one and it leaks.`,
    imageBriefTemplate: 'Framework deep-dive post. Structured flow/diagram concept, instructional, clean and authoritative.',
  },
  {
    day: 22, category: CATEGORIES.OBJECTION, angle: 'Will this work for me',
    captionTemplate:
      `"Does this actually work in MY corner of {{niche}}?"\n\n` +
      `If you sell an outcome people genuinely want and you talk to humans — yes. The system that helps you {{transformation}} doesn't care about your sub-niche.`,
    imageBriefTemplate: 'Objection-handling post, reassuring. Calm, credible, direct-to-camera energy.',
  },
  {
    day: 23, category: CATEGORIES.STORY, angle: 'Transformation story',
    captionTemplate:
      `One {{niche}} client almost quit. Fully burnt out.\n\n` +
      `Six weeks after we rebuilt their process to {{transformation}}, they texted me: "I actually enjoy my business again."\n\n` +
      `That's the real win.`,
    imageBriefTemplate: 'Transformation story post. Emotional arc, hopeful, premium, human.',
  },
  {
    day: 24, category: CATEGORIES.BEHIND, angle: 'Day in the life',
    captionTemplate:
      `A real day helping {{niche}} clients {{transformation}}:\n\n` +
      `Less "hustle," more removing friction so the right things happen automatically. Here's a glimpse.`,
    imageBriefTemplate: 'Day-in-the-life post. Authentic, candid, workspace energy, lightly editorial.',
  },
  {
    day: 25, category: CATEGORIES.CTA, angle: 'Free gift (urgency-soft)',
    captionTemplate:
      `If even one idea inside helps you {{transformation}}, "{{freeGiftName}}" is worth the 5 minutes.\n\n` +
      `It's free — and it's the best place to start.\n\n` + DM_CTA,
    imageBriefTemplate: 'Free guide CTA post, soft urgency. Guide cover hero, inviting, "FREE" badge.',
  },
  {
    day: 26, category: CATEGORIES.EDUCATIONAL, angle: 'Value bomb',
    captionTemplate:
      `The hard truth about growing in {{niche}}:\n\n` +
      `You don't have a traffic problem. You have a clarity problem. Get crystal clear on who you help and how you help them {{transformation}}, and everything else gets easier.`,
    imageBriefTemplate: 'Value-bomb post. Bold single statement, high contrast, confident and quotable.',
  },
  {
    day: 27, category: CATEGORIES.PROOF, angle: 'Results recap',
    captionTemplate:
      `What happens when {{niche}} clients commit to the system to {{transformation}}:\n\n` +
      `More of the right conversations. Fewer wasted hours. A pipeline they can actually predict.`,
    imageBriefTemplate: 'Results recap post. Premium, metric/graph motif, credible and clean.',
  },
  {
    day: 28, category: CATEGORIES.ENGAGEMENT, angle: 'Open question',
    captionTemplate:
      `{{niche}} owners — what would change for you this year if you could finally {{transformation}} without the guesswork?\n\n` +
      `Tell me below. I might turn the best answers into a post.`,
    imageBriefTemplate: 'Open-question engagement post. Warm, inviting, readable, brand colors.',
  },
  {
    day: 29, category: CATEGORIES.AUTHORITY, angle: 'Myth vs truth recap',
    captionTemplate:
      `Three things that are true in {{niche}}, whether you like them or not:\n\n` +
      `→ Systems beat motivation\n→ Clarity beats volume\n→ The people who {{transformation}} are the ones who start before they feel ready`,
    imageBriefTemplate: 'Authority recap post. Bold three-point layout, confident, premium.',
  },
  {
    day: 30, category: CATEGORIES.CTA, angle: 'Free gift (strong close)',
    captionTemplate:
      `If you've read this far, you're serious about {{transformation}} in {{niche}}.\n\n` +
      `Start here: "{{freeGiftName}}". It's free, it's fast, and it's the exact framework that works.\n\n` + DM_CTA,
    imageBriefTemplate: 'Strong free-guide CTA post. Guide cover hero, decisive, premium, "FREE" badge and clear action.',
  },
];

/**
 * Replace {{placeholders}} in a template string with values, trimming gracefully.
 */
function interpolate(template, vars) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return (v === undefined || v === null || v === '') ? (FALLBACKS[key] ?? '') : String(v);
  });
}

const FALLBACKS = {
  freeGiftName: 'my free guide',
  niche: 'your industry',
  transformation: 'get more clients',
  offerName: '',
  keyword: 'GUIDE',
};

/**
 * Build the variable map from vault context + keyword.
 */
function varsFromContext(vaultCtx = {}, keyword) {
  return {
    freeGiftName: vaultCtx.freeGiftName || FALLBACKS.freeGiftName,
    niche: vaultCtx.niche || FALLBACKS.niche,
    transformation: vaultCtx.transformation || FALLBACKS.transformation,
    offerName: vaultCtx.offerName || FALLBACKS.offerName,
    keyword: (keyword || vaultCtx.keyword || FALLBACKS.keyword).toString().toUpperCase(),
  };
}

/**
 * Return all 30 days, personalized with the user's vault context. No LLM call —
 * instant and reliable. Each item is ready to edit / generate an image for / post.
 *
 * @param {Object} vaultCtx - from getVaultContext()
 * @param {string} [keyword='GUIDE'] - DM trigger keyword
 * @returns {Array<{day,category,angle,caption,imageBrief,templateKey}>}
 */
export function buildCalendar(vaultCtx = {}, keyword = 'GUIDE') {
  const vars = varsFromContext(vaultCtx, keyword);
  return CONTENT_CALENDAR.map(t => ({
    day: t.day,
    category: t.category,
    angle: t.angle,
    caption: interpolate(t.captionTemplate, vars),
    imageBrief: interpolate(t.imageBriefTemplate, vars),
    templateKey: `day-${t.day}`,
  }));
}

/**
 * Deterministically rotate through the 30 templates so each calendar day surfaces a
 * different "today's suggestion". Personalized with vault context.
 *
 * @param {Object} vaultCtx
 * @param {string} [keyword='GUIDE']
 * @param {Date} [date=new Date()]
 */
export function getTodaysTemplate(vaultCtx = {}, keyword = 'GUIDE', date = new Date()) {
  const daysSinceEpoch = Math.floor(date.getTime() / 86_400_000);
  const idx = ((daysSinceEpoch % CONTENT_CALENDAR.length) + CONTENT_CALENDAR.length) % CONTENT_CALENDAR.length;
  const t = CONTENT_CALENDAR[idx];
  const vars = varsFromContext(vaultCtx, keyword);
  return {
    day: t.day,
    category: t.category,
    angle: t.angle,
    caption: interpolate(t.captionTemplate, vars),
    imageBrief: interpolate(t.imageBriefTemplate, vars),
    templateKey: `day-${t.day}`,
  };
}
