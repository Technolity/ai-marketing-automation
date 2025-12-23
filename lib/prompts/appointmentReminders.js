/**
 * Appointment Reminders - Deterministic Prompt
 * Show-up sequence to ensure leads attend calls
 * 
 * CRITICAL: Every email must be complete and ready to send
 */

export const appointmentRemindersPrompt = (data) => `
You are writing ACTUAL appointment reminder emails for a real business.

THIS IS NOT AN EXAMPLE. These are REAL emails that will:
- Be sent automatically through GoHighLevel
- Determine whether leads show up to their calls
- Directly impact conversion rates and revenue

CRITICAL RULES:
1. NO placeholders like "[insert]", "TBD" - except [Video Link], [Booking Link], [Session Link]
2. Every email body must be COMPLETE (150-300 words)
3. Use {{contact.first_name}} for personalization
4. Write with energy and purpose - these emails must inspire action
5. Output MUST be valid JSON

INPUT DATA:

Brand/Service Name: ${data.businessName || 'Your Business'}
Industry: ${data.industry || 'Not specified'}
Service/Consultation Name: ${data.offerProgram || 'Free Strategy Session'}
Main benefit or goal: ${data.outcomes || 'Transform your results'}
Unique value proposition: ${data.uniqueAdvantage || 'Not specified'}
Key features of the service: ${data.deliverables || 'Not specified'}
Client testimonials/success stories: ${data.testimonials || 'Not specified'}
Brand voice: ${data.brandVoice || 'Professional and encouraging'}

Return ONLY valid JSON:

{
  "appointmentReminders": {
    "contentTips": {
      "tip1": {
        "title": "Tip #1: Specific Actionable Tip",
        "briefRecap": "A 2-3 sentence explanation of this tip from the video training - a unique approach, valuable strategy, or key insight that prepares them for the call"
      },
      "tip2": {
        "title": "Tip #2: Second Key Insight",
        "briefRecap": "Another critical piece of advice that adds substantial value and helps them come to the call more prepared"
      },
      "tip3": {
        "title": "Tip #3: Third Important Element",
        "briefRecap": "A third important point that could address a common misconception, innovative solution, or practical advice"
      }
    },
    "keyFeatures": [
      "Key benefit or feature they'll experience on the call #1",
      "Key benefit or feature #2",
      "Key benefit or feature #3"
    ],
    "preparationSteps": [
      "Watch the video training in full if you haven't already",
      "Think about your #1 goal and biggest obstacle",
      "Write down 2-3 questions you want answered"
    ],
    "confirmationEmail": {
      "timing": "Immediately upon booking",
      "subject": "🎉 You're confirmed! Your [Call Name] is booked",
      "previewText": "Here's everything you need to know...",
      "body": "Hey {{contact.first_name}},\\n\\nYou did it! Your [Call Name] is officially on the calendar. 🙌\\n\\nI'm genuinely excited to connect with you and help you [primary outcome].\\n\\n**Here's what we'll cover on your call:**\\n\\n✅ Get crystal clear on your current situation and goals\\n✅ Identify exactly what's been holding you back\\n✅ Map out a personalized plan to [achieve outcome]\\n\\n**Before our call, I'd love for you to:**\\n\\n1. Watch the training if you haven't: [Video Link]\\n2. Think about your #1 goal for the next 90 days\\n3. Note any questions you want answered\\n\\n**Quick Success Story:**\\n[Client Name] came to their call feeling [before state]. By the end of our 30 minutes together, they had complete clarity on [what they gained]. [Timeframe] later, they [specific result].\\n\\nThat could be you. I can't wait to make it happen.\\n\\nSee you soon!\\n\\n[Your Name]\\n[Business Name]\\n\\nP.S. Add this to your calendar RIGHT NOW so you don't forget. Your future self will thank you."
    },
    "reminder48Hours": {
      "timing": "48 hours before appointment",
      "subject": "🚀 48 hours until your breakthrough moment",
      "previewText": "Your [Call Name] is coming up...",
      "body": "Hey {{contact.first_name}},\\n\\nJust a friendly heads up - your [Call Name] is in 48 hours!\\n\\nI've been looking forward to this. Here's what awaits you:\\n\\n✨ **Clarity** - You'll finally understand exactly what's been keeping you stuck\\n✨ **Direction** - A clear path forward tailored to your situation\\n✨ **Momentum** - Actionable next steps you can take immediately\\n\\n**One thing to think about before we talk:**\\nWhat would change in your life if [primary outcome] became your reality in the next [timeframe]?\\n\\nReally sit with that question. It'll make our conversation that much more powerful.\\n\\n**Quick Tip from the Training:**\\n[Tip #1]: [Brief recap]\\n\\nThis is one of the foundations we'll build on during your call.\\n\\nSee you in 48 hours!\\n\\n[Your Name]\\n\\nP.S. If anything has come up and you need to reschedule, just reply to this email. No stress - life happens."
    },
    "reminder24Hours": {
      "timing": "24 hours before appointment",
      "subject": "⏰ Tomorrow's the day! Here's how to prepare",
      "previewText": "24 hours until your [Call Name]",
      "body": "Hey {{contact.first_name}},\\n\\nThis time tomorrow, we'll be diving deep into your goals and creating your personalized plan. 🎯\\n\\nTo make sure you get maximum value from our time together, here's how to prepare:\\n\\n**Before the call:**\\n✅ Find a quiet place where you won't be interrupted\\n✅ Have something to take notes with\\n✅ Be ready to share honestly about where you're at\\n\\n**What we'll discover together:**\\n• Your #1 goal and why it matters\\n• What's actually been holding you back\\n• The specific steps to get you from here to there\\n\\n**Client Spotlight:**\\n\"[Testimonial quote about the call experience]\" - [Client Name]\\n\\nThat's the kind of experience I want for you.\\n\\n**Key Insight to Consider:**\\n[Tip #2]: [Brief recap]\\n\\nCome ready to apply this to your specific situation.\\n\\nSee you tomorrow!\\n\\n[Your Name]"
    },
    "reminder1Hour": {
      "timing": "1 hour before appointment",
      "subject": "⌛ 1 hour to go! Final prep checklist",
      "previewText": "We're meeting soon - here's your checklist",
      "body": "Hey {{contact.first_name}},\\n\\nWe're meeting in just ONE HOUR! 🎉\\n\\n**Quick Final Checklist:**\\n\\n☐ Quiet space? Check\\n☐ Notes ready? Check\\n☐ Questions prepared? Check\\n☐ Open mind? Check\\n\\n**3 Key Insights to Remember:**\\n\\n1️⃣ [Tip #1 title - brief one-liner]\\n2️⃣ [Tip #2 title - brief one-liner]\\n3️⃣ [Tip #3 title - brief one-liner]\\n\\nWe'll build on all of these during our call.\\n\\n**Join the call here:** [Session Link]\\n\\n(I recommend clicking this link a few minutes early to make sure everything works)\\n\\nI'm excited to meet you and help you break through to [outcome].\\n\\nSee you in 60 minutes!\\n\\n[Your Name]"
    },
    "reminder10Minutes": {
      "timing": "10 minutes before appointment",
      "subject": "🔔 We start in 10 minutes!",
      "previewText": "Your call is about to begin",
      "body": "Hey {{contact.first_name}},\\n\\n10 minutes! Let's do this. 💪\\n\\n**Quick Recap of What's Ahead:**\\n✅ [Key feature/benefit 1]\\n✅ [Key feature/benefit 2]\\n✅ [Key feature/benefit 3]\\n\\n**Last-Minute Checklist:**\\n☐ Comfortable spot? ✓\\n☐ Notepad ready? ✓\\n☐ Questions in mind? ✓\\n\\n**Click here to join:** [Session Link]\\n\\nI'm logging on now. See you there!\\n\\n[Your Name]"
    },
    "startingNow": {
      "timing": "At appointment time",
      "subject": "🚀 We're starting NOW - join here",
      "previewText": "Your [Call Name] is live!",
      "body": "{{contact.first_name}}, it's time!\\n\\nYour [Call Name] is starting RIGHT NOW.\\n\\n👉 **JOIN HERE:** [Session Link]\\n\\nI'm on the call waiting for you. This is your moment to:\\n\\n• Get clarity on your [goal area]\\n• Identify what's been holding you back\\n• Walk away with a clear action plan\\n\\nDon't miss this opportunity. Click the link and let's change your trajectory together.\\n\\n[Your Name]"
    },
    "noShowFollowUp": {
      "timing": "15 minutes after missed appointment",
      "subject": "Hey, we missed you! Everything okay?",
      "previewText": "I was looking forward to our call...",
      "body": "Hey {{contact.first_name}},\\n\\nI was on the call waiting for you, but it looks like something came up. No worries - life happens!\\n\\nI don't want you to miss out on the clarity and direction we were going to create together.\\n\\n**Want to reschedule?** Simply pick a new time that works for you:\\n\\n👉 [Booking Link]\\n\\nRemember, on this call you'll:\\n✅ Get clear on exactly what's been keeping you stuck\\n✅ Identify the specific path to [outcome]\\n✅ Leave with actionable next steps\\n\\n[Client Name] almost missed their call too - then rescheduled and ended up [achieving result].\\n\\nDon't let this opportunity slip away.\\n\\nHope you're okay, and hope to see you soon!\\n\\n[Your Name]\\n\\nP.S. If you're no longer interested, just let me know. No hard feelings!"
    }
  }
}
`;

export default appointmentRemindersPrompt;
