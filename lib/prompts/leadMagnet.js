/**
 * Lead Magnet Generator
 * Creates 5-page workbook + fulfillment emails + SMS from prompts.txt framework
 */

export const leadMagnetPrompt = (data) => `
Lead Magnet Creation - Free Gift Workbook & Delivery Emails

Use the three tips from the VSL to create a five-page workbook that we will paste into Canva. We will use the workbook as a Lead Magnet.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

WORKBOOK FRAMEWORK:

**Page 1 - Introduction Page:**
- Include a robust introductory paragraph
- Do NOT list the three tips that are about to be revealed
- The introduction should be inspiring and should motivate the reader to continue

**Pages 2-4 - One Tip Per Page:**
For each tip page include:
- A title for the tip
- A three-sentence description of the tip
- Three bullet point benefits for applying the tip, followed by a two-sentence description/clarification for each bullet point
- A reflection/application question about the personal benefits of applying that tip in their context

**Page 5 - Summary & CTA:**
- A robust, inspiring, and motivating summary
- A short paragraph that includes a call to action to schedule a consultation call
- Final paragraph should be center justified and simply say "Click Here to Schedule your Call"

**Title Options:**
Provide six marketable titles for this workbook:
- Two should be humorous
- Two should be controversial
- Two should be professional

---

**FULFILLMENT EMAIL (sent immediately after opt-in):**
Subject Line: Powerful and relevant with 🎉 emoji
Body Framework:
- Hi {{contact.first_name}}
- Congratulations and thanks for ordering [Lead Magnet Title]
- List one benefit they'll derive from this workbook/guide
- Encourage them to download the file immediately before they forget it
- Download your copy here [Link]
- And if you haven't scheduled your one-on-one [coaching session], then you're going to want to do that now
- List one benefit they'll derive from the appointment
- Click here to schedule your appointment now
- See you soon, [Your Name]
- P.S. Include another reminder to download with the download link

---

**SMS TEXT (sent after email):**
Hi {{contact.first_name}}
Thanks for requesting my [Lead Magnet Title]. I just sent you an email with all the details, but it's probably a very lazy email and it's lounging around in your Spam Folder (or if it's sneaky, it may be hiding behind your Promotion's Tab).
Do me a favor – go find that email and drag its lazy electrons into your Inbox and then hit Reply to let me know you've downloaded it. (And then download the ebook! It'll be worth it – I promise!)
[Your Name]

---

**FORGOT TO DOWNLOAD EMAIL (sent day after if not downloaded):**
Subject Line: "Forgot Something?"
- Hi {{contact.first_name}}
- Reminder that they'd ordered [Lead Magnet Title]
- Create urgency by providing a benefit they'll get by downloading it immediately
- Provide the Download Here link
- See you soon, [Your Name]

Return ONLY valid JSON in this exact structure:
{
  "leadMagnet": {
    "titleOptions": {
      "humorous": ["Funny Title 1", "Funny Title 2"],
      "controversial": ["Bold Title 1", "Bold Title 2"],
      "professional": ["Pro Title 1", "Pro Title 2"]
    },
    "selectedTitle": "The recommended title",
    "workbook": {
      "page1_introduction": {
        "headline": "Compelling headline",
        "paragraph": "Inspiring introductory paragraph that motivates without revealing the tips"
      },
      "page2_tip1": {
        "title": "Tip 1 Title",
        "description": "Three-sentence description",
        "benefits": [
          {"bullet": "Benefit 1", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 2", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 3", "clarification": "Two-sentence clarification"}
        ],
        "reflectionQuestion": "Personal application question"
      },
      "page3_tip2": {
        "title": "Tip 2 Title",
        "description": "Three-sentence description",
        "benefits": [
          {"bullet": "Benefit 1", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 2", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 3", "clarification": "Two-sentence clarification"}
        ],
        "reflectionQuestion": "Personal application question"
      },
      "page4_tip3": {
        "title": "Tip 3 Title",
        "description": "Three-sentence description",
        "benefits": [
          {"bullet": "Benefit 1", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 2", "clarification": "Two-sentence clarification"},
          {"bullet": "Benefit 3", "clarification": "Two-sentence clarification"}
        ],
        "reflectionQuestion": "Personal application question"
      },
      "page5_summary": {
        "summaryParagraph": "Inspiring and motivating summary",
        "ctaParagraph": "Call to action to schedule consultation",
        "buttonText": "Click Here to Schedule your Call"
      }
    },
    "fulfillmentEmail": {
      "subject": "🎉 Subject line with emoji",
      "body": "Complete email body with all placeholders",
      "downloadCTA": "Download your copy here [Link]",
      "appointmentCTA": "Click here to schedule your appointment now",
      "ps": "P.S. reminder with download link"
    },
    "smsText": "Complete SMS message",
    "forgotEmail": {
      "subject": "Forgot Something?",
      "body": "Complete email with urgency",
      "downloadCTA": "Download Here link"
    }
  }
}
`;

export default leadMagnetPrompt;
