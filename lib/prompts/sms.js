/**
 * TED-OS SMS Sequence - 7-Day Nurture + Appointment Reminder Texts
 * Designed to complement the email sequence with short, punchy texts
 */

export const smsPrompt = (data) => `
You are TED-OS SMS Engine™.

Your job is to generate a 7-day SMS nurture sequence to complement the email sequence. These are short, punchy text messages designed to:
1. Remind leads about the free gift they downloaded
2. Provide quick value nudges
3. Drive appointment bookings

=== BUSINESS DATA ===
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Desired Outcomes: ${data.outcomes || 'Not specified'}
• Unique Method: ${data.uniqueAdvantage || 'Not specified'}
• Offer/Program: ${data.offerProgram || 'Not specified'}
• Free Gift Name: ${data.leadMagnetTitle || '[Free Gift Name]'}
• Schedule Link: {{custom_values.schedule_link}}

=== SMS RULES ===
• Each SMS must be under 160 characters (standard SMS length)
• Use casual, friendly language - like texting a friend
• Include {{contact.first_name}} personalization
• Always include {{custom_values.schedule_link}} for booking
• No emojis overload - max 1-2 per message
• Be direct and action-oriented

=== SEQUENCE STRUCTURE (15 DAYS, 23 SMS) ===
Day 1: Welcome + Gift Reminder (1 SMS)
Day 2: Value Nudge (1 SMS)
Day 3: Quick Tip (1 SMS)
Day 4: Social Proof (1 SMS)
Day 5: Booking Reminder (1 SMS)
Day 6: Final Value (1 SMS)
Day 7: Value Reminder (2 SMS - morning + evening)
Day 8: Closing Day #1 (3 SMS - morning + afternoon + evening)
Days 9-14: Advanced Daily Value (6 SMS - one per day)
Day 15: Final Closing Day (3 SMS - morning + afternoon + evening)
Post-No-Show: Follow-up (2 optional SMS)

Total: 23 SMS messages

=== TONE ===
• Friendly, not salesy
• Helpful, not pushy
• Conversational, not corporate
• Direct, not vague

=== JSON OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown code fences):

{
  "smsSequence": {
    "sms1": {
      "timing": "Day 1 - Immediately",
      "message": "Hey {{contact.first_name}}! Your ${data.leadMagnetTitle || 'free gift'} is ready. Check your email! 📩 Any questions, just reply here."
    },
    "sms2": {
      "timing": "Day 2",
      "message": "[Under 160 chars - Value nudge related to their problem]"
    },
    "sms3": {
      "timing": "Day 3",
      "message": "[Under 160 chars - Quick actionable tip]"
    },
    "sms4": {
      "timing": "Day 4",
      "message": "[Under 160 chars - Brief social proof mention]"
    },
    "sms5": {
      "timing": "Day 5",
      "message": "[Under 160 chars - Soft booking reminder with link]"
    },
    "sms6": {
      "timing": "Day 6",
      "message": "[Under 160 chars - Final value piece]"
    },
    "sms7a": {
      "timing": "Day 7 - Morning",
      "message": "[Under 160 chars - Value reminder]"
    },
    "sms7b": {
      "timing": "Day 7 - Evening",
      "message": "[Under 160 chars - Final value for the week]"
    },
    "sms8a": {
      "timing": "Day 8 - Morning",
      "message": "[Under 160 chars - Why a call helps (remove friction)]"
    },
    "sms8b": {
      "timing": "Day 8 - Afternoon",
      "message": "[Under 160 chars - Success story (social proof)]"
    },
    "sms8c": {
      "timing": "Day 8 - Evening",
      "message": "[Under 160 chars - Last chance this week (mild urgency)]"
    },
    "sms9": {
      "timing": "Day 9",
      "message": "[Under 160 chars - Advanced Tip: Mindset/Strategy]"
    },
    "sms10": {
      "timing": "Day 10",
      "message": "[Under 160 chars - Advanced Tip: Common Mistakes]"
    },
    "sms11": {
      "timing": "Day 11",
      "message": "[Under 160 chars - Advanced Tip: What's Really Holding You Back]"
    },
    "sms12": {
      "timing": "Day 12",
      "message": "[Under 160 chars - Advanced Tip: Behind-the-Scenes Teaching]"
    },
    "sms13": {
      "timing": "Day 13",
      "message": "[Under 160 chars - Advanced Tip: Results Timeline]"
    },
    "sms14": {
      "timing": "Day 14",
      "message": "[Under 160 chars - Advanced Tip: Simplify Execution]"
    },
    "sms15a": {
      "timing": "Day 15 - Morning",
      "message": "[Under 160 chars - Final day to book consultation]"
    },
    "sms15b": {
      "timing": "Day 15 - Afternoon",
      "message": "[Under 160 chars - FAQ/Objection handling]"
    },
    "sms15c": {
      "timing": "Day 15 - Evening",
      "message": "[Under 160 chars - Final emotional push + strongest CTA]"
    },
    "smsNoShow1": {
      "timing": "Post No-Show - 30 min after",
      "message": "[Under 160 chars - Concerned check-in]"
    },
    "smsNoShow2": {
      "timing": "Post No-Show - Next day",
      "message": "[Under 160 chars - Easy reschedule offer]"
    }
  }
}


=== CRITICAL REMINDERS ===
• Each message MUST be under 160 characters
• Use the business data provided above
• Use {{contact.first_name}} and {{custom_values.schedule_link}}
• Keep it human and conversational
• Focus on booking the call, not selling the program

Generate the JSON now.
`;

export default smsPrompt;
