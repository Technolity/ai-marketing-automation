/**
 * GHL Custom Values Schema
 * ALL sources are AI-generated - users only answer 20 intake questions
 * 
 * Source Types:
 * - generated.* = AI generates during content creation
 * - database.* = Stored in Supabase, fetched for push
 * - prompt.* = From specific prompt outputs (VSL, Message, etc.)
 */

export const ghlSchema = {
    // ============================================
    // OPTIN PAGE
    // ============================================
    optin: {
        logo: {
            customValue: "optin_logo_image",
            source: "database.generated_images.logo",
            type: "image",
            generatedBy: "AI generates logo based on industry + brand voice"
        },
        headline: {
            customValue: "optin_headline_text",
            source: "prompt.leadMagnet.titleAndHook.mainTitle",
            type: "text"
        },
        headlineColor: {
            customValue: "optin_headline_text_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        subHeadline: {
            customValue: "optin_sub_headline_text",
            source: "prompt.leadMagnet.titleAndHook.subtitle",
            type: "text"
        },
        subHeadlineColor: {
            customValue: "optin_sub_headline_text_color",
            source: "database.brand_colors.secondary",
            type: "color"
        },
        ctaText: {
            customValue: "optin_cta_text",
            source: "prompt.leadMagnet.landingPageCopy.ctaButtonText",
            type: "text"
        },
        ctaTextColor: {
            customValue: "optin_cta_text_color",
            source: "database.brand_colors.ctaText",
            type: "color"
        },
        ctaBgColor: {
            customValue: "optin_cta_background_color",
            source: "database.brand_colors.ctaBackground",
            type: "color"
        },
        headerBgColor: {
            customValue: "optin_header_bgcolor",
            source: "database.brand_colors.headerBg",
            type: "color"
        },
        mockupImage: {
            customValue: "optin_mockup_image",
            source: "database.generated_images.leadMagnetMockup",
            type: "image",
            generatedBy: "AI generates mockup of lead magnet"
        },
        popupHeadline: {
            customValue: "optin_popup_headline",
            source: "prompt.leadMagnet.audienceConnection.openingStatement",
            type: "text"
        },
        popupHeadlineColor: {
            customValue: "optin_popup_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        }
    },

    // ============================================
    // QUESTIONNAIRE PAGE
    // ============================================
    questionnaire: {
        heroHeadline: {
            customValue: "questionnaire_hero_headline",
            source: "prompt.millionDollarMessage.oneLineMessage",
            type: "text"
        },
        heroHeadlineColor: {
            customValue: "questionnaire_hero_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        heroHeadlinePillBgColor: {
            customValue: "questionnaire_hero_headline_pill_bgcolor",
            source: "database.brand_colors.accent",
            type: "color"
        },
        formHeadline: {
            customValue: "questionnaire_form_headline",
            source: "prompt.generated.questionnaireFormHeadline",
            type: "text"
        },
        formHeadlineColor: {
            customValue: "questionnaire_form_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        formBgColor: {
            customValue: "questionnaire_form_bgcolor",
            source: "database.brand_colors.formBg",
            type: "color"
        }
    },

    // ============================================
    // THANK YOU PAGE
    // ============================================
    thankYou: {
        headline: {
            customValue: "thankyou_page_headline",
            source: "prompt.generated.thankYouHeadline",
            type: "text"
        },
        headlineColor: {
            customValue: "thankyou_page_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        subHeadline: {
            customValue: "thankyou_page_sub_headline",
            source: "prompt.generated.thankYouSubHeadline",
            type: "text"
        },
        subHeadlineColor: {
            customValue: "thankyou_page_sub_headline_color",
            source: "database.brand_colors.secondary",
            type: "color"
        },
        testimonialHeadline: {
            customValue: "thankyou_page_testimonial_headline",
            source: "prompt.generated.testimonialSectionHeadline",
            type: "text"
        },
        testimonialHeadlineColor: {
            customValue: "thankyou_page_testimonial_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        testimonialBgColor: {
            customValue: "thankyou_testimonial_bgcolor",
            source: "database.brand_colors.testimonialBg",
            type: "color"
        }
    },

    // ============================================
    // VSL PAGE - HERO SECTION
    // ============================================
    vslHero: {
        headline: {
            customValue: "vsl_hero_headline",
            source: "prompt.vslScript.keyHooks[0]",
            type: "text"
        },
        headlineColor: {
            customValue: "vsl_hero_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        subHeadline: {
            customValue: "vsl_hero_sub_headline",
            source: "prompt.millionDollarMessage.outcomePromise.realisticExpectation",
            type: "text"
        },
        subHeadlineColor: {
            customValue: "vsl_hero_sub_headline_color",
            source: "database.brand_colors.secondary",
            type: "color"
        },
        acknowledgementPill: {
            customValue: "vsl_hero_acknowledgement_pill",
            source: "prompt.generated.acknowledgementPill",
            type: "text"
        },
        acknowledgementPillBgColor: {
            customValue: "vsl_hero_acknowledgement_pill_bgcolor",
            source: "database.brand_colors.accent",
            type: "color"
        },
        acknowledgementPillColor: {
            customValue: "vsl_hero_acknowledgement_pill_color",
            source: "database.brand_colors.pillText",
            type: "color"
        },
        timerHeadline: {
            customValue: "vsl_hero_timer_headline",
            source: "prompt.vslScript.urgencyElements[0]",
            type: "text"
        },
        timerHeadlineColor: {
            customValue: "vsl_hero_timer_headline_color",
            source: "database.brand_colors.urgency",
            type: "color"
        },
        ctaQuestionHeadline: {
            customValue: "vsl_hero_cta_question_headline",
            source: "prompt.millionDollarMessage.ctaFraming.positioning",
            type: "text"
        },
        ctaQuestionHeadlineColor: {
            customValue: "vsl_hero_cta_question_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        }
    },

    // ============================================
    // VSL PAGE - PROCESS/STEPS SECTION
    // ============================================
    vslProcess: {
        headline: {
            customValue: "vsl_process_headline",
            source: "prompt.generated.processHeadline",
            type: "text"
        },
        headlineColor: {
            customValue: "vsl_process_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        subHeadline: {
            customValue: "vsl_process_sub_headline",
            source: "prompt.programBlueprint.overview.uniqueFramework",
            type: "text"
        },
        subHeadlineColor: {
            customValue: "vsl_process_sub_headline_color",
            source: "database.brand_colors.secondary",
            type: "color"
        },
        descriptionColor: {
            customValue: "vsl_process_description",
            source: "database.brand_colors.bodyText",
            type: "color"
        },
        step1: {
            customValue: "vsl_process_description_pt_1",
            source: "prompt.vslScript.stepsToSuccess[0].description",
            type: "text"
        },
        step2: {
            customValue: "vsl_process_description_pt_2",
            source: "prompt.vslScript.stepsToSuccess[1].description",
            type: "text"
        },
        step3: {
            customValue: "vsl_process_description_pt_3",
            source: "prompt.vslScript.stepsToSuccess[2].description",
            type: "text"
        },
        step4: {
            customValue: "vsl_process_description_pt_4",
            source: "prompt.vslScript.stepsToSuccess[3].description",
            type: "text"
        },
        step5: {
            customValue: "vsl_process_description_pt_5",
            source: "prompt.vslScript.threeTips[0].actionStep",
            type: "text"
        }
    },

    // ============================================
    // VSL PAGE - TESTIMONIAL SECTION
    // ============================================
    vslTestimonial: {
        headline: {
            customValue: "vsl_testimonial_headline",
            source: "prompt.generated.testimonialHeadline",
            type: "text"
        },
        headlineColor: {
            customValue: "vsl_testimonial_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        subHeadline: {
            customValue: "vsl_testimonial_sub_headline",
            source: "prompt.vslScript.socialProofMentions[0]",
            type: "text"
        },
        subHeadlineColor: {
            customValue: "vsl_testimonial_sub_headline_color",
            source: "database.brand_colors.secondary",
            type: "color"
        }
    },

    // ============================================
    // VSL PAGE - BIO SECTION
    // ============================================
    vslBio: {
        image: {
            customValue: "vsl_bio_image",
            source: "database.generated_images.founderAvatar",
            type: "image",
            generatedBy: "AI generates professional avatar based on story/brand"
        },
        headline: {
            customValue: "vsl_bio_headline",
            source: "prompt.generated.bioHeadline",
            type: "text"
        },
        headlineColor: {
            customValue: "vsl_bio_headline_colour",
            source: "database.brand_colors.primary",
            type: "color"
        },
        founderName: {
            customValue: "vsl_bio_founder_name",
            source: "prompt.signatureStory.missionAndWhy.whyTheyHelp",
            type: "text",
            note: "Extracted from story or generated as 'Your Guide'"
        },
        founderNameColor: {
            customValue: "vsl_bio_founder_name_colour",
            source: "database.brand_colors.primary",
            type: "color"
        },
        description: {
            customValue: "vsl_bio_description",
            source: "prompt.signatureStory.shortVersion",
            type: "text"
        },
        descriptionColor: {
            customValue: "vsl_bio_description_colour",
            source: "database.brand_colors.bodyText",
            type: "color"
        }
    },

    // ============================================
    // VSL PAGE - CTA SECTION
    // ============================================
    vslCta: {
        headline: {
            customValue: "vsl_cta_headline",
            source: "prompt.vslScript.callToActionName",
            type: "text"
        },
        headlineColor: {
            customValue: "vsl_cta_headline_color",
            source: "database.brand_colors.ctaText",
            type: "color"
        },
        subHeadline: {
            customValue: "vsl_cta_sub_headline",
            source: "prompt.millionDollarMessage.ctaFraming.emotionalState",
            type: "text"
        },
        subHeadlineColor: {
            customValue: "vsl_cta_sub_headline_text_color",
            source: "database.brand_colors.ctaText",
            type: "color"
        },
        bgColor: {
            customValue: "vsl_cta_bgcolor",
            source: "database.brand_colors.ctaBackground",
            type: "color"
        }
    },

    // ============================================
    // VSL PAGE - FAQ SECTION
    // ============================================
    vslFaq: {
        headline: {
            customValue: "vsl_faq_headline",
            source: "prompt.generated.faqHeadline",
            type: "text"
        },
        headlineColor: {
            customValue: "vsl_faq_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        questionColor: {
            customValue: "vsl_faq_ques_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        answerColor: {
            customValue: "vsl_faq_answer_color",
            source: "database.brand_colors.bodyText",
            type: "color"
        },
        question1: {
            customValue: "vsl_faq_ques_1",
            source: "prompt.emailSequence.faqs[0].question",
            type: "text"
        },
        answer1: {
            customValue: "vsl_faq_answer_1",
            source: "prompt.emailSequence.faqs[0].answer",
            type: "text"
        },
        question2: {
            customValue: "vsl_faq_ques_2",
            source: "prompt.emailSequence.faqs[1].question",
            type: "text"
        },
        answer2: {
            customValue: "vsl_faq_answer_2",
            source: "prompt.emailSequence.faqs[1].answer",
            type: "text"
        },
        question3: {
            customValue: "vsl_faq_ques_3",
            source: "prompt.emailSequence.faqs[2].question",
            type: "text"
        },
        answer3: {
            customValue: "vsl_faq_answer_3",
            source: "prompt.emailSequence.faqs[2].answer",
            type: "text"
        },
        question4: {
            customValue: "vsl_faq_ques_4",
            source: "prompt.emailSequence.faqs[3].question",
            type: "text"
        },
        answer4: {
            customValue: "vsl_faq_answer_4",
            source: "prompt.emailSequence.faqs[3].answer",
            type: "text"
        },
        question5: {
            customValue: "vsl_faq_ques_5",
            source: "prompt.emailSequence.faqs[4].question",
            type: "text"
        },
        answer5: {
            customValue: "vsl_faq_answer_5",
            source: "prompt.emailSequence.faqs[4].answer",
            type: "text"
        },
        question6: {
            customValue: "vsl_faq_ques_6",
            source: "prompt.vslScript.objectionHandlers[0].objection",
            type: "text"
        },
        answer6: {
            customValue: "vsl_faq_answer_6",
            source: "prompt.vslScript.objectionHandlers[0].response",
            type: "text"
        },
        question7: {
            customValue: "vsl_faq_ques_7",
            source: "prompt.vslScript.objectionHandlers[1].objection",
            type: "text"
        },
        answer7: {
            customValue: "vsl_faq_answer_7",
            source: "prompt.vslScript.objectionHandlers[1].response",
            type: "text"
        }
    },

    // ============================================
    // BOOKING CALENDAR PAGE
    // ============================================
    bookingCalendar: {
        headline: {
            customValue: "booking_calender_headline",
            source: "prompt.vslScript.callToActionName",
            type: "text"
        },
        headlineColor: {
            customValue: "booking_calender_headline_color",
            source: "database.brand_colors.primary",
            type: "color"
        },
        headlinePillColor: {
            customValue: "booking_calender_headline_pill_color",
            source: "database.brand_colors.accent",
            type: "color"
        }
    },

    // ============================================
    // FOOTER / COMPANY INFO (AI Generated)
    // ============================================
    footer: {
        companyName: {
            customValue: "company_name",
            source: "prompt.generated.companyName",
            type: "text",
            note: "Derived from industry + brand voice"
        },
        companyAddress: {
            customValue: "company_address",
            source: "prompt.generated.companyAddress",
            type: "text",
            note: "Generic placeholder or derived from context"
        },
        supportEmail: {
            customValue: "company_support_email",
            source: "prompt.generated.supportEmail",
            type: "text",
            note: "Generated based on company name"
        },
        telephone: {
            customValue: "company_telephone",
            source: "prompt.generated.telephone",
            type: "text",
            note: "Placeholder or omitted"
        },
        bgColor: {
            customValue: "footer_bgcolor",
            source: "database.brand_colors.footerBg",
            type: "color"
        },
        textColor: {
            customValue: "footer_text_color",
            source: "database.brand_colors.footerText",
            type: "color"
        }
    }
};

// Brand colors that AI will generate based on industry + brand voice
export const brandColorKeys = [
    'primary',           // Main brand color
    'secondary',         // Supporting color
    'accent',            // Highlight/pill backgrounds
    'ctaBackground',     // Button backgrounds
    'ctaText',           // Button text
    'headerBg',          // Header backgrounds
    'formBg',            // Form backgrounds
    'testimonialBg',     // Testimonial section bg
    'bodyText',          // Body text color
    'pillText',          // Text on pills/badges
    'urgency',           // Urgency/timer text
    'footerBg',          // Footer background
    'footerText'         // Footer text
];

// Images that AI will generate
export const generatedImageKeys = [
    'logo',              // Business logo
    'leadMagnetMockup',  // Lead magnet cover/mockup
    'founderAvatar'      // Professional avatar for bio
];

export default ghlSchema;
