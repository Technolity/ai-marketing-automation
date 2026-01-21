/**
 * Brand Colors AI Prompt
 * 
 * Generates a professional brand color palette based on:
 * - User's brand colors input from questionnaire
 * - Business type and industry
 * - Brand voice and target audience
 * 
 * Returns structured JSON with:
 * - Primary color
 * - Secondary color
 * - Accent color
 * - Text colors (light/dark)
 * - Hex codes for each
 */

export function brandColorsPrompt(data) {
    const {
        brandColors = '',  // User's input from questionnaire Q15
        businessType = '',
        industry = '',
        brandVoice = '',
        idealClient = ''
    } = data;

    console.log('[BrandColorsPrompt] Received data keys:', Object.keys(data));
    console.log('[BrandColorsPrompt] brandColors value:', brandColors ? `"${brandColors.substring(0, 100)}..."` : 'EMPTY');
    console.log('[BrandColorsPrompt] businessType:', businessType);
    console.log('[BrandColorsPrompt] industry:', industry);

    return `You are an expert brand designer and color psychologist. Your task is to create a professional, cohesive color palette for a business.

# USER'S BRAND COLOR INPUT
${brandColors || 'No specific colors provided - recommend professional palette'}

# BUSINESS CONTEXT
Business Type: ${businessType}
Industry: ${industry}
Brand Voice: ${brandVoice}
Target Audience: ${idealClient.substring(0, 200)}

# YOUR TASK
Analyze the user's brand color input and business context to create a complete, professional color palette.

**If user provided specific colors:**
- Parse and validate their color choices
- Create a cohesive palette around those colors
- Add complementary colors if needed
- Ensure proper contrast ratios for accessibility

**If user didn't provide specific colors:**
- Recommend colors based on:
  * Industry standards (e.g., blue for trust/finance, green for health/sustainability)
  * Brand voice (e.g., bold/vibrant vs. calm/professional)
  * Target audience psychology
  * Current design trends

# COLOR PSYCHOLOGY GUIDELINES
- Blue: Trust, stability, professionalism (tech, finance, healthcare)
- Green: Growth, health, sustainability (wellness, environment, organic)
- Purple: Luxury, creativity, wisdom (premium brands, education)
- Red/Orange: Energy, passion, urgency (food, fitness, sales)
- Black/Charcoal: Sophistication, elegance (luxury, fashion, legal)
- Gold/Warm tones: Premium, success, achievement (coaching, consulting)

# REQUIRED OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:

{
  "primaryColor": {
    "name": "Navy Blue",
    "hex": "#1E3A8A",
    "usage": "Main brand color - headers, CTAs, primary elements"
  },
  "secondaryColor": {
    "name": "Charcoal Grey",
    "hex": "#374151",
    "usage": "Secondary elements, backgrounds, borders"
  },
  "accentColor": {
    "name": "Warm Gold",
    "hex": "#F59E0B",
    "usage": "Highlights, call-to-actions, important elements"
  },
  "textColorDark": {
    "name": "Deep Navy",
    "hex": "#1F2937",
    "usage": "Primary text on light backgrounds"
  },
  "textColorLight": {
    "name": "Off White",
    "hex": "#F9FAFB",
    "usage": "Text on dark backgrounds"
  },
  "backgroundColor": {
    "name": "Clean White",
    "hex": "#FFFFFF",
    "usage": "Main background"
  },
  "backgroundSecondary": {
    "name": "Light Grey",
    "hex": "#F3F4F6",
    "usage": "Section backgrounds, cards"
  },
  "reasoning": "Brief explanation of why these colors work for this business (2-3 sentences)",
  "userInputUsed": true/false
}

# QUALITY REQUIREMENTS
1. All hex codes must be valid 6-digit format (#RRGGBB)
2. Ensure sufficient contrast (WCAG AA minimum):
   - Text on background: 4.5:1 ratio minimum
   - Large text: 3:1 ratio minimum
3. Colors must be harmonious and professional
4. Consider accessibility for color-blind users
5. Palette should work across print and digital media

Return ONLY the JSON object, no additional text.`;
}

export default brandColorsPrompt;
