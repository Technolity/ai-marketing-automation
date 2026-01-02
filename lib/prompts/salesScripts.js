/**
 * Setter Script - Appointment Booking for Inbound Leads
 * Pre-consultation script: Build trust, qualify, book strategy call
 */

export const salesScriptsPrompt = (data) => `
SETTER SCRIPT - Appointment Booking (Inbound Leads)

Book strategy/consultation calls. Build trust fast, qualify fit, no pitching.

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
Proof: ${data.testimonials || 'NS'}
CTA: ${data.callToAction || 'Book a call'}
Business: ${data.businessName || 'Your Business'}

SETTER RULES:
• Reference opt-in: "You downloaded [lead magnet]"
• NOT a sales call (say it explicitly)
• Find 1 goal + 1 obstacle
• Subtle authority drop (no bragging)
• Transparent: "If it's a fit, there is an investment — zero obligation"
• Book call live, confirm commitment
• Clean exit if not a fit

CALL FLOW:
Opener + permission → Reference opt-in ("What caught your attention?") → Low-pressure frame → Current situation → Goal + motivation → Obstacle + stakes → Authority drop → Qualify (fit + readiness) → Book consultation → Confirm show-up

QUALIFYING QUESTIONS (choose by business type):
Transformation: What do you do? How getting leads? What's working/not working? Results/revenue? Goal? What's in the way?
Service: Main issue? How long? What tried? Biggest frustration? Desired outcome? Timeline?

JSON OUTPUT:
{
  "setterCallScript": {
    "quickOutline": {
      "callGoal": "Build trust → qualify goal + obstacle → book consultation",
      "callFlow": {
        "part1": "Opener + permission",
        "part2": "Reference opt-in + low-pressure frame",
        "part3": "Current situation questions",
        "part4": "Goal + motivation",
        "part5": "Obstacle + cost of inaction",
        "part6": "Authority drop + qualify fit",
        "part7": "Book consultation + confirm commitment"
      }
    },
    "fullScript": "Complete word-for-word script. Include: Opener → 'You downloaded [X], what caught your attention?' → 'This isn't a sales call' → Situation questions → Goal discovery → Obstacle identification → 'We help [client] go from [pain] to [outcome] using [method]' → Qualify readiness → Transparent investment frame → Book call → Confirm commitment. Use {{contact.first_name}} for personalization.",
    "keyQuestions": ["What caught your attention?", "What's your #1 goal?", "What's in the way?", "Is this something you're actively looking to solve right now?"],
    "authorityDrop": "Brief statement about who you help and your method",
    "transparentFrame": "If it's a fit, there is an investment — but zero obligation",
    "bookingClose": "What works better — today or tomorrow?"
  }
}

NO placeholders. Real content. Script should feel conversational, friendly, consultative.
`;

export default salesScriptsPrompt;
