/**
 * Email Sequence - Optimized for Reliable Generation
 * Generates key email components in a manageable format
 */

export const emailsPrompt = (data) => `
Create email nurture sequence components. Be SPECIFIC and COMPLETE. NO placeholders.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}
• Offer: ${data.offerProgram || 'Not specified'}

Generate JSON (no markdown):
{
  "emailSequence": {
    "tips": {
      "tip1": {"title": "Title", "content": "2-3 sentence explanation", "actionStep": "Specific action"},
      "tip2": {"title": "Title", "content": "2-3 sentence explanation", "actionStep": "Specific action"},
      "tip3": {"title": "Title", "content": "2-3 sentence explanation", "actionStep": "Specific action"}
    },
    "stepsToSuccess": [
      {"step": 1, "title": "Step name", "description": "What happens + result"},
      {"step": 2, "title": "Step name", "description": "What happens + result"},
      {"step": 3, "title": "Step name", "description": "What happens + result"},
      {"step": 4, "title": "Step name", "description": "What happens + result"}
    ],
    "faqs": [
      {"question": "How long to see results?", "answer": "Specific answer 2-3 sentences"},
      {"question": "What if I tried before?", "answer": "Why this is different"},
      {"question": "Time commitment?", "answer": "Specific time investment"},
      {"question": "What if it doesn't work?", "answer": "Guarantee or assurance"},
      {"question": "Why a call vs just buy?", "answer": "Consultation value"}
    ],
    "successStory": {
      "clientName": "Client type or anonymized",
      "beforeState": "Situation before",
      "transformation": "Results achieved",
      "timeframe": "How long it took",
      "quote": "Client testimonial"
    },
    "emailSubjects": [
      {"day": 0, "purpose": "Welcome", "subject": "Welcome! Your first tip to [outcome]"},
      {"day": 1, "purpose": "Tip 2", "subject": "Tip #2: [specific outcome]"},
      {"day": 2, "purpose": "Tip 3", "subject": "Final piece: [outcome]"},
      {"day": 3, "purpose": "Summary", "subject": "Everything in one place"},
      {"day": 4, "purpose": "4-Step Plan", "subject": "The 4-step plan to [outcome]"},
      {"day": 5, "purpose": "Success Story", "subject": "How [client type] achieved [result]"},
      {"day": 7, "purpose": "FAQ", "subject": "You asked, I answered"},
      {"day": 10, "purpose": "Urgency", "subject": "Time sensitive: [benefit]"},
      {"day": 12, "purpose": "Cost of Inaction", "subject": "What you're missing out on"},
      {"day": 14, "purpose": "Decision", "subject": "It's decision time"},
      {"day": 15, "purpose": "Final Push", "subject": "Last chance: [outcome]"}
    ],
    "sampleEmails": {
      "welcome": {
        "subject": "Welcome! Here's your first tip to [specific outcome]",
        "body": "Hi {{contact.first_name}},\\n\\n[Complete 150-200 word welcome email with tip 1]\\n\\n[CTA to schedule call]"
      },
      "urgency": {
        "subject": "Time sensitive: [specific benefit]",
        "body": "Hi {{contact.first_name}},\\n\\n[Complete 150-200 word urgency email]\\n\\n[CTA to schedule call]"
      },
      "final": {
        "subject": "Last chance",
        "body": "Hi {{contact.first_name}},\\n\\n[Complete 100-150 word final email]\\n\\n[CTA to schedule call]"
      }
    }
  }
}

Use {{contact.first_name}} for personalization. Use [Schedule Link] for booking links.
All content must be SPECIFIC to the business. No generic placeholder text.
`;

export default emailsPrompt;
