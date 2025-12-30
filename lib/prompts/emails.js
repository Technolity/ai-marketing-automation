/**
 * 18-Email Nurture Sequence - Optimized Prompt
 * Complete email sequence ready for GHL
 */

export const emailsPrompt = (data) => `
Create 18-email nurture sequence. COMPLETE bodies (200-400 words each). Ready for GHL. NO placeholders.

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
Story: Pit=${data.storyLowMoment || 'NS'} | Discovery=${data.storyDiscovery || 'NS'} | Breakthrough=${data.storyBreakthrough || 'NS'}
Proof: ${data.testimonials || 'NS'}
Offer: ${data.offerProgram || 'NS'}

SEQUENCE FLOW:
• 1-5: Welcome, 3 tips, build relationship
• 6-10: Deeper engagement, success stories, call invite, FAQ
• 11-15: Urgency - time running out
• 16-18: Final push - last spots, closing

Use {{contact.first_name}} for personalization. Use [Schedule Link] for booking.

JSON OUTPUT (no markdown):
{
  "emailSequence": {
    "tips": {
      "tip1": {"title": "Actionable tip 1", "content": "Full explanation 2-3 sentences", "actionStep": "Specific action"},
      "tip2": {"title": "Actionable tip 2", "content": "Full explanation 2-3 sentences", "actionStep": "Specific action"},
      "tip3": {"title": "Actionable tip 3", "content": "Full explanation 2-3 sentences", "actionStep": "Specific action"}
    },
    "stepsToSuccess": [
      {"step": 1, "title": "Step 1", "description": "What happens + result"},
      {"step": 2, "title": "Step 2", "description": "What happens + result"},
      {"step": 3, "title": "Step 3", "description": "What happens + result"},
      {"step": 4, "title": "Step 4", "description": "What happens + result"}
    ],
    "faqs": [
      {"question": "How long to see results?", "answer": "Complete answer"},
      {"question": "What if tried before?", "answer": "Why this is different"},
      {"question": "Time commitment?", "answer": "Specific time investment"},
      {"question": "What if doesn't work?", "answer": "Guarantee/assurance"},
      {"question": "Why call vs buy?", "answer": "Consultation value"}
    ],
    "successStory": {
      "clientName": "Client type/anonymized",
      "beforeState": "Situation before",
      "transformation": "Results achieved",
      "timeframe": "How long",
      "quote": "Client quote/paraphrase"
    },
    "emails": [
      {"emailNumber": 1, "dayToSend": "Day 0 (Immediately)", "purpose": "Welcome + Tip 1", "subjectLine": "Welcome! Here's your first tip to [outcome]", "previewText": "This changed everything...", "body": "COMPLETE 200-400 word email body. Conversational. Include tip 1 content. CTA to schedule."},
      {"emailNumber": 2, "dayToSend": "Day 1", "purpose": "Tip 2", "subjectLine": "Tip #2: [outcome]", "previewText": "Where most go wrong...", "body": "COMPLETE body. Reference tip 1. Deliver tip 2. Action step. CTA."},
      {"emailNumber": 3, "dayToSend": "Day 2", "purpose": "Tip 3", "subjectLine": "Final piece: [outcome]", "previewText": "Most people miss this...", "body": "COMPLETE body. Reference tips 1-2. Deliver tip 3. Tie together. CTA."},
      {"emailNumber": 4, "dayToSend": "Day 3", "purpose": "Summary + Next Step", "subjectLine": "Here's everything in one place", "previewText": "Quick recap...", "body": "COMPLETE body. Recap 3 tips. Transition to deeper work. CTA."},
      {"emailNumber": 5, "dayToSend": "Day 4", "purpose": "Intro 4-Step Plan", "subjectLine": "The 4-step plan to [outcome]", "previewText": "Here's the roadmap...", "body": "COMPLETE body. Introduce 4 steps. High-level overview. CTA."},
      {"emailNumber": 6, "dayToSend": "Day 5", "purpose": "Success Story", "subjectLine": "How [client] went from [before] to [after]", "previewText": "Real results...", "body": "COMPLETE body. Full success story. Relatable transformation. CTA."},
      {"emailNumber": 7, "dayToSend": "Day 6", "purpose": "Deep Dive Step 1", "subjectLine": "Step 1: [step name]", "previewText": "Let's break this down...", "body": "COMPLETE body. Explain step 1 in detail. Why it matters. CTA."},
      {"emailNumber": 8, "dayToSend": "Day 7", "purpose": "Deep Dive Step 2-3", "subjectLine": "Steps 2 & 3: [outcomes]", "previewText": "Here's where it gets interesting...", "body": "COMPLETE body. Steps 2-3. How they build on step 1. CTA."},
      {"emailNumber": 9, "dayToSend": "Day 8", "purpose": "Deep Dive Step 4", "subjectLine": "Step 4: [final step name]", "previewText": "The final piece...", "body": "COMPLETE body. Step 4. Complete transformation. CTA."},
      {"emailNumber": 10, "dayToSend": "Day 9", "purpose": "FAQ Email", "subjectLine": "You asked, I answered", "previewText": "Top 5 questions...", "body": "COMPLETE body. Answer all 5 FAQs. Address objections. Strong CTA."},
      {"emailNumber": 11, "dayToSend": "Day 10", "purpose": "Urgency - Limited Time", "subjectLine": "Time sensitive: [benefit]", "previewText": "Don't miss this...", "body": "COMPLETE body. Introduce urgency. Limited spots/time. Why now matters. CTA."},
      {"emailNumber": 12, "dayToSend": "Day 11", "purpose": "What You're Missing", "subjectLine": "What you're missing out on", "previewText": "Be honest...", "body": "COMPLETE body. Cost of inaction. What they're losing. Empathetic. CTA."},
      {"emailNumber": 13, "dayToSend": "Day 12", "purpose": "Transformation Reminder", "subjectLine": "Imagine: [desired outcome]", "previewText": "Picture this...", "body": "COMPLETE body. Paint future picture. What's possible. Emotional. CTA."},
      {"emailNumber": 14, "dayToSend": "Day 13", "purpose": "Decision Point", "subjectLine": "It's decision time", "previewText": "Here's the truth...", "body": "COMPLETE body. Direct. Choice: action or status quo. Respectful urgency. CTA."},
      {"emailNumber": 15, "dayToSend": "Day 14", "purpose": "Final Reminder - Spots Filling", "subjectLine": "Only a few spots left", "previewText": "This is it...", "body": "COMPLETE body. Limited availability. Social proof (others booking). Last chance tone. Strong CTA."},
      {"emailNumber": 16, "dayToSend": "Day 15", "purpose": "Last 24 Hours", "subjectLine": "Last 24 hours", "previewText": "Final call...", "body": "COMPLETE body. 24-hour deadline. Recap value. Final push. Urgent CTA."},
      {"emailNumber": 17, "dayToSend": "Day 16", "purpose": "Final Hours", "subjectLine": "Final hours: [outcome]", "previewText": "Closing soon...", "body": "COMPLETE body. Hours remaining. Last appeal. Respectful but direct. Final CTA."},
      {"emailNumber": 18, "dayToSend": "Day 17", "purpose": "Goodbye + Door Open", "subjectLine": "The door is closing", "previewText": "Last chance...", "body": "COMPLETE body. Deadline passed/passing. Respectful goodbye. Door always open. Soft CTA."}
    ]
  }
}

NO placeholders. Every email body COMPLETE and ready to send.
`;

export default emailsPrompt;
