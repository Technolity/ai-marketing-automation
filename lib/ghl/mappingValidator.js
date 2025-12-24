/**
 * GHL Custom Value Mapping Validator
 * Ensures correct content mapping between TedOS and GHL
 * Prevents jumbled/mismatched content in funnels
 */

import { mapSessionToCustomValues } from './customValueMapper_FULL';

/**
 * Expected schema for each content type (from prompts)
 */
export const CONTENT_SCHEMAS = {
  idealClient: {
    requiredFields: ['demographics', 'psychographics', 'painPoints', 'desiredOutcomes'],
    description: 'Ideal Client Profile (Prompt 1)'
  },
  message: {
    requiredFields: ['oneLineMessage', 'coreProblemReframe', 'uniqueMechanism', 'outcomePromise'],
    description: 'Million-Dollar Message (Prompt 2)'
  },
  story: {
    requiredFields: ['fullStoryScript', 'shortVersion', 'oneLiner'],
    description: 'Personal Story (Prompt 3)'
  },
  program: {
    requiredFields: ['programName', 'overview', 'deliverables', 'guarantee'],
    description: 'Offer & Program (Prompt 4)'
  },
  leadMagnet: {
    requiredFields: ['titleAndHook', 'mainContent', 'deliverables', 'landingPageCopy'],
    description: 'Lead Magnet (Prompt 6)'
  },
  vsl: {
    requiredFields: ['keyHooks', 'stepsToSuccess', 'threeTips', 'objectionHandlers'],
    description: 'VSL Script (Prompt 7)'
  },
  emails: {
    requiredFields: ['emailList', 'faqs'],
    description: 'Email Sequence (Prompt 8)'
  }
};

/**
 * Mapping rules: which content goes to which GHL field
 */
export const MAPPING_RULES = {
  // Optin Page
  'headline_main': {
    source: 'leadMagnet.titleAndHook.mainTitle',
    fallback: 'message.oneLineMessage',
    type: 'string',
    maxLength: 100,
    required: true
  },
  'subheadline': {
    source: 'leadMagnet.titleAndHook.subtitle',
    fallback: 'message.outcomePromise.realisticExpectation',
    type: 'string',
    maxLength: 200,
    required: true
  },
  'lead_magnet_title': {
    source: 'leadMagnet.titleAndHook.mainTitle',
    type: 'string',
    maxLength: 100,
    required: true
  },
  'cta_button_text': {
    source: 'leadMagnet.landingPageCopy.ctaButtonText',
    fallback: 'Get Instant Access',
    type: 'string',
    maxLength: 50,
    required: true
  },

  // Thank You Page
  'thank_you_headline': {
    source: 'static',
    value: "You're In! Check Your Email",
    type: 'string',
    required: true
  },
  'video_headline': {
    source: 'vsl.keyHooks[0]',
    type: 'string',
    maxLength: 150,
    required: false
  },

  // Sales Page - Hero
  'sales_headline': {
    source: 'vsl.keyHooks[0]',
    fallback: 'message.oneLineMessage',
    type: 'string',
    maxLength: 100,
    required: true
  },
  'sales_subheadline': {
    source: 'message.outcomePromise.realisticExpectation',
    type: 'string',
    maxLength: 200,
    required: true
  },

  // Sales Page - Problem
  'problem_headline': {
    source: 'static',
    value: 'Are You Struggling With This?',
    type: 'string',
    required: true
  },
  'pain_point_1': {
    source: 'idealClient.painPoints[0].pain',
    type: 'string',
    maxLength: 150,
    required: true
  },
  'pain_point_2': {
    source: 'idealClient.painPoints[1].pain',
    type: 'string',
    maxLength: 150,
    required: true
  },
  'pain_point_3': {
    source: 'idealClient.painPoints[2].pain',
    type: 'string',
    maxLength: 150,
    required: true
  },

  // Sales Page - Solution
  'mechanism_name': {
    source: 'message.uniqueMechanism.mechanismName',
    fallback: 'program.programName',
    type: 'string',
    maxLength: 100,
    required: true
  },
  'mechanism_description': {
    source: 'message.uniqueMechanism.howItsDifferent',
    type: 'string',
    maxLength: 300,
    required: true
  },

  // Offer
  'offer_name': {
    source: 'program.programName',
    type: 'string',
    maxLength: 100,
    required: true
  },
  'offer_description': {
    source: 'program.overview.whatItIs',
    type: 'string',
    maxLength: 500,
    required: true
  },

  // Brand
  'brand_name': {
    source: 'answers.businessName',
    fallback: 'answers.industry',
    type: 'string',
    maxLength: 100,
    required: true
  },
  'brand_tagline': {
    source: 'message.oneLineMessage',
    type: 'string',
    maxLength: 150,
    required: true
  },

  // Colors
  'primary_color': {
    source: 'extracted_colors.primary',
    type: 'color',
    required: true
  },
  'secondary_color': {
    source: 'extracted_colors.secondary',
    type: 'color',
    required: true
  },

  // Images
  'lead_magnet_image_url': {
    source: 'images.lead_magnet_image_url',
    type: 'url',
    required: false
  },
  'author_image_url': {
    source: 'images.author_image_url',
    type: 'url',
    required: false
  },
  'logo_url': {
    source: 'images.logo_url',
    type: 'url',
    required: false
  }
};

