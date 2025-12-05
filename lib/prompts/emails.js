/**
 * 18  Nudge Email Sequence Generator
 * Complete framework from prompts.txt for appointment booking
 */

export const emailsPrompt = (data) => `
Create a series of 18 emails that will encourage a client to pick up the phone to set a consultation call. The last three will be on the last day with maximum urgency.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

===== EMAILS 1-5 =====

**Email 1: Welcome Email**
Subject Line: Welcome! Your Journey to Success Begins Here
- Hi {{contact.first_name}}
- Thank you for watching our video training! We're thrilled to have you on board
- If missed video, here's the link
- First actionable tip from VSL with explanation
- Invitation to schedule free consultation call
- P.S. Stay tuned for more tips!

**Email 2: Second Tip**
Subject Line: Here's Your Next Tip to Achieve Success
- Hi {{contact.first_name}}
- Hope first tip was useful
- Second actionable tip with explanation
- Reminder about free consultation call
- P.S. Keep an eye on inbox!

**Email 3: Third Tip**
Subject Line: Your Next Step Towards Achieving Your Goals
- Hi {{contact.first_name}}
- Time for another tip
- Third actionable tip with explanation
- Perfect time to schedule free consultation
- P.S. More tips coming!

**Email 4: Summary**
Subject Line: Quick Recap: Your First Three Tips for Success
- Quick summary of all three tips
- Reference earlier emails for details
- Reminder about consultation call

**Email 5: Steps to Success**
Subject Line: Your Roadmap to Success in [Field]
- Recap of three tips
- Full steps to success from VSL
- Reminder about consultation call

===== EMAILS 6-10 =====

**Email 6: Last Chance Review**
Subject Line: Last Chance: Don't Miss Out on These Crucial Tips and Steps!
- This is last chance to review tips and steps
- Will not be repeated
- Recap everything

**Email 7: Transform Your Journey**
Subject Line: Your Invitation to Transform Your Journey
- Why schedule free consultation:
  - Gain Clarity on Goals
  - Identify Primary Obstacle
  - Discover Effective Strategies
- This is the start of something amazing

**Email 8: Success Story**
Subject Line: Success Story: Achieve Your Goals with Our Proven Strategies
- Share a powerful client success story
- Before/After transformation
- Direct quote from client
- This could be you

**Email 9: 48 Hours Left**
Subject Line: URGENT: Last Chance for Your Free Consultation Call!
- Only 48 hours left
- Why can't afford to miss this call
- SCHEDULE YOUR FREE CALL NOW!

**Email 10: FAQs**
Subject Line: Got Questions? Here Are the Answers You Need!
- 5 FAQs with answers
- Still time to schedule

===== EMAILS 11-15 =====

**Email 11: Book by Tomorrow**
Subject Line: FINAL NOTICE: Book Your Free Consultation Call by Tomorrow!
- Final opportunity - ends tomorrow
- Benefits of the call
- ACT NOW

**Email 12: Final Hours**
Subject Line: Urgent: Final Hours to Book Your Free Consultation Call!
- Clock is ticking - few hours left
- Quick benefits recap
- Don't wait any longer

**Email 13: Final Hour**
Subject Line: Final Hour Alert: Book Your Free Consultation Call Now!
- Down to final hour
- Act now

**Email 14: Final Minutes**
Subject Line: Last Chance: Book Your Free Consultation Call Now!
- Final few minutes
- This is your last chance

**Email 15: Window Extended**
Subject Line: Great News! Booking Window Extended for Your Free Consultation Call
- Due to popular demand, extended window
- Don't miss this extended opportunity
- This extension won't last long

===== EMAILS 16-18 =====

**Email 16: Additional Spots**
Subject Line: Surprise! More Spots Opened for Your Free Consultation Call
- Surprise - additional spots opened
- Limited spots - don't wait

**Email 17: Final Day**
Subject Line: Final Day! Book Your Free Consultation Call Today
- This is it - final day
- Only a few spots left
- Filling up fast

**Email 18: Last Spot**
Subject Line: URGENT: Last Spot for Free Consultation Call – Act Now!
- FINAL - only one spot left
- Once gone, no more opportunities
- SCHEDULE YOUR FREE CALL NOW!

Return ONLY valid JSON in this exact structure:
{
  "emailSequence": {
    "emails": [
      {
        "emailNumber": 1,
        "day": "Day 1",
        "subject": "Subject line with emoji if appropriate",
        "preheader": "Email preview text",
        "body": "Complete email body with {{contact.first_name}} placeholders",
        "cta": "Call to action button text",
        "ps": "P.S. content if applicable"
      }
    ],
    "timing": {
      "email1": "Immediately after opt-in",
      "email2": "Day 2",
      "email3": "Day 3",
      "email4": "Day 4",
      "email5": "Day 5",
      "email6": "Day 6",
      "email7": "Day 7",
      "email8": "Day 8",
      "email9": "Day 9 - 48 hours before deadline",
      "email10": "Day 10",
      "email11": "Day 11",
      "email12": "Final day - morning",
      "email13": "Final day - afternoon",
      "email14": "Final day - evening",
      "email15": "Extension announcement",
      "email16": "Additional spots day",
      "email17": "True final day",
      "email18": "Last spot - final email"
    }
  }
}
`;

export default emailsPrompt;
