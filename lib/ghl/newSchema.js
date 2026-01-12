/**
 * New GHL Custom Values Schema (100 values)
 * Auto-generated from CSV: ghl-custom-values-F6NirXNNc04hNj7JcB3R-1768166738035 - Sheet1.csv
 *
 * Structure for each value:
 * - key: Custom value name for GHL (matches CSV exactly)
 * - type: text | color | url | image | video | code
 * - section: Primary vault section this relates to
 * - description: Human-readable description
 * - critical: Boolean (must have value before deployment)
 * - defaultValue: Fallback value if content cannot be generated
 */

export const NEW_GHL_SCHEMA = {
  // === VSL PAGE - ACKNOWLEDGE PILL (3 values) ===
  '02 VSL Acknowledge Pill Text': {
    type: 'text',
    section: 'leadMagnet',
    description: 'Acknowledgement pill text at top of VSL page',
    critical: false,
    defaultValue: 'Your Free Training is on its way to your inbox'
  },
  '02 VSL Acknowledge Pill Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Acknowledge pill text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Acknowledge Pill bg Colour': {
    type: 'color',
    section: 'media',
    description: 'Acknowledge pill background color',
    critical: false,
    defaultValue: '#0891b2'
  },

  // === VSL PAGE - HERO SECTION (5 values) ===
  '02 VSL hero Headline text': {
    type: 'text',
    section: 'vsl',
    description: 'Main VSL hero headline',
    critical: true,
    defaultValue: 'Transform Your Business with Our Proven System'
  },
  '02 VSL hero Headline text Colour': {
    type: 'color',
    section: 'media',
    description: 'Hero headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL CTA Text': {
    type: 'text',
    section: 'vsl',
    description: 'VSL call-to-action button text',
    critical: true,
    defaultValue: 'Get Instant Access'
  },
  '02 VSL CTA Text Colour': {
    type: 'color',
    section: 'media',
    description: 'VSL CTA text color',
    critical: false,
    defaultValue: '#FFFFFF'
  },
  '02 VSL CTA Background Colour': {
    type: 'color',
    section: 'media',
    description: 'VSL CTA button background color',
    critical: false,
    defaultValue: '#0891b2'
  },

  // === VSL PAGE - PROCESS SECTION (12 values) ===
  '02 VSL Process Headline Text': {
    type: 'text',
    section: 'vsl',
    description: 'Process section main headline',
    critical: true,
    defaultValue: 'Here\'s How It Works'
  },
  '02 VSL Process Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Process headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Process Sub -Headline Text': {
    type: 'text',
    section: 'message',
    description: 'Process section sub-headline',
    critical: false,
    defaultValue: 'For coaches, consultants, and service businesses'
  },
  '02 VSL Process Sub -Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Process sub-headline text color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '02 VSL Process Bullet 1 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Process bullet point 1',
    critical: false,
    defaultValue: 'Step 1: Get started with our proven system'
  },
  '02 VSL Process Bullet 2 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Process bullet point 2',
    critical: false,
    defaultValue: 'Step 2: Implement the strategies that work'
  },
  '02 VSL Process Bullet 3 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Process bullet point 3',
    critical: false,
    defaultValue: 'Step 3: Scale your results consistently'
  },
  '02 VSL Process Bullet 4 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Process bullet point 4',
    critical: false,
    defaultValue: 'Step 4: Achieve your goals faster'
  },
  '02 VSL Process Bullet 5 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Process bullet point 5',
    critical: false,
    defaultValue: 'Step 5: Maintain long-term success'
  },
  '02 VSL Process Bullet Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Process bullet points text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Process Bullet Border Colour': {
    type: 'color',
    section: 'media',
    description: 'Process bullet points border color',
    critical: false,
    defaultValue: '#0891b2'
  },

  // === VSL PAGE - AUDIENCE CALLOUT SECTION (10 values) ===
  '02 VSL Audience Callout Headline Text': {
    type: 'text',
    section: 'idealClient',
    description: 'Audience callout section headline',
    critical: false,
    defaultValue: 'Who This Is For:'
  },
  '02 VSL Audience Callout Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Audience callout headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Audience Callout bullet 1 text': {
    type: 'text',
    section: 'idealClient',
    description: 'Audience callout bullet 1',
    critical: false,
    defaultValue: 'Ideal client characteristic 1'
  },
  '02 VSL Audience Callout bullet 2 text': {
    type: 'text',
    section: 'idealClient',
    description: 'Audience callout bullet 2',
    critical: false,
    defaultValue: 'Ideal client characteristic 2'
  },
  '02 VSL Audience Callout bullet 3 text': {
    type: 'text',
    section: 'idealClient',
    description: 'Audience callout bullet 3',
    critical: false,
    defaultValue: 'Ideal client characteristic 3'
  },
  '02 VSL Audience Callout bullets text Colour': {
    type: 'color',
    section: 'media',
    description: 'Audience callout bullets text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Audience Callout CTA Text': {
    type: 'text',
    section: 'vsl',
    description: 'Audience callout CTA/closing text',
    critical: false,
    defaultValue: 'If this sounds like you, we can help'
  },
  '02 VSL Audience Callout CTA Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Audience callout CTA text color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '02 VSL Audience Callout Bullets Border Colour': {
    type: 'color',
    section: 'media',
    description: 'Audience callout bullets border color',
    critical: false,
    defaultValue: '#0891b2'
  },

  // === VSL PAGE - TESTIMONIALS SECTION (19 values) ===
  '02 VSL Testimonials Headline Text': {
    type: 'text',
    section: 'story',
    description: 'Testimonials section headline',
    critical: false,
    defaultValue: 'What Others Are Saying'
  },
  '02 VSL Testimonials Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Testimonials headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Testimonials Sub-Headline Text': {
    type: 'text',
    section: 'story',
    description: 'Testimonials section sub-headline',
    critical: false,
    defaultValue: 'This works for hundreds of others and can work for you too'
  },
  '02 VSL Testimonials Sub-Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Testimonials sub-headline text color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '02 VSL Testimonials Profile Pic 1': {
    type: 'image',
    section: 'media',
    description: 'Testimonial 1 profile picture',
    critical: false,
    defaultValue: ''
  },
  '02 VSL Testimonials Profile Pic 2': {
    type: 'image',
    section: 'media',
    description: 'Testimonial 2 profile picture',
    critical: false,
    defaultValue: ''
  },
  '02 VSL Testimonials Profile Pic 3': {
    type: 'image',
    section: 'media',
    description: 'Testimonial 3 profile picture',
    critical: false,
    defaultValue: ''
  },
  '02 VSL Testimonials Profile Pic 4': {
    type: 'image',
    section: 'media',
    description: 'Testimonial 4 profile picture',
    critical: false,
    defaultValue: ''
  },
  '02 VSL Testimonial Review 1 Headline': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 1 headline/title',
    critical: false,
    defaultValue: 'This has been a game-changer'
  },
  '02 VSL Testimonial Review 2 Headline': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 2 headline/title',
    critical: false,
    defaultValue: 'Incredible results'
  },
  '02 VSL Testimonial Review 3 Headline': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 3 headline/title',
    critical: false,
    defaultValue: 'Highly recommend'
  },
  '02 VSL Testimonial Review 4 Headline': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 4 headline/title',
    critical: false,
    defaultValue: 'Best investment ever'
  },
  '02 VSL Testimonial Review 1 Paragraph with Name': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 1 full review with name',
    critical: false,
    defaultValue: '"Great results with this program." - Client Name'
  },
  '02 VSL Testimonial Review 2 Paragraph with Name': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 2 full review with name',
    critical: false,
    defaultValue: '"Amazing transformation." - Client Name'
  },
  '02 VSL Testimonial Review 3 Paragraph with Name': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 3 full review with name',
    critical: false,
    defaultValue: '"Exceeded my expectations." - Client Name'
  },
  '02 VSL Testimonial Review 4 Paragraph with Name': {
    type: 'text',
    section: 'story',
    description: 'Testimonial 4 full review with name',
    critical: false,
    defaultValue: '"Life-changing experience." - Client Name'
  },
  '02 VSL Testimonial Reviews Headline Colour': {
    type: 'color',
    section: 'media',
    description: 'Testimonial review headlines color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Testimonial Reviews Paragraph with Name Colour': {
    type: 'color',
    section: 'media',
    description: 'Testimonial review paragraphs color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Testimonial Card Background Colour': {
    type: 'color',
    section: 'media',
    description: 'Testimonial card background color',
    critical: false,
    defaultValue: '#D3D3D3'
  },

  // === VSL PAGE - FAQ SECTION (11 values) ===
  '02 VSL FAQ Headline Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ section headline',
    critical: false,
    defaultValue: 'Frequently Asked Questions'
  },
  '02 VSL FAQ Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'FAQ headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL FAQ Question 1 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ question 1',
    critical: false,
    defaultValue: 'What\'s included in this program?'
  },
  '02 VSL FAQ Question 2 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ question 2',
    critical: false,
    defaultValue: 'How long does it take to see results?'
  },
  '02 VSL FAQ Question 3 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ question 3',
    critical: false,
    defaultValue: 'Who is this perfect for?'
  },
  '02 VSL FAQ Question 4 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ question 4',
    critical: false,
    defaultValue: 'Do you offer payment plans?'
  },
  '02 VSL FAQ Question Text Colour': {
    type: 'color',
    section: 'media',
    description: 'FAQ questions text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL FAQ Answer 1 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ answer 1',
    critical: false,
    defaultValue: 'Great question, here\'s the answer.'
  },
  '02 VSL FAQ Answer 2 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ answer 2',
    critical: false,
    defaultValue: 'Great question, here\'s the answer.'
  },
  '02 VSL FAQ Answer 3 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ answer 3',
    critical: false,
    defaultValue: 'Great question, here\'s the answer.'
  },
  '02 VSL FAQ Answer 4 Text': {
    type: 'text',
    section: 'vsl',
    description: 'FAQ answer 4',
    critical: false,
    defaultValue: 'Great question, here\'s the answer.'
  },
  '02 VSL FAQ Answer Text Colour': {
    type: 'color',
    section: 'media',
    description: 'FAQ answers text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL FAQ Border Colour': {
    type: 'color',
    section: 'media',
    description: 'FAQ items border color',
    critical: false,
    defaultValue: '#0891b2'
  },

  // === VSL PAGE - BIO SECTION (6 values) ===
  '02 VSL Bio Headline Text': {
    type: 'text',
    section: 'bio',
    description: 'Bio section headline',
    critical: false,
    defaultValue: 'AUTHORITY BIO'
  },
  '02 VSL Bio Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Bio headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Bio paragraph text': {
    type: 'text',
    section: 'bio',
    description: 'Bio section paragraph content',
    critical: false,
    defaultValue: 'Brief founder bio and story'
  },
  '02 VSL Bio paragraph text Colour': {
    type: 'color',
    section: 'media',
    description: 'Bio paragraph text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Bio Photo': {
    type: 'image',
    section: 'media',
    description: 'Bio section founder photo',
    critical: false,
    defaultValue: ''
  },
  '02 VSL Bio Text Card Background': {
    type: 'color',
    section: 'media',
    description: 'Bio card background color',
    critical: false,
    defaultValue: '#D3D3D3'
  },

  // === VSL PAGE - CALL DETAILS SECTION (13 values) ===
  '02 VSL Call Details Headline text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details section headline',
    critical: false,
    defaultValue: 'What This Call Is / Is Not'
  },
  '02 VSL Call Details Headline text Colour': {
    type: 'color',
    section: 'media',
    description: 'Call details headline color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Call Details Is Heading': {
    type: 'text',
    section: 'vsl',
    description: 'Call details "IS" heading',
    critical: false,
    defaultValue: 'This Call Is:'
  },
  '02 VSL Call Details Is not Heading': {
    type: 'text',
    section: 'vsl',
    description: 'Call details "IS NOT" heading',
    critical: false,
    defaultValue: 'This Call Is Not:'
  },
  '02 VSL Call Details  Heading Colour': {
    type: 'color',
    section: 'media',
    description: 'Call details sub-headings color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Call Details Is bullet 1 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details IS bullet 1',
    critical: false,
    defaultValue: 'A strategic consultation'
  },
  '02 VSL Call Details Is bullet 2 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details IS bullet 2',
    critical: false,
    defaultValue: 'Customized to your business'
  },
  '02 VSL Call Details Is bullet 3 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details IS bullet 3',
    critical: false,
    defaultValue: 'Action-oriented and practical'
  },
  '02 VSL Call Details Is Not bullet 1 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details IS NOT bullet 1',
    critical: false,
    defaultValue: 'A sales pitch'
  },
  '02 VSL Call Details Is Not bullet 2 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details IS NOT bullet 2',
    critical: false,
    defaultValue: 'Generic advice'
  },
  '02 VSL Call Details Is Not bullet 3 Text': {
    type: 'text',
    section: 'vsl',
    description: 'Call details IS NOT bullet 3',
    critical: false,
    defaultValue: 'One-size-fits-all'
  },
  '02 VSL Call Details bullet Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Call details bullets text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 VSL Call Details Card Background Colour': {
    type: 'color',
    section: 'media',
    description: 'Call details card background color',
    critical: false,
    defaultValue: '#D3D3D3'
  },

  // === VSL PAGE - VIDEO & FOOTER (3 values) ===
  '02 VSL video': {
    type: 'video',
    section: 'media',
    description: 'Main VSL video URL',
    critical: true,
    defaultValue: ''
  },
  '02 VSL video background Colour': {
    type: 'color',
    section: 'media',
    description: 'VSL video section background color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '02 Footer Company Name': {
    type: 'text',
    section: 'message',
    description: 'Company name for footer',
    critical: true,
    defaultValue: 'YourBrand™'
  },

  // === OPTIN PAGE (8 values) ===
  '02 Optin Logo Image': {
    type: 'image',
    section: 'media',
    description: 'Optin page logo image',
    critical: false,
    defaultValue: ''
  },
  '02 Optin Mockup Image': {
    type: 'image',
    section: 'media',
    description: 'Optin page product mockup image',
    critical: false,
    defaultValue: ''
  },
  '02 Optin Healine Text': {
    type: 'text',
    section: 'leadMagnet',
    description: 'Optin page main headline',
    critical: true,
    defaultValue: 'Get Your Free Training'
  },
  '02 Optin Healine Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Optin headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 Optin Sub-healine Text': {
    type: 'text',
    section: 'leadMagnet',
    description: 'Optin page sub-headline',
    critical: false,
    defaultValue: 'For coaches, consultants, and service businesses'
  },
  '02 Optin Sub-healine Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Optin sub-headline text color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '02 Optin CTA Text': {
    type: 'text',
    section: 'leadMagnet',
    description: 'Optin page CTA button text',
    critical: true,
    defaultValue: 'Download Now'
  },
  '02 Optin CTA Background Colour': {
    type: 'color',
    section: 'media',
    description: 'Optin CTA button background color',
    critical: false,
    defaultValue: '#0891b2'
  },

  // === HEADER (1 value) ===
  '02 Header Background Color': {
    type: 'color',
    section: 'media',
    description: 'Header background color',
    critical: false,
    defaultValue: '#000000'
  },

  // === BOOKING PAGE (4 values) ===
  '02 Booking Pill Text': {
    type: 'text',
    section: 'vsl',
    description: 'Booking page pill/badge text',
    critical: false,
    defaultValue: 'Book Your Free Consultation'
  },
  '02 Booking Pill Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Booking pill text color',
    critical: false,
    defaultValue: '#FFFFFF'
  },
  '02 Booking Pill Background Colour': {
    type: 'color',
    section: 'media',
    description: 'Booking pill background color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '03 Booking Calender Embedded Code': {
    type: 'code',
    section: 'media',
    description: 'Booking calendar embedded iframe code',
    critical: true,
    defaultValue: ''
  },

  // === THANK YOU PAGE (5 values) ===
  '02 Thankyou Page Headline Text': {
    type: 'text',
    section: 'vsl',
    description: 'Thank you page headline',
    critical: true,
    defaultValue: 'Congratulations! You\'re all set.'
  },
  '02 Thankyou Page Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Thank you headline text color',
    critical: false,
    defaultValue: '#0891b2'
  },
  '02 Thankyou Page Sub-Headline Text': {
    type: 'text',
    section: 'vsl',
    description: 'Thank you page sub-headline',
    critical: false,
    defaultValue: 'Watch this important video to prepare for your call'
  },
  '02 Thankyou Page Sub-Headline Text Colour': {
    type: 'color',
    section: 'media',
    description: 'Thank you sub-headline text color',
    critical: false,
    defaultValue: '#000000'
  },
  '02 Thankyou Page Video': {
    type: 'video',
    section: 'media',
    description: 'Thank you page video URL',
    critical: false,
    defaultValue: ''
  },

  // === EMAIL SEQUENCES (32 values) ===

  // Optin Email Sequence (15 emails x 2 = 30 values)
  'Optin_Email_Subject 1': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 1 subject',
    critical: false,
    defaultValue: 'Welcome! Here\'s your free training'
  },
  'Optin_Email_Body 1': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 1 body',
    critical: false,
    defaultValue: 'Thanks for signing up! Here\'s what you need to know...'
  },
  'Optin_Email_Subject 2': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 2 subject',
    critical: false,
    defaultValue: 'Day 2: Your next step'
  },
  'Optin_Email_Body 2': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 2 body',
    critical: false,
    defaultValue: 'Let\'s dive deeper into...'
  },
  'Optin_Email_Subject 3': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 3 subject',
    critical: false,
    defaultValue: 'Day 3: The secret to success'
  },
  'Optin_Email_Body 3': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 3 body',
    critical: false,
    defaultValue: 'Here\'s what most people miss...'
  },
  'Optin_Email_Subject 4': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 4 subject',
    critical: false,
    defaultValue: 'Day 4: Common mistakes to avoid'
  },
  'Optin_Email_Body 4': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 4 body',
    critical: false,
    defaultValue: 'Don\'t make these mistakes...'
  },
  'Optin_Email_Subject 5': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 5 subject',
    critical: false,
    defaultValue: 'Day 5: Real results from real people'
  },
  'Optin_Email_Body 5': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 5 body',
    critical: false,
    defaultValue: 'Check out these success stories...'
  },
  'Optin_Email_Subject 6': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 6 subject',
    critical: false,
    defaultValue: 'Day 6: The complete roadmap'
  },
  'Optin_Email_Body 6': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 6 body',
    critical: false,
    defaultValue: 'Here\'s your step-by-step plan...'
  },
  'Optin_Email_Subject 7': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 7 subject',
    critical: false,
    defaultValue: 'Day 7: Time to take action'
  },
  'Optin_Email_Body 7': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 7 body',
    critical: false,
    defaultValue: 'Ready to get started?...'
  },
  'Optin_Email_Subject 8': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 8 subject',
    critical: false,
    defaultValue: 'Day 8: Advanced strategies'
  },
  'Optin_Email_Body 8': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 8 body',
    critical: false,
    defaultValue: 'Let me share some advanced tactics...'
  },
  'Optin_Email_Subject 9': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 9 subject',
    critical: false,
    defaultValue: 'Day 9: Overcoming obstacles'
  },
  'Optin_Email_Body 9': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 9 body',
    critical: false,
    defaultValue: 'Here\'s how to overcome common challenges...'
  },
  'Optin_Email_Subject 10': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 10 subject',
    critical: false,
    defaultValue: 'Day 10: Your personalized next step'
  },
  'Optin_Email_Body 10': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 10 body',
    critical: false,
    defaultValue: 'Based on your progress...'
  },
  'Optin_Email_Subject 11': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 11 subject',
    critical: false,
    defaultValue: 'Day 11: Behind the scenes'
  },
  'Optin_Email_Body 11': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 11 body',
    critical: false,
    defaultValue: 'Let me show you how this really works...'
  },
  'Optin_Email_Subject 12': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 12 subject',
    critical: false,
    defaultValue: 'Day 12: Exclusive opportunity'
  },
  'Optin_Email_Body 12': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 12 body',
    critical: false,
    defaultValue: 'I have something special for you...'
  },
  'Optin_Email_Subject 13': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 13 subject',
    critical: false,
    defaultValue: 'Day 13: Quick wins'
  },
  'Optin_Email_Body 13': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 13 body',
    critical: false,
    defaultValue: 'Here are some quick results you can achieve...'
  },
  'Optin_Email_Subject 14': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 14 subject',
    critical: false,
    defaultValue: 'Day 14: The final piece'
  },
  'Optin_Email_Body 14': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 14 body',
    critical: false,
    defaultValue: 'Here\'s what you\'re missing...'
  },
  'Optin_Email_Subject 15': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 15 subject',
    critical: false,
    defaultValue: 'Day 15: Special invitation'
  },
  'Optin_Email_Body 15': {
    type: 'text',
    section: 'emails',
    description: 'Optin email sequence - Email 15 body',
    critical: false,
    defaultValue: 'You\'re invited to...'
  },

  // Free Gift Email (1 email x 2 = 2 values)
  'Free_Gift_Email Subject': {
    type: 'text',
    section: 'emails',
    description: 'Free gift email subject line',
    critical: false,
    defaultValue: 'Here\'s your free gift!'
  },
  'Free_Gift_Email Body': {
    type: 'text',
    section: 'emails',
    description: 'Free gift email body content',
    critical: false,
    defaultValue: 'Thank you! Here\'s your free gift as promised...'
  },
};

