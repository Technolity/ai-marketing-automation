/**
 * Ideal Client Profile (ICP) - Deterministic Prompt
 * Deep dive into primary audience, demographics, and psychographics
 * 
 * CRITICAL: This generates REAL business content, not examples
 */

export const idealClientPrompt = (data) => `
You are generating the ACTUAL Ideal Client Profile for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL ICP that will be used to:
- Target paid ads on Facebook/Instagram/YouTube
- Write funnel copy that converts
- Create VSL scripts that sell
- Segment email lists
- Build real marketing campaigns with real money

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "e.g.", "such as X", "[Your answer here]"
2. Use SPECIFIC numbers, not vague terms like "various", "many", "several"
3. Every field must contain REAL, usable content - not examples or templates
4. Base EVERYTHING on the user's actual answers provided below
5. Write AS IF you ARE the business owner creating this for your own business
6. Output MUST be valid JSON - no markdown, no explanations, no commentary

INPUT DATA (Use this to create specific, real content):

Industry / Market: ${data.industry || 'Not specified'}
Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}
What the business helps them with (Core Message): ${data.message || 'Not specified'}
Primary problem the audience is facing: ${data.coreProblem || 'Not specified'}
Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}
Unique advantage or differentiation: ${data.uniqueAdvantage || 'Not specified'}
Founder's mission or personal story: ${data.story || 'Not specified'}
Proof points or client results: ${data.testimonials || 'Not specified'}
Current offer or program: ${data.offerProgram || 'Not specified'}
Price point or pricing range: ${data.pricing || 'No price yet'}
Current business stage: ${data.businessStage || 'Not specified'}
Primary CTA the business wants: ${data.callToAction || 'Not specified'}
Main acquisition channels: ${data.platforms || 'Not specified'}
Brand voice or personality: ${data.brandVoice || 'Not specified'}
90-day business goal: ${data.goal90Days || 'Not specified'}

TASK: Create a DEEP, SPECIFIC Ideal Client Profile based on the above data.

Return ONLY valid JSON in this exact structure (every field is REQUIRED with real content):
{
  "idealClientProfile": {
    "demographics": {
      "ageRange": "35-55",
      "gender": "Primarily male, 65%",
      "career": "Coaches, consultants, agency owners, course creators",
      "incomeRange": "$150,000-$500,000 annual",
      "location": "United States, Canada, UK, Australia",
      "familyStatus": "Married with 1-2 kids, 60% likelihood",
      "educationLevel": "Bachelor's degree or higher, often self-educated in business"
    },
    "psychographics": {
      "primaryDesires": [
        "More qualified sales calls without cold outreach",
        "Recognized authority status in their niche",
        "Predictable monthly revenue they can count on"
      ],
      "fears": [
        "Wasting $10K+ on marketing that doesn't work",
        "Being invisible in an increasingly noisy market",
        "Watching competitors pass them by"
      ],
      "frustrations": [
        "Inconsistent lead flow despite working 50+ hours/week",
        "Strategies that worked before suddenly stop converting",
        "Feeling stuck at the same revenue level for 2+ years"
      ],
      "secretWorries": [
        "Maybe I'm not cut out for this level of success",
        "What if I've already peaked and this is as good as it gets",
        "I'm exhausted and can't keep up this pace"
      ],
      "successInTheirWords": "I want to wake up to qualified leads in my inbox, have a full calendar of ideal clients, and actually take a vacation without my business falling apart"
    },
    "painPoints": [
      {
        "problem": "Inconsistent lead flow",
        "lifeImpact": "Constant stress, can't plan ahead, feast-or-famine cycles",
        "incomeImpact": "Revenue swings 40-60% month to month, can't make strategic investments",
        "careerImpact": "Stuck at the same level, watching others scale past them",
        "wellbeingImpact": "Anxiety, burnout, questioning if they made the right career choice"
      },
      {
        "problem": "Wasted marketing spend",
        "lifeImpact": "Frustration, feeling like they're throwing money away",
        "incomeImpact": "Lost $5K-$50K on agencies and ads that didn't convert",
        "careerImpact": "Hesitant to invest in growth, paralyzed by past failures",
        "wellbeingImpact": "Imposter syndrome, doubt about their business decisions"
      },
      {
        "problem": "No clear positioning",
        "lifeImpact": "Exhausting themselves trying to appeal to everyone",
        "incomeImpact": "Competing on price instead of value, lower profit margins",
        "careerImpact": "Blending in with thousands of similar offers",
        "wellbeingImpact": "Identity crisis about what makes them unique"
      }
    ],
    "desiredOutcomes": [
      {
        "outcome": "Predictable booked calls every week",
        "lifeChange": "Peace of mind, ability to plan and invest confidently",
        "incomeChange": "Stable $50K-$100K months minimum",
        "careerChange": "Recognized as a go-to authority in their market",
        "wellbeingChange": "Confidence, excitement, renewed passion for their work"
      },
      {
        "outcome": "Premium positioning that attracts ideal clients",
        "lifeChange": "Working with people they actually enjoy",
        "incomeChange": "2-3x increase in average client value",
        "careerChange": "Known for their unique method, not just another option",
        "wellbeingChange": "Pride in their work, feeling valued and respected"
      },
      {
        "outcome": "Scalable marketing system",
        "lifeChange": "Freedom to step away without everything falling apart",
        "incomeChange": "Business grows even when they're not actively selling",
        "careerChange": "Building a real asset, not just a job",
        "wellbeingChange": "Finally feeling like a real business owner"
      }
    ],
    "buyingTriggers": [
      "Just lost a major client and realized they have no pipeline",
      "Saw a competitor land a major deal they should have gotten",
      "Hit a revenue ceiling they can't break through for 18+ months",
      "Spouse questioned when things will finally 'take off'",
      "Calculated how much they've spent on courses/coaches with no ROI"
    ],
    "objections": [
      {
        "objection": "I don't have time for another program",
        "response": "This replaces random tactics with a system. Most clients see results in 2-3 weeks while working less.",
        "vslPlacement": "After mechanism reveal"
      },
      {
        "objection": "I've tried marketing help before and got burned",
        "response": "Unlike agencies that just run ads, we build the messaging foundation first. That's why clients get 3-5x better results.",
        "vslPlacement": "During proof section"
      },
      {
        "objection": "The investment is too high right now",
        "response": "One client at your price point pays for the entire system. Most see ROI in 30-60 days or less.",
        "vslPlacement": "During price reveal"
      },
      {
        "objection": "Now isn't the right time",
        "response": "Every month without a working system costs you $10K-$50K in lost revenue. The best time was 6 months ago. The second best time is today.",
        "vslPlacement": "Final CTA section"
      }
    ],
    "languagePatterns": {
      "phrasesTheyUse": [
        "I need more qualified leads",
        "How do I stand out in a crowded market",
        "I'm tired of inconsistent income",
        "Why isn't my marketing working",
        "I want to attract better clients"
      ],
      "emotionalWords": [
        "Frustrated", "Overwhelmed", "Stuck", "Invisible",
        "Undervalued", "Exhausted", "Desperate for change"
      ],
      "desiredIdentity": "Successful business owner who built something meaningful"
    },
    "mediaConsumption": {
      "platforms": ["YouTube", "LinkedIn", "Podcasts", "Facebook Groups"],
      "trustedVoices": ["Business coaches with proven results", "Peers who've scaled past their level", "Marketing experts with real case studies"],
      "contentFormats": ["Long-form YouTube", "Podcast interviews", "Case study breakdowns", "Behind-the-scenes content"]
    },
    "marketingGuidance": {
      "howToSpeakToThem": "Direct, confident, results-focused. Show you understand their struggle without being condescending. Prove with specifics, not hype.",
      "whatToAvoid": [
        "Guru energy or get-rich-quick promises",
        "Vague claims without proof",
        "Talking down to them or being patronizing",
        "Generic advice they've heard 100 times"
      ],
      "trustBuilders": [
        "Specific client results with numbers",
        "Transparent about who this IS and ISN'T for",
        "Clear process and timeline expectations",
        "Risk reversal or guarantee"
      ]
    }
  }
}
`;

export default idealClientPrompt;