/**
 * Validate a single field mapping
 */
function validateField(fieldName, value, rule) {
  const errors = [];
  const warnings = [];

  // Check if required field is missing
  if (rule.required && (!value || value === '')) {
    errors.push(`Required field "${fieldName}" is missing or empty`);
    return { valid: false, errors, warnings };
  }

  // Skip validation if optional and empty
  if (!value || value === '') {
    return { valid: true, errors, warnings };
  }

  // Type validation
  if (rule.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`Field "${fieldName}" should be a string, got ${typeof value}`);
    }

    // Length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      warnings.push(`Field "${fieldName}" exceeds max length (${value.length}/${rule.maxLength})`);
    }
  }

  if (rule.type === 'color') {
    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      errors.push(`Field "${fieldName}" is not a valid hex color: ${value}`);
    }
  }

  if (rule.type === 'url') {
    // Basic URL validation
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      warnings.push(`Field "${fieldName}" may not be a valid URL: ${value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate all custom value mappings
 */
export function validateAllMappings(customValues) {
  const report = {
    totalFields: Object.keys(customValues).length,
    validFields: 0,
    invalidFields: 0,
    missingRequired: [],
    errors: [],
    warnings: [],
    fieldDetails: {}
  };

  // Validate each field that has a rule
  Object.entries(MAPPING_RULES).forEach(([fieldName, rule]) => {
    const value = customValues[fieldName];
    const validation = validateField(fieldName, value, rule);

    report.fieldDetails[fieldName] = {
      value,
      rule,
      ...validation
    };

    if (validation.valid) {
      report.validFields++;
    } else {
      report.invalidFields++;
      if (rule.required && (!value || value === '')) {
        report.missingRequired.push(fieldName);
      }
    }

    report.errors.push(...validation.errors);
    report.warnings.push(...validation.warnings);
  });

  report.status = report.errors.length === 0 ? 'PASS' : 'FAIL';
  report.overallValid = report.errors.length === 0;

  return report;
}

/**
 * Validate content schema (ensure generated content has correct structure)
 */
export function validateContentSchema(contentType, contentData) {
  const schema = CONTENT_SCHEMAS[contentType];
  if (!schema) {
    return {
      valid: false,
      error: `Unknown content type: ${contentType}`
    };
  }

  const missing = [];
  schema.requiredFields.forEach(field => {
    if (!contentData || !contentData[field]) {
      missing.push(field);
    }
  });

  return {
    valid: missing.length === 0,
    contentType,
    description: schema.description,
    requiredFields: schema.requiredFields,
    missingFields: missing,
    status: missing.length === 0 ? 'PASS' : 'INCOMPLETE'
  };
}

/**
 * Comprehensive validation: Schema + Mapping
 */
export function comprehensiveValidation(sessionData, generatedImages = []) {
  const results = sessionData.results_data || sessionData.generated_content || {};

  // 1. Validate content schemas
  const schemaValidation = {};
  Object.keys(CONTENT_SCHEMAS).forEach(contentType => {
    const contentKey = {
      'idealClient': '1',
      'message': '2',
      'story': '3',
      'program': '4',
      'leadMagnet': '6',
      'vsl': '7',
      'emails': '8'
    }[contentType];

    const contentData = results[contentKey]?.data?.[
      contentType === 'idealClient' ? 'idealClientProfile' :
      contentType === 'message' ? 'millionDollarMessage' :
      contentType === 'story' ? 'signatureStory' :
      contentType === 'program' ? 'programBlueprint' :
      contentType === 'leadMagnet' ? 'leadMagnet' :
      contentType === 'vsl' ? 'vslScript' :
      contentType === 'emails' ? 'emailSequence' : null
    ];

    schemaValidation[contentType] = validateContentSchema(contentType, contentData);
  });

  // 2. Generate custom values
  const customValues = mapSessionToCustomValues(sessionData, generatedImages);

  // 3. Validate mappings
  const mappingValidation = validateAllMappings(customValues);

  // 4. Image validation
  const imageValidation = {
    totalImages: generatedImages.length,
    hasLeadMagnetImage: !!customValues.lead_magnet_image_url,
    hasAuthorImage: !!customValues.author_image_url,
    hasLogo: !!customValues.logo_url,
    status: generatedImages.length >= 2 ? 'PASS' : 'INCOMPLETE'
  };

  // Overall status
  const overallValid = 
    mappingValidation.overallValid &&
    Object.values(schemaValidation).every(v => v.valid) &&
    imageValidation.status === 'PASS';

  return {
    overallValid,
    overallStatus: overallValid ? 'PASS' : 'INCOMPLETE',
    schemaValidation,
    mappingValidation,
    imageValidation,
    customValuesGenerated: Object.keys(customValues).length,
    summary: {
      totalContentTypes: Object.keys(schemaValidation).length,
      validContentTypes: Object.values(schemaValidation).filter(v => v.valid).length,
      totalMappings: Object.keys(customValues).length,
      validMappings: mappingValidation.validFields,
      missingRequired: mappingValidation.missingRequired,
      totalErrors: mappingValidation.errors.length,
      totalWarnings: mappingValidation.warnings.length
    }
  };
}

/**
 * Generate validation report (human readable)
 */
export function generateValidationReport(validationResult) {
  const lines = [];
  
  lines.push('='.repeat(60));
  lines.push('GHL CUSTOM VALUE MAPPING VALIDATION REPORT');
  lines.push('='.repeat(60));
  lines.push('');

  // Overall Status
  lines.push(`Overall Status: ${validationResult.overallStatus}`);
  lines.push(`Overall Valid: ${validationResult.overallValid ? 'YES ✓' : 'NO ✗'}`);
  lines.push('');

  // Schema Validation
  lines.push('Content Schema Validation:');
  lines.push('-'.repeat(60));
  Object.entries(validationResult.schemaValidation).forEach(([type, result]) => {
    const status = result.valid ? '✓ PASS' : '✗ INCOMPLETE';
    lines.push(`  ${status} - ${result.description}`);
    if (result.missingFields.length > 0) {
      lines.push(`    Missing: ${result.missingFields.join(', ')}`);
    }
  });
  lines.push('');

  // Mapping Validation
  lines.push('Custom Value Mapping:');
  lines.push('-'.repeat(60));
  lines.push(`  Total Fields Mapped: ${validationResult.customValuesGenerated}`);
  lines.push(`  Valid Mappings: ${validationResult.mappingValidation.validFields}`);
  lines.push(`  Invalid Mappings: ${validationResult.mappingValidation.invalidFields}`);
  lines.push(`  Errors: ${validationResult.mappingValidation.errors.length}`);
  lines.push(`  Warnings: ${validationResult.mappingValidation.warnings.length}`);
  lines.push('');

  if (validationResult.mappingValidation.missingRequired.length > 0) {
    lines.push('Missing Required Fields:');
    validationResult.mappingValidation.missingRequired.forEach(field => {
      lines.push(`  - ${field}`);
    });
    lines.push('');
  }

  if (validationResult.mappingValidation.errors.length > 0) {
    lines.push('Errors:');
    validationResult.mappingValidation.errors.forEach(error => {
      lines.push(`  ! ${error}`);
    });
    lines.push('');
  }

  if (validationResult.mappingValidation.warnings.length > 0) {
    lines.push('Warnings:');
    validationResult.mappingValidation.warnings.forEach(warning => {
      lines.push(`  ⚠ ${warning}`);
    });
    lines.push('');
  }

  // Image Validation
  lines.push('Image Validation:');
  lines.push('-'.repeat(60));
  lines.push(`  Total Images: ${validationResult.imageValidation.totalImages}`);
  lines.push(`  Lead Magnet Image: ${validationResult.imageValidation.hasLeadMagnetImage ? '✓' : '✗'}`);
  lines.push(`  Author Image: ${validationResult.imageValidation.hasAuthorImage ? '✓' : '✗'}`);
  lines.push(`  Logo: ${validationResult.imageValidation.hasLogo ? '✓' : '✗'}`);
  lines.push(`  Status: ${validationResult.imageValidation.status}`);
  lines.push('');

  lines.push('='.repeat(60));

  return lines.join('\n');
}

export default {
  CONTENT_SCHEMAS,
  MAPPING_RULES,
  validateField,
  validateAllMappings,
  validateContentSchema,
  comprehensiveValidation,
  generateValidationReport
};

