/**
 * VSL (Video Sales Letter) Script Generator
 * Uses the enhanced VSL framework from prompts.txt
 */

export const vslPrompt = (data) => `
We are creating a Video Sales Letter that will be used in a marketing funnel. Viewers will have been promised three tips to solve their most difficult challenge. Take the answers below and populate them into the framework, then turn that template into a full length video sales letter using all the data. Do not include any video direction and do not include any headings or subheadings. The final script should be teleprompter ready.

CLIENT INFORMATION:
${JSON.stringify(data, null, 2)}

ENHANCED VIDEO SALES LETTER FRAMEWORK:

**Introduction**
- Pattern Interrupt: Start with a unique, attention-grabbing introduction that makes reference to a pain point
- Character Introduction: Introduce the avatar narrator or character with a humorous or dramatic angle
- Problem Statement: State the problem or challenge the target audience faces
- Emotional Connection: Add a personal story or relatable scenario

**Solution Presentation**
- Benefit Lead: Highlight the primary benefits of your unique solution
- Unique Solution: Introduce your solution, explaining why it works (trend, problem-solving, urgency)
- Benefits Highlight: Detail how these benefits impact the client's personal and professional life
- Problem Agitation: Emphasize the depth and impact of the problem to make the solution more compelling

**Proof and Credibility**
- Nightmare Story & Breakthrough: Share a story of a major problem and the moment of finding your solution
- Client Testimonials/Case Studies: Share success stories with before-and-after scenarios
- Data Points: Include impressive statistics or achievements
- Authority and Expert Testimonials: Add endorsements from industry experts or notable figures

**Product/Service Features**
- Detailed Description: Elaborate on the product/service features and processes
- Demonstration: Show the product/service in action if possible
- Psychological Triggers: Introduce elements like scarcity, exclusivity, and social proof

**VALUE SECTION (THE MOST IMPORTANT SECTION)**
Educate the customer and give value through 3 tips:
- Tip #1: Give an action step
- Tip #2: Give an action step
- Tip #3: Give an action step

**Engagement and Interaction**
- Direct Engagement: Use interactive elements tailored to your audience
- Urgency Creation: Introduce time-sensitive offers or limited availability
- Clear, Compelling Offer: Present a strong, irresistible offer, including bonuses or special pricing
- List the steps to success of the offer or program: Step 1, Step 2, Step 3, Step 4

**Call to Action (CTA)**
- Recap & Primary CTA: Summarize key points and clearly state the main action (e.g., book a free consultation)
- Offer Features & Price: Detail the features of your offer and its price (if any)
- Bonuses & Secondary CTA: Offer bonuses and an alternative action for hesitant viewers
- Guarantee & Risk Reversal: Include a strong guarantee to reduce perceived risk

**Closing Argument**
- The Close: Conclude the VSL, emphasizing the urgency and importance of taking action now and booking a free consultation. Create a powerful name for the Free Consult that brands it.
- Address Customer Objections: Tackle potential objections with your solutions
- Reiteration of Value: Emphasize ongoing support and future benefits

**Post-CTA Engagement**
- Follow-Up Strategy: Describe the process after the CTA is followed (booking, consultation steps)
- Final Persuasion: Reiterate the unique value proposition and long-term benefits
- Close hard on the Free Consultation. Close by handling objections. Close again with scarcity. And close again with inspiration about belonging to a community or changing the world or having a better life. Speed the client up with words that get them to take action now.

Return ONLY valid JSON in this exact structure:
{
  "vsl": {
    "hook": "The attention-grabbing pattern interrupt opening (30 seconds)",
    "characterIntro": "Introduction of the narrator with personality",
    "problemStatement": "The core problem they face",
    "emotionalConnection": "Personal story or relatable scenario",
    "uniqueSolution": {
      "name": "Name of your unique solution/method",
      "description": "What makes it different",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"]
    },
    "story": {
      "nightmareStory": "The major problem moment",
      "breakthrough": "How you found the solution",
      "transformation": "The results achieved"
    },
    "threeTips": {
      "tip1": {
        "title": "Tip 1 Title",
        "content": "Explanation of the tip",
        "actionStep": "Specific action they can take immediately"
      },
      "tip2": {
        "title": "Tip 2 Title",
        "content": "Explanation of the tip",
        "actionStep": "Specific action they can take immediately"
      },
      "tip3": {
        "title": "Tip 3 Title",
        "content": "Explanation of the tip",
        "actionStep": "Specific action they can take immediately"
      }
    },
    "stepsToSuccess": [
      {"step": 1, "title": "", "description": ""},
      {"step": 2, "title": "", "description": ""},
      {"step": 3, "title": "", "description": ""},
      {"step": 4, "title": "", "description": ""}
    ],
    "testimonials": [
      {"name": "", "story": "", "result": "", "quote": ""}
    ],
    "offer": {
      "name": "The irresistible offer name",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "bonuses": [{"name": "", "value": "", "description": ""}],
      "guarantee": "Risk reversal guarantee"
    },
    "cta": {
      "consultationName": "Branded name for the free consultation",
      "primaryCTA": "Main call to action",
      "urgencyElement": "Time-sensitive element"
    },
    "objectionHandling": [
      {"objection": "Time", "response": ""},
      {"objection": "Money", "response": ""},
      {"objection": "Not the right time", "response": ""}
    ],
    "closingInspiration": "Inspirational close about community/transformation",
    "fullScript": "The complete teleprompter-ready VSL script from start to finish (2000+ words)"
  }
}
`;

export default vslPrompt;
