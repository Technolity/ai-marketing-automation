/**
 * 18-Email Nurture Sequence - Deterministic Prompt
 * Complete email sequence ready to copy-paste into GHL
 * 
 * CRITICAL: Every email must have COMPLETE subject and body - no templates
 */

export const emailsPrompt = (data) => `
You are writing the ACTUAL email sequence for a real business.

THIS IS NOT AN EXAMPLE. These are REAL emails that will be:
- Loaded directly into GoHighLevel
- Sent to thousands of real leads
- Used to convert prospects into paying clients

CRITICAL RULES:
1. NO "[Insert here]", "for example", "TBD", "[LINK]" without context
2. Every email body must be COMPLETE (200-400 words each)
3. Use {{contact.first_name}} for personalization
4. Use [Schedule Link] as the actual placeholder for the booking link
5. Each email must flow naturally and be ready to send AS-IS
6. Write conversationally based on the brand voice
7. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA:

Business Name: ${data.businessName || 'Your Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
Primary problem they face: ${data.coreProblem || 'Not specified'}
Outcomes they want: ${data.outcomes || 'Not specified'}
Your unique approach: ${data.uniqueAdvantage || 'Not specified'}
Your story (Source Data):
- The Pit: ${data.storyLowMoment || 'Not specified'}
- The Discovery: ${data.storyDiscovery || 'Not specified'}
- The Breakthrough: ${data.storyBreakthrough || 'Not specified'}
- The Outcome: ${data.storyResults || 'Not specified'}
Client results / testimonials: ${data.testimonials || 'Not specified'}
Main offer / program: ${data.offerProgram || 'Not specified'}
Deliverables: ${data.deliverables || 'Not specified'}
Brand voice: ${data.brandVoice || 'Not specified'}

EMAIL SEQUENCE STRUCTURE:
- Emails 1-5: Welcome, deliver value with 3 tips, build relationship
- Emails 6-10: Deeper engagement, success stories, invitation to call, FAQ
- Emails 11-15: Urgency sequence - time running out
- Emails 16-18: Final push - last spots, closing

Return ONLY valid JSON with COMPLETE email content:

{
  "emailSequence": {
    "tips": {
      "tip1": {
        "title": "Specific actionable tip title",
        "content": "The full explanation of this tip - what it is, why it matters, 2-3 sentences",
        "actionStep": "The specific action they should take right now"
      },
      "tip2": {
        "title": "Second tip title",
        "content": "Full explanation of tip 2",
        "actionStep": "Specific action for tip 2"
      },
      "tip3": {
        "title": "Third tip title",
        "content": "Full explanation of tip 3",
        "actionStep": "Specific action for tip 3"
      }
    },
    "stepsToSuccess": [
      {"step": 1, "title": "Step 1 Name", "description": "What happens in step 1 and the result"},
      {"step": 2, "title": "Step 2 Name", "description": "What happens in step 2 and the result"},
      {"step": 3, "title": "Step 3 Name", "description": "What happens in step 3 and the result"},
      {"step": 4, "title": "Step 4 Name", "description": "What happens in step 4 and the result"}
    ],
    "faqs": [
      {"question": "How long does it take to see results?", "answer": "Complete answer addressing this concern specifically for this business"},
      {"question": "What if I've tried similar things before?", "answer": "Complete answer explaining why this is different"},
      {"question": "How much time do I need to commit?", "answer": "Complete answer with specific time investment"},
      {"question": "What if it doesn't work for my situation?", "answer": "Complete answer with guarantee or assurance"},
      {"question": "Why should I book a call vs just buy the program?", "answer": "Complete answer explaining the consultation value"}
    ],
    "successStory": {
      "clientName": "Client type or anonymized name",
      "beforeState": "Specific situation before working together",
      "transformation": "What changed and the results achieved",
      "timeframe": "How long it took",
      "quote": "An actual quote or paraphrase from the client"
    },
    "emails": [
      {
        "emailNumber": 1,
        "dayToSend": "Day 0 (Immediately)",
        "purpose": "Welcome + Deliver Tip #1",
        "subjectLine": "Welcome! Here's your first tip to [specific outcome]",
        "previewText": "This changed everything for me...",
        "body": "Hey {{contact.first_name}},\\n\\nWelcome! I'm so glad you took the time to watch the training.\\n\\nBefore we dive deeper, I want to share something that made a massive difference for me (and thousands of my clients).\\n\\n**Tip #1: [Tip Title]**\\n\\n[Full tip content - 2-3 sentences explaining the tip]\\n\\n**Your action step:** [Specific action they can take right now]\\n\\nThis might seem simple, but don't skip it. The people who get the best results are the ones who actually implement what they learn.\\n\\nIf you're ready to take this further and create a personalized plan for your situation, I'd love to chat.\\n\\n👉 [Schedule Link]\\n\\nTalk soon,\\n[Name]\\n\\nP.S. Tomorrow I'll share Tip #2, which builds on what you just learned. Keep an eye on your inbox!"
      },
      {
        "emailNumber": 2,
        "dayToSend": "Day 1",
        "purpose": "Deliver Tip #2",
        "subjectLine": "Tip #2: [Specific outcome they want]",
        "previewText": "This is where most people go wrong...",
        "body": "Hey {{contact.first_name}},\\n\\nYesterday I shared [Tip #1 reference]. Did you take action on it?\\n\\nToday, I want to build on that with something that trips up almost everyone...\\n\\n**Tip #2: [Tip Title]**\\n\\n[Full tip content - 2-3 sentences]\\n\\n**Your action step:** [Specific action]\\n\\nHere's why this matters: [Brief explanation of impact]\\n\\nWhen you combine this with what I shared yesterday, you're already ahead of 90% of [target audience].\\n\\nWant to take it even further? Let's talk about how to apply this to YOUR specific situation.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 3,
        "dayToSend": "Day 2",
        "purpose": "Deliver Tip #3",
        "subjectLine": "The final piece: [Tip #3 outcome]",
        "previewText": "This is the one most people miss...",
        "body": "Hey {{contact.first_name}},\\n\\nOver the past two days, I've shared [Tip 1] and [Tip 2].\\n\\nToday, I'm sharing the final piece that ties it all together...\\n\\n**Tip #3: [Tip Title]**\\n\\n[Full tip content - 2-3 sentences]\\n\\n**Your action step:** [Specific action]\\n\\nWhen you put all three tips together, here's what happens: [Transformation description]\\n\\nBut here's the thing - knowing isn't the same as doing. And doing on your own isn't the same as having a guide.\\n\\nIf you're serious about [outcome], let's talk.\\n\\n👉 [Schedule Link]\\n\\n[Name]\\n\\nP.S. Tomorrow I'll send you a summary of all three tips so you have them in one place."
      },
      {
        "emailNumber": 4,
        "dayToSend": "Day 3",
        "purpose": "Recap all 3 tips",
        "subjectLine": "📋 Your 3-tip cheat sheet",
        "previewText": "Everything in one place...",
        "body": "Hey {{contact.first_name}},\\n\\nAs promised, here's a quick recap of everything I've shared this week:\\n\\n**Tip #1: [Title]**\\nAction: [Action step]\\n\\n**Tip #2: [Title]**\\nAction: [Action step]\\n\\n**Tip #3: [Title]**\\nAction: [Action step]\\n\\nSave this email - it's your mini-playbook for [outcome].\\n\\nNow, here's what I've noticed: The people who get results are the ones who take action. Not someday. TODAY.\\n\\nSo let me ask you: Where are you stuck right now?\\n\\nBecause if you've been trying to [achieve outcome] and it's not working, there's probably a reason. And I'd love to help you figure out what it is.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 5,
        "dayToSend": "Day 4",
        "purpose": "Steps to Success overview",
        "subjectLine": "The 4-step roadmap to [outcome]",
        "previewText": "Here's the exact path...",
        "body": "Hey {{contact.first_name}},\\n\\nYou've got the 3 tips. Now let me show you the bigger picture - the exact 4-step process that's helped [number]+ [audience type] achieve [outcome].\\n\\n**Step 1: [Title]**\\n[Description and benefit]\\n\\n**Step 2: [Title]**\\n[Description and benefit]\\n\\n**Step 3: [Title]**\\n[Description and benefit]\\n\\n**Step 4: [Title]**\\n[Description and benefit]\\n\\nThe tips I shared this week? They're part of Step 1. But they're just the beginning.\\n\\nIf you want to see how all four steps would work for YOUR specific situation, let's talk.\\n\\n👉 [Schedule Link]\\n\\nOn the call, we'll map out exactly what this would look like for you.\\n\\n[Name]"
      },
      {
        "emailNumber": 6,
        "dayToSend": "Day 5",
        "purpose": "Last chance for tips content",
        "subjectLine": "⚠️ Last chance to review this",
        "previewText": "After today, this goes away...",
        "body": "Hey {{contact.first_name}},\\n\\nI've been sending you some of my best stuff this week - the 3 tips, the 4-step roadmap, all of it.\\n\\nBut here's the thing: Information without action is just entertainment.\\n\\nSo I have to ask... Have you actually done anything with what I've shared?\\n\\nBecause if you're still in the same place you were a week ago - still [dealing with problem], still [frustrated by situation] - then nothing changes.\\n\\nI'm not trying to be harsh. I'm trying to help you.\\n\\nIf you're ready to stop just learning and start DOING, let's talk. I'll help you cut through the noise and figure out exactly what YOU need to focus on.\\n\\n👉 [Schedule Link]\\n\\n[Name]\\n\\nP.S. I only take a limited number of calls each week. If you're serious, don't wait."
      },
      {
        "emailNumber": 7,
        "dayToSend": "Day 6",
        "purpose": "Invitation to join",
        "subjectLine": "You're invited 🎉",
        "previewText": "This is what the call is really about...",
        "body": "Hey {{contact.first_name}},\\n\\nI've been sharing a lot of free content with you. And I hope it's been valuable.\\n\\nBut today I want to extend a personal invitation...\\n\\nI want to invite you to a free [Call Name] with me/our team.\\n\\nHere's what we'll do on the call:\\n\\n✅ **Get clarity** - We'll dig into exactly where you are now and where you want to be\\n✅ **Identify obstacles** - We'll figure out what's actually been holding you back\\n✅ **Map your path** - You'll leave with a clear plan for [outcome]\\n\\nThis isn't a sales pitch disguised as a consultation. It's a real strategy session where you'll get actual value - whether you end up working with us or not.\\n\\nInterested?\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 8,
        "dayToSend": "Day 7",
        "purpose": "Success story",
        "subjectLine": "How [Client] went from [before] to [after]",
        "previewText": "This could be you...",
        "body": "Hey {{contact.first_name}},\\n\\nI want to share a quick story about [Client Name/Type].\\n\\nWhen they first came to us, they were [specific before state - struggling with problem].\\n\\nThey had tried [what they tried before] but nothing was working.\\n\\nSound familiar?\\n\\nHere's what happened: [Brief description of what they did - following the process]\\n\\nThe result? [Specific after state with numbers/timeframe]\\n\\nIn their words: '[Client quote]'\\n\\nThe thing is, [Client Name] isn't special. They're just like you - dealing with [common situation]. The difference is they decided to take action.\\n\\nIf you want to be our next success story, let's talk.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 9,
        "dayToSend": "Day 8",
        "purpose": "Urgency - 48 hours",
        "subjectLine": "🚨 48 hours left",
        "previewText": "Time is running out...",
        "body": "Hey {{contact.first_name}},\\n\\nI wanted to give you a heads up - we're closing our calendar for new [Call Name] bookings in 48 hours.\\n\\nWhy? Because we can only take on [number] new clients this month, and we're almost at capacity.\\n\\nIf you've been thinking about booking a call but haven't pulled the trigger yet... this is your sign.\\n\\nRemember what you get on the call:\\n\\n✅ Clarity on your current situation\\n✅ Understanding of what's been holding you back\\n✅ A clear path forward to [outcome]\\n\\nNo pressure, no obligation. Just a real conversation about your goals.\\n\\nBut you have to book in the next 48 hours.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 10,
        "dayToSend": "Day 9",
        "purpose": "FAQ",
        "subjectLine": "Quick answers to your questions",
        "previewText": "I know what you're wondering...",
        "body": "Hey {{contact.first_name}},\\n\\nI've been doing this for a while, so I know what questions are probably running through your head right now.\\n\\nLet me address a few:\\n\\n**Q: How long does it take to see results?**\\n[Complete answer]\\n\\n**Q: What if I've tried similar things before?**\\n[Complete answer]\\n\\n**Q: How much time do I need to commit?**\\n[Complete answer]\\n\\n**Q: What if it doesn't work for my situation?**\\n[Complete answer]\\n\\n**Q: Why should I book a call instead of just buying?**\\n[Complete answer]\\n\\nStill have questions? That's exactly what the call is for.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 11,
        "dayToSend": "Day 10",
        "purpose": "Final notice - tomorrow",
        "subjectLine": "⏰ Calendar closes TOMORROW",
        "previewText": "Last chance to get on the schedule",
        "body": "Hey {{contact.first_name}},\\n\\nJust a quick note - our calendar for [Call Name] bookings closes tomorrow.\\n\\nAfter that, you'll have to wait until next month to schedule (and there's no guarantee we'll have spots then).\\n\\nIf you've been on the fence, here's my advice: Just book the call.\\n\\n- If it's not a fit, no problem. You'll still leave with valuable insights.\\n- If it IS a fit, you'll have a clear path to [outcome].\\n\\nEither way, you win.\\n\\nBut only if you take action.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 12,
        "dayToSend": "Day 11 (Morning)",
        "purpose": "Final hours",
        "subjectLine": "🔴 Final hours",
        "previewText": "Calendar closing today...",
        "body": "Hey {{contact.first_name}},\\n\\nThis is it. Calendar closes in a few hours.\\n\\nI've shared:\\n✅ The 3 tips\\n✅ The 4-step roadmap\\n✅ Success stories\\n✅ Answered your questions\\n\\nNow it's up to you.\\n\\nYou can keep doing what you've been doing (and keep getting the same results).\\n\\nOr you can book a call and find out what's actually possible.\\n\\n👉 [Schedule Link]\\n\\nYour choice.\\n\\n[Name]"
      },
      {
        "emailNumber": 13,
        "dayToSend": "Day 11 (Afternoon)",
        "purpose": "1 hour left",
        "subjectLine": "⌛ 1 hour warning",
        "previewText": "Last call...",
        "body": "{{contact.first_name}},\\n\\nOne hour. That's all you have left.\\n\\nAfter that, the calendar closes and you'll have to wait until next month.\\n\\nI know you're busy. I know there's always something else demanding your attention.\\n\\nBut ask yourself: What happens if nothing changes? What does [their problem] cost you over the next 30 days? 90 days?\\n\\nIs that worth 30 minutes of your time to explore a solution?\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 14,
        "dayToSend": "Day 11 (Evening)",
        "purpose": "Final minutes",
        "subjectLine": "Closing now...",
        "previewText": "This is it",
        "body": "{{contact.first_name}},\\n\\nCalendar is closing.\\n\\nIf you want to talk before next month, you need to book now.\\n\\n👉 [Schedule Link]\\n\\nThat's all. No pressure. Just a fact.\\n\\n[Name]"
      },
      {
        "emailNumber": 15,
        "dayToSend": "Day 12",
        "purpose": "Extended window",
        "subjectLine": "🎉 Good news - extension granted",
        "previewText": "You got a second chance...",
        "body": "Hey {{contact.first_name}},\\n\\nI've got good news.\\n\\nWe had a few cancellations, which means I was able to open up a few more spots on the calendar.\\n\\nSo if you missed the deadline yesterday, you're in luck.\\n\\nBut I have to be honest - these spots won't last long. When they're gone, they're gone.\\n\\nIf you've been meaning to book a call, this is your second chance.\\n\\n👉 [Schedule Link]\\n\\nDon't let this one slip by too.\\n\\n[Name]"
      },
      {
        "emailNumber": 16,
        "dayToSend": "Day 13",
        "purpose": "More spots opened",
        "subjectLine": "✨ Surprise: More spots available",
        "previewText": "Due to demand...",
        "body": "Hey {{contact.first_name}},\\n\\nDue to overwhelming demand, we've decided to open up [number] additional spots for [Call Name] this week.\\n\\nI don't normally do this, but I've been getting so many messages from people who missed the original deadline...\\n\\nSo here's your chance.\\n\\nBut let me be clear: This is truly the last extension. After these spots are filled, we're closing for the month.\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 17,
        "dayToSend": "Day 14",
        "purpose": "Final day",
        "subjectLine": "📅 Final day - book or wait 30+ days",
        "previewText": "Make your decision today",
        "body": "Hey {{contact.first_name}},\\n\\nToday's the day.\\n\\nAfter today, the calendar closes for at least 30 days. We need to focus on serving our current clients.\\n\\nSo if you want to talk about [outcome] before then, you need to book today.\\n\\nI've shared everything I can with you - the tips, the framework, the success stories. Now it's up to you.\\n\\nWill you keep [dealing with their problem]? Or will you do something about it?\\n\\n👉 [Schedule Link]\\n\\n[Name]"
      },
      {
        "emailNumber": 18,
        "dayToSend": "Day 15",
        "purpose": "Last spot",
        "subjectLine": "🚨 FINAL: One spot left",
        "previewText": "Last call - literally",
        "body": "{{contact.first_name}},\\n\\nOne spot left.\\n\\nThis is the final email I'll send about this. After today, you won't hear from me about booking a call until next month.\\n\\nIf you've been waiting for a sign... this is it.\\n\\nIf you've been telling yourself 'someday'... today is that day.\\n\\nIf you're tired of [their problem] and ready for [their outcome]... this is your chance.\\n\\nOne spot. One decision. One click.\\n\\n👉 [Schedule Link]\\n\\nI hope to see you on the call.\\n\\n[Name]\\n\\nP.S. Whatever you decide, I appreciate you being here. If now isn't the right time, keep the tips I shared - they work. And when you're ready, I'll be here."
      }
    ]
  }
}
`;

export default emailsPrompt;
