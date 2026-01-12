/**
 * Direct Company Info Mapper
 * Maps company information from intake form to GHL custom values without AI
 * Handles company name, address, support email, telephone, footer text
 */

/**
 * Maps company info from intake form to GHL custom values
 * @param {object} intakeFormContent - The intake_form section from vault content
 * @returns {object} - Key-value pairs for GHL company info custom values
 */
export function mapCompanyInfoToGHLValues(intakeFormContent) {
    const result = {};

    console.log('[CompanyInfoMapper] Starting company info mapping...');
    console.log('[CompanyInfoMapper] Available intake form fields:', Object.keys(intakeFormContent || {}));

    // If no intake form content provided, return empty
    if (!intakeFormContent || typeof intakeFormContent !== 'object') {
        console.log('[CompanyInfoMapper] No intake form content provided');
        return result;
    }

    // Company Name (appears in footer across all pages)
    const companyName = intakeFormContent.company_name ||
                       intakeFormContent.companyName ||
                       intakeFormContent.businessName ||
                       intakeFormContent.business_name ||
                       '';

    if (companyName) {
        result['company_name'] = companyName;
        result['02_footer_company_name'] = companyName; // Also used in funnel pages
        console.log('[CompanyInfoMapper] ✓ Company name:', companyName);
    }

    // Company Address
    const companyAddress = intakeFormContent.company_address ||
                          intakeFormContent.companyAddress ||
                          intakeFormContent.address ||
                          intakeFormContent.businessAddress ||
                          '';

    if (companyAddress) {
        result['company_address'] = companyAddress;
        console.log('[CompanyInfoMapper] ✓ Company address:', companyAddress);
    }

    // Company Support Email
    const supportEmail = intakeFormContent.company_support_email ||
                        intakeFormContent.supportEmail ||
                        intakeFormContent.support_email ||
                        intakeFormContent.companyEmail ||
                        intakeFormContent.email ||
                        '';

    if (supportEmail) {
        result['company_support_email'] = supportEmail;
        console.log('[CompanyInfoMapper] ✓ Support email:', supportEmail);
    }

    // Company Telephone
    const telephone = intakeFormContent.company_telephone ||
                     intakeFormContent.companyPhone ||
                     intakeFormContent.phone ||
                     intakeFormContent.telephone ||
                     intakeFormContent.businessPhone ||
                     '';

    if (telephone) {
        result['company_telephone'] = telephone;
        console.log('[CompanyInfoMapper] ✓ Company telephone:', telephone);
    }

    // Footer Text (optional - may be in separate field)
    const footerText = intakeFormContent.footer_text ||
                      intakeFormContent.footerText ||
                      '';

    if (footerText) {
        result['footer_text'] = footerText;
        console.log('[CompanyInfoMapper] ✓ Footer text:', footerText.substring(0, 50) + '...');
    }

    const mappedCount = Object.keys(result).length;
    console.log(`[CompanyInfoMapper] Complete: ${mappedCount} company info values mapped`);

    return result;
}

/**
 * Validates company info content
 * @param {object} intakeFormContent - The intake_form section from vault content
 * @returns {object} - Validation result with warnings
 */
export function validateCompanyInfo(intakeFormContent) {
    const warnings = [];
    const stats = {
        hasCompanyName: false,
        hasAddress: false,
        hasEmail: false,
        hasPhone: false
    };

    if (!intakeFormContent || typeof intakeFormContent !== 'object') {
        warnings.push({ issue: 'No intake form content provided' });
        return { stats, warnings };
    }

    // Check for essential company info
    stats.hasCompanyName = !!(
        intakeFormContent.company_name ||
        intakeFormContent.companyName ||
        intakeFormContent.businessName ||
        intakeFormContent.business_name
    );

    stats.hasAddress = !!(
        intakeFormContent.company_address ||
        intakeFormContent.companyAddress ||
        intakeFormContent.address ||
        intakeFormContent.businessAddress
    );

    stats.hasEmail = !!(
        intakeFormContent.company_support_email ||
        intakeFormContent.supportEmail ||
        intakeFormContent.support_email ||
        intakeFormContent.companyEmail ||
        intakeFormContent.email
    );

    stats.hasPhone = !!(
        intakeFormContent.company_telephone ||
        intakeFormContent.companyPhone ||
        intakeFormContent.phone ||
        intakeFormContent.telephone ||
        intakeFormContent.businessPhone
    );

    // Generate warnings for missing critical info
    if (!stats.hasCompanyName) {
        warnings.push({ issue: 'Missing company name' });
    }

    if (!stats.hasEmail) {
        warnings.push({ issue: 'Missing support email' });
    }

    return { stats, warnings };
}

export default {
    mapCompanyInfoToGHLValues,
    validateCompanyInfo
};
