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

    return `You are an expert brand designer and color psychologist with a keen eye for color hierarchy and visual impact.

# USER'S BRAND COLOR INPUT
${brandColors || 'No specific colors provided - recommend professional palette'}

# BUSINESS CONTEXT
Business Type: ${businessType}
Industry: ${industry}
Brand Voice: ${brandVoice}
Target Audience: ${idealClient.substring(0, 200)}

# YOUR TASK
Create a **3-color brand palette** (Primary, Secondary, Tertiary) with intelligent color hierarchy.

## If User Provided Colors:
1. **Parse their colors** - Extract all color names/hex codes
2. **Intelligently determine hierarchy**:
   - **PRIMARY**: The most impactful color - used for main brand identity, major headings, key elements (typically the boldest, most memorable color)
   - **SECONDARY**: Supporting color - provides contrast and balance (often a neutral or complementary tone)
   - **TERTIARY**: Accent color - for CTAs, highlights, attention-grabbing elements (often the brightest or most energetic)

3. **Smart Selection Logic**:
   - If user gives "Navy Blue, Gold, Charcoal":
     * PRIMARY = Navy Blue (strong, trustworthy, main brand color)
     * SECONDARY = Charcoal (neutral support, readability)
     * TERTIARY = Gold (accent for CTAs, premium feel)

   - If user gives "Black, Gold":
     * PRIMARY = Black (bold, sophisticated main color)
     * SECONDARY = Charcoal Grey (add contrast, softer than black)
     * TERTIARY = Gold (accent, premium)

   - Consider:
     * **Color order** - first mentioned is often the intended primary
     * **Color boldness** - bolder colors typically primary
     * **Industry fit** - does this make sense for their business?
     * **Visual hierarchy** - primary should dominate, tertiary should pop

4. **Refine to professional hex codes** - Convert color names to exact hex values

## If User Provided NO Colors:
Recommend colors based on:
- **Industry standards** (blue for finance/tech, green for health, etc.)
- **Brand voice** (bold vs. calm, playful vs. serious)
- **Target audience psychology**
- **Current design trends**

# COLOR PSYCHOLOGY QUICK REFERENCE
- **Blue**: Trust, stability, professionalism (tech, finance, healthcare)
- **Green**: Growth, health, sustainability (wellness, environment)
- **Purple**: Luxury, creativity, wisdom (premium brands, education)
- **Red/Orange**: Energy, passion, urgency (food, fitness, sales)
- **Black/Charcoal**: Sophistication, elegance (luxury, fashion, legal)
- **Gold/Warm tones**: Premium, success, achievement (coaching, consulting)

# CRITICAL: REQUIRED OUTPUT FORMAT
Return ONLY valid JSON with this EXACT structure (no additional fields):

{
  "primary": {
    "name": "Navy Blue",
    "hex": "#000080"
  },
  "secondary": {
    "name": "Charcoal Grey",
    "hex": "#36454F"
  },
  "tertiary": {
    "name": "Warm Gold",
    "hex": "#D4AF37"
  },
  "reasoning": "Navy Blue chosen as primary for trust and professionalism in the ${industry} industry. Charcoal Grey provides sophisticated contrast as secondary. Warm Gold as tertiary creates premium accent for CTAs, aligning with the ${businessType} positioning."
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
