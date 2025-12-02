export const osPrompts = {
  1: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a world-class marketing strategist and positioning expert.
    Using the following intake data, define an ideal client profile for a high-ticket expert / coach / service provider.
    
    Return ONLY valid JSON in this structure:
    {
      "idealClient": {
        "personaName": "",
        "whoTheyAre": "",
        "demographics": "",
        "psychographics": "",
        "corePains": [
          "",
          "",
          ""
        ],
        "coreDesires": [
          "",
          "",
          ""
        ],
        "category": "",
        "nichePositioning": "",
        "oneSentenceSummary": ""
      }
    }`,
  2: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a direct response messaging expert.
    Using the intake and the approved idealClient section, generate a clear Million-Dollar Message.
    
    Return ONLY JSON:
    {
      "message": {
        "oneLiner": "",
        "tagline": "",
        "coreMessage": "",
        "contentPillars": [
          "",
          "",
          "",
          ""
        ]
      }
    }`,
  3: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are an expert storytelling copywriter for stages, sales videos and social media.
    Create a Signature Story in 3 versions.
    
    Return ONLY JSON:
    {
      "signatureStory": {
        "fullOriginStory": "",
        "socialMediaVersion": "",
        "stageVersion": ""
      }
    }`,
  4: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a high-ticket offer architect.
    Design a scalable high-ticket offer based on the inputs.
    
    Return ONLY JSON:
    {
      "offer": {
        "offerName": "",
        "oneSentencePromise": "",
        "programOutline": [
          { "moduleTitle": "", "description": "" }
        ],
        "deliverables": [
          ""
        ],
        "pricing": {
          "fullPay": "",
          "splitPayOptions": []
        },
        "scalableStructure": "",
        "bonuses": [
          { "title": "", "description": "", "value": "" }
        ],
        "riskReversal": ""
      }
    }`,
  5: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a sales script expert for high-ticket offers.
    Create a setter script, closer script and objection handling.
    
    Return ONLY JSON:
    {
      "salesScripts": {
        "setterScript": "",
        "closerScript": "",
        "objectionHandling": [
          { "objection": "", "response": "" }
        ]
      }
    }`,
  6: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a lead magnet strategist.
    Design 4 lead magnet assets.
    
    Return JSON:
    {
      "leadMagnet": {
        "checklist": {
          "title": "",
          "bullets": []
        },
        "pdfGuide": {
          "title": "",
          "outline": []
        },
        "freeGuide": {
          "title": "",
          "bigPromise": "",
          "sections": []
        },
        "trainingOutline": {
          "title": "",
          "talkTrack": []
        }
      }
    }`,
  7: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a VSL copywriter.
    Create a Book-a-Call VSL script following: Hook → Story → Problem → Solution → Offer → Proof → CTA.
    
    Return JSON:
    {
      "vsl": {
        "hook": "",
        "bigPromise": "",
        "story": "",
        "problem": "",
        "solution": "",
        "offer": "",
        "proof": "",
        "cta": "",
        "fullScript": ""
      }
    }`,
  8: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are an email copy strategist.
    Create a 15-day nurture + conversion sequence.
    
    Return JSON:
    {
      "emails": [
        {
          "day": 1,
          "subject": "",
          "body": "",
          "cta": ""
        }
      ]
    }`,
  9: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a paid ads strategist.
    Create hooks, angles, headlines and creative concepts.
    
    Return JSON:
    {
      "ads": {
        "hooks": [],
        "angles": [],
        "headlines": [],
        "imageConcepts": []
      }
    }`,
  10: (data) => `
    Role: expert in that content type
    Input: ${JSON.stringify(data)}
    
    You are a funnel copywriter.
    Create full funnel copy.
    
    Return JSON:
    {
      "funnelCopy": {
        "optInPage": {
          "headline": "",
          "subheadline": "",
          "bullets": [],
          "cta": "",
          "shortFormCopy": ""
        },
        "vslPage": {
          "headline": "",
          "subheadline": "",
          "videoIntroCopy": "",
          "cta": ""
        },
        "bookingPage": {
          "headline": "",
          "subheadline": "",
          "whyBookSection": "",
          "cta": ""
        },
        "thankYouPage": {
          "headline": "",
          "subheadline": "",
          "nextSteps": "",
          "upsellPrompt": ""
        }
      }
    }`
};