// === HELPER EXPORTS ===

/**
 * Extract all custom value keys
 */
export const ALL_CUSTOM_VALUE_KEYS = Object.keys(NEW_GHL_SCHEMA);

/**
 * Critical values that must be filled before deployment
 */
export const CRITICAL_CUSTOM_VALUES = Object.entries(NEW_GHL_SCHEMA)
  .filter(([key, config]) => config.critical)
  .map(([key]) => key);

/**
 * Group values by section for organized processing
 */
export const VALUES_BY_SECTION = Object.entries(NEW_GHL_SCHEMA).reduce((acc, [key, config]) => {
  if (!acc[config.section]) acc[config.section] = [];
  acc[config.section].push(key);
  return acc;
}, {});

/**
 * Group values by type for inference engine
 */
export const VALUES_BY_TYPE = Object.entries(NEW_GHL_SCHEMA).reduce((acc, [key, config]) => {
  if (!acc[config.type]) acc[config.type] = [];
  acc[config.type].push(key);
  return acc;
}, {});

/**
 * Validate that critical values are present and not empty
 * @param {object} customValues - Generated custom values object
 * @returns {array} - Array of missing critical value keys
 */
export function validateCriticalValues(customValues) {
  const missing = [];
  for (const key of CRITICAL_CUSTOM_VALUES) {
    if (!customValues[key] || customValues[key] === '') {
      missing.push(key);
    }
  }
  return missing;
}

/**
 * Get default value for a custom value key
 * @param {string} key - Custom value key
 * @returns {string} - Default value or empty string
 */
export function getDefaultValue(key) {
  return NEW_GHL_SCHEMA[key]?.defaultValue || '';
}

/**
 * Get metadata for a custom value key
 * @param {string} key - Custom value key
 * @returns {object} - Metadata object or null
 */
export function getCustomValueMetadata(key) {
  return NEW_GHL_SCHEMA[key] || null;
}

export default NEW_GHL_SCHEMA;
