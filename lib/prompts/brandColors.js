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
    // Check multiple keys for brand colors (named key, or step IDs 15/21)
    brandColors = data.brandColors || data['15'] || data['21'] || '',
    businessType = '',
    industry = '',
    brandVoice = '',
    idealClient = ''
  } = data;

  console.log('[BrandColorsPrompt] Received data keys:', Object.keys(data));
  console.log('[BrandColorsPrompt] brandColors value:', brandColors ? `"${brandColors.substring(0, 100)}..."` : 'EMPTY');
  console.log('[BrandColorsPrompt] businessType:', businessType);
  console.log('[BrandColorsPrompt] industry:', industry);

  return `You are an expert brand designer specializing in classy, minimal funnel design.

# USER'S BRAND COLOR INPUT
${brandColors || 'No specific colors provided - recommend professional palette based on industry'}

# BUSINESS CONTEXT
Business Type: ${businessType}
Industry: ${industry}
Brand Voice: ${brandVoice}
Target Audience: ${idealClient.substring(0, 200)}

# CRITICAL COLOR HIERARCHY RULES
You MUST follow these rules EXACTLY to ensure a classy, high-converting funnel design:

## RULE 1: PRIMARY COLOR (Background Color for Funnel)
- Take the user's brand color and convert it to a **DARKER version** unless they explicitly say "light" or "pastel".
- If user says "Red" → Use Dark Red/Maroon (#8B0000, #A52A2A)
- If user says "Blue" → Use Dark Navy (#1E3A5F, #0A1929)
- If user says "Green" → Use Dark Forest Green (#1B4332, #0D3B2E)
- If user says "Purple" → Use Deep Purple (#3C1361, #2D0A4E)
- If user says "Gold" → Use Rich Gold/Bronze (#8B6914, #B8860B)
- The PRIMARY is used for **funnel backgrounds**, hero sections, and brand identity elements.
- It should feel bold, premium, and eye-catching.

## RULE 2: TERTIARY COLOR (Text Color for Easy Readability)
- Based on the PRIMARY color's brightness:
  - If PRIMARY is **DARK** (like dark blue, maroon, black) → TERTIARY = **WHITE (#FFFFFF)**
  - If PRIMARY is **LIGHT** (like light pink, cream, pastel) → TERTIARY = **BLACK (#000000)** or Dark Charcoal (#111111)
- The TERTIARY is used for **ALL body text, headings, and readable content**.
- It MUST ensure maximum contrast and readability against the primary background.
- Keep it monochromatic: White, Black, or very dark Grey. Never use colorful text!

## RULE 3: SECONDARY COLOR (Buttons, Navbars, Footer, Cards)
- Based on the TERTIARY selection:
  - If TERTIARY = **WHITE** → SECONDARY = **BLACK (#000000)** or very dark Charcoal (#1A1A1A)
  - If TERTIARY = **BLACK** → SECONDARY = **WHITE (#FFFFFF)** or very light Grey (#F5F5F5)
- The SECONDARY is used for:
  - Navigation bar backgrounds
  - Footer backgrounds
  - Card backgrounds
  - CTA Button backgrounds (with opposite text color)
- This creates clean visual separation and a classy, minimal aesthetic.

## SUMMARY OF COLOR USAGE
| Color Slot | Usage in Funnel | Expected Look |
|------------|-----------------|---------------|
| PRIMARY    | Hero backgrounds, section backgrounds, brand identity | Bold, dark, premium |
| SECONDARY  | Navbars, footers, cards, buttons | Contrast element (Black/White) |
| TERTIARY   | All text content, headings, body copy | High readability (White/Black) |

## EXAMPLE OUTPUTS:
- **User says "Red"**:
  * PRIMARY: Deep Maroon (#800020) - for backgrounds
  * TERTIARY: White (#FFFFFF) - for all text (contrast with dark maroon)
  * SECONDARY: Black (#1A1A1A) - for navbars, buttons, cards

- **User says "Light Blue, Gold"**:
  * PRIMARY: Rich Navy (#1E3A5F) - darker version of light blue
  * TERTIARY: White (#FFFFFF) - for text contrast
  * SECONDARY: Black (#111111) - for structural elements

- **User says "Black, Gold"**:
  * PRIMARY: Deep Black (#0A0A0A) - already dark, use as-is
  * TERTIARY: White (#FFFFFF) - for text on black
  * SECONDARY: Charcoal (#1F1F1F) - slight variation for depth

- **User says only "Gold"** (just one color):
  * PRIMARY: Deep Antique Gold (#8B6914) - darker gold for backgrounds
  * TERTIARY: White (#FFFFFF) - for text contrast
  * SECONDARY: Black (#111111) - for buttons, nav, cards

# CRITICAL: REQUIRED OUTPUT FORMAT
Return ONLY valid JSON with this EXACT structure:

{
  "primary": {
    "name": "Deep Maroon",
    "hex": "#800020"
  },
  "secondary": {
    "name": "Charcoal Black",
    "hex": "#1A1A1A"
  },
  "tertiary": {
    "name": "Pure White",
    "hex": "#FFFFFF"
  },
  "reasoning": "User's brand color 'Red' was converted to Deep Maroon for a premium, bold background. White ensures maximum readability for all text. Black provides clean contrast for navigation and buttons, creating a classy, minimal aesthetic."
}

# QUALITY REQUIREMENTS
1. All hex codes must be valid 6-digit format (#RRGGBB)
2. PRIMARY should ALWAYS be a dark/rich version (unless user explicitly says light)
3. TERTIARY should ONLY be White (#FFFFFF), Black (#000000), or very dark/light grey
4. SECONDARY should ONLY be Black (#000000/#111111) or White (#FFFFFF/#F5F5F5)
5. The palette must create a classy, high-end, minimal look - NOT colorful or playful

Return ONLY the JSON object, no additional text.`;
}

export default brandColorsPrompt;
