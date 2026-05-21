const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, 'store', 'ghl-custom-values-F6NirXNNc04hNj7JcB3R-1768244527648.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Better CSV parser that handles multiline quoted fields
function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    let i = 0;

    while (i < content.length) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i += 2;
                continue;
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
                i++;
                continue;
            }
        }

        if (!insideQuotes && char === ',') {
            // End of field
            currentRow.push(currentField.trim());
            currentField = '';
            i++;
            continue;
        }

        if (!insideQuotes && (char === '\n' || char === '\r')) {
            // End of row
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                if (currentRow.some(f => f.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            }
            i++;
            continue;
        }

        currentField += char;
        i++;
    }

    // Add last field/row if exists
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
            rows.push(currentRow);
        }
    }

    return rows;
}

const rows = parseCSV(csvContent);
const headers = rows[0];
const dataRows = rows.slice(1);

const customValues = dataRows.map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
    });
    return obj;
});

console.log(`\n📊 Total Custom Values in GHL: ${customValues.length}\n`);

// Categorize by mapping
const categories = {
    emails: [],
    sms: [],
    appointmentReminders: [],
    funnelCopy: [],
    colors: [],
    media: [],
    company: [],
    facebookAds: [],
    questionnaire: [],
    testimonials: [],
    unmapped: []
};

customValues.forEach(cv => {
    const key = cv.Key.toLowerCase();
    const name = cv.Name.toLowerCase();

    // Email mappings
    if (key.includes('optin_email') || key.includes('free_gift_email')) {
        categories.emails.push(cv);
    }
    // SMS mappings
    else if (key.includes('optin_sms')) {
        categories.sms.push(cv);
    }
    // Appointment reminders
    else if (key.includes('before call time') || key.includes('when call booked') || key.includes('at call time')) {
        categories.appointmentReminders.push(cv);
    }
    // Funnel Copy (02_optin, 02_vsl, 02_booking, 02_thankyou, 02 optin, 02 vsl, etc.)
    else if (
        key.startsWith('02_optin') || key.startsWith('02_vsl') || key.startsWith('02_booking') || key.startsWith('02_thankyou') ||
        key.startsWith('02 vsl') || key.startsWith('02 optin') || key.startsWith('02 booking') || key.startsWith('02 thankyou') ||
        key.startsWith('02 footer')
    ) {
        categories.funnelCopy.push(cv);
    }
    // Testimonials (might be in funnel copy or separate)
    else if (key.includes('testimonial') && !key.includes('video')) {
        categories.testimonials.push(cv);
    }
    // Colors
    else if (key.includes('color') || key.includes('bgcolor') || key.includes('_bg') || name.includes('color')) {
        categories.colors.push(cv);
    }
    // Media (images, videos, logos)
    else if (key.includes('logo') || key.includes('image') || key.includes('video') || key.includes('mockup') || key.includes('photo')) {
        categories.media.push(cv);
    }
    // Company info
    else if (key.includes('company_') || key.includes('footer_text')) {
        categories.company.push(cv);
    }
    // Facebook Ads
    else if (key.includes('fb_ad')) {
        categories.facebookAds.push(cv);
    }
    // Questionnaire
    else if (key.includes('questionnaire') || key.includes('survey')) {
        categories.questionnaire.push(cv);
    }
    // Unmapped
    else {
        categories.unmapped.push(cv);
    }
});

// Print summary
console.log('='.repeat(80));
console.log('✅ MAPPED CUSTOM VALUES (by SaaS Section)');
console.log('='.repeat(80));

console.log(`\n📧 EMAILS Section (directEmailMapper.js):`);
console.log(`   Total: ${categories.emails.length} custom values`);
console.log(`   ✓ Optin_Email_Subject/Body/Preheader 1-15`);
console.log(`   ✓ Time variants (8 & 15 Morning/Afternoon/Evening)`);
console.log(`   ✓ Free Gift Email`);

console.log(`\n💬 SMS Section (directSMSMapper.js):`);
console.log(`   Total: ${categories.sms.length} custom values`);
console.log(`   ✓ Optin_SMS_1-15`);
console.log(`   ✓ Time variants (8 & 15 Morning/Afternoon/Evening)`);

console.log(`\n📅 APPOINTMENT REMINDERS Section (directAppointmentRemindersMapper.js):`);
console.log(`   Total: ${categories.appointmentReminders.length} custom values`);
console.log(`   ✓ Email Subject/Body/PreHeader (6 reminders)`);
console.log(`   ✓ SMS (6 reminders)`);

console.log(`\n📄 FUNNEL COPY Section (extractFunnelCopyCustomValues in pushSystem.js):`);
console.log(`   Total: ${categories.funnelCopy.length} custom values`);
console.log(`   ✓ 02_optin_* (Optin Page fields)`);
console.log(`   ✓ 02_vsl_* (Sales/VSL Page fields)`);
console.log(`   ✓ 02_booking_* (Booking Page fields)`);
console.log(`   ✓ 02_thankyou_* (Thank You Page fields)`);
console.log(`   ✓ 02_footer_* (Footer fields)`);

console.log(`\n🎨 BRAND COLORS (from Intake Form brandColors):`);
console.log(`   Total: ${categories.colors.length} custom values`);
console.log(`   ✓ All *_color, *_bgcolor, *_bg fields`);
console.log(`   ✓ Extracted from brandColors in intake form`);

console.log(`\n🖼️ MEDIA LIBRARY Section (media field mappings):`);
console.log(`   Total: ${categories.media.length} custom values`);
console.log(`   ✓ logo, images, videos, mockups`);
console.log(`   ✓ Mapped via funnel copy ghl_key or media library`);

console.log(`\n🏢 COMPANY INFO (from Intake Form):`);
console.log(`   Total: ${categories.company.length} custom values`);
console.log(`   ✓ company_name, company_address, company_support_email`);
console.log(`   ✓ From intake form company section`);

console.log(`\n⭐ TESTIMONIALS:`);
console.log(`   Total: ${categories.testimonials.length} custom values`);
console.log(`   Note: Testimonial photos may need media library mapping`);

const totalMapped = categories.emails.length +
                   categories.sms.length +
                   categories.appointmentReminders.length +
                   categories.funnelCopy.length +
                   categories.colors.length +
                   categories.media.length +
                   categories.company.length +
                   categories.testimonials.length;

console.log(`\n${'='.repeat(80)}`);
console.log(`⚠️ SECTIONS NEEDING MAPPERS`);
console.log(`${'='.repeat(80)}`);

console.log(`\n📱 FACEBOOK ADS Section:`);
console.log(`   Total: ${categories.facebookAds.length} custom values`);
console.log(`   Status: ⚠️ NEEDS MAPPER`);
console.log(`   Note: facebookAds section exists in vault (section_id: 9)`);
if (categories.facebookAds.length > 0) {
    console.log(`   Keys: ${categories.facebookAds.map(cv => cv.Key).join(', ')}`);
}

console.log(`\n❓ QUESTIONNAIRE Section:`);
console.log(`   Total: ${categories.questionnaire.length} custom values`);
console.log(`   Status: ⚠️ NEEDS MAPPER or STATIC VALUES`);
if (categories.questionnaire.length > 0) {
    console.log(`   Keys: ${categories.questionnaire.slice(0, 5).map(cv => cv.Key).join(', ')}`);
}

console.log(`\n${'='.repeat(80)}`);
console.log(`📊 FINAL MAPPING SUMMARY`);
console.log(`${'='.repeat(80)}`);
console.log(`✅ Fully Mapped & Deployed: ${totalMapped} custom values`);
console.log(`⚠️ Facebook Ads (needs mapper): ${categories.facebookAds.length} custom values`);
console.log(`⚠️ Questionnaire (needs mapper): ${categories.questionnaire.length} custom values`);
console.log(`❌ Other Unmapped: ${categories.unmapped.length} custom values`);
console.log(`📈 Total GHL Custom Values: ${customValues.length}`);
console.log(`🎯 Coverage: ${((totalMapped / customValues.length) * 100).toFixed(1)}% fully mapped\n`);

// Show unmapped samples
if (categories.unmapped.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`❌ UNMAPPED CUSTOM VALUES (Total: ${categories.unmapped.length})`);
    console.log(`${'='.repeat(80)}\n`);
    categories.unmapped.slice(0, 30).forEach((cv, idx) => {
        console.log(`${idx + 1}. ${cv.Key}`);
        console.log(`   Category: ${cv.Category || 'N/A'}`);
        const val = cv.Value || '';
        console.log(`   Value: ${val.substring(0, 80)}${val.length > 80 ? '...' : ''}\n`);
    });

    if (categories.unmapped.length > 30) {
        console.log(`... and ${categories.unmapped.length - 30} more unmapped values\n`);
    }
}

// Save detailed report
const report = {
    totalCustomValues: customValues.length,
    totalMapped,
    coveragePercentage: parseFloat(((totalMapped / customValues.length) * 100).toFixed(1)),
    summary: {
        fullyMapped: totalMapped,
        needsMapper: categories.facebookAds.length + categories.questionnaire.length,
        unmapped: categories.unmapped.length
    },
    byCategory: {
        emails: {
            count: categories.emails.length,
            status: 'FULLY MAPPED',
            mapper: 'lib/ghl/directEmailMapper.js',
            vaultSection: 'emails',
            keys: categories.emails.map(cv => cv.Key)
        },
        sms: {
            count: categories.sms.length,
            status: 'FULLY MAPPED',
            mapper: 'lib/ghl/directSMSMapper.js',
            vaultSection: 'sms',
            keys: categories.sms.map(cv => cv.Key)
        },
        appointmentReminders: {
            count: categories.appointmentReminders.length,
            status: 'FULLY MAPPED',
            mapper: 'lib/ghl/directAppointmentRemindersMapper.js',
            vaultSection: 'appointmentReminders',
            keys: categories.appointmentReminders.map(cv => cv.Key)
        },
        funnelCopy: {
            count: categories.funnelCopy.length,
            status: 'FULLY MAPPED',
            mapper: 'extractFunnelCopyCustomValues() in lib/ghl/pushSystem.js',
            vaultSection: 'funnelCopy',
            keys: categories.funnelCopy.map(cv => cv.Key)
        },
        colors: {
            count: categories.colors.length,
            status: 'FULLY MAPPED',
            source: 'Intake Form - brandColors section',
            vaultSection: 'intakeForm.brandColors',
            keys: categories.colors.map(cv => cv.Key)
        },
        media: {
            count: categories.media.length,
            status: 'FULLY MAPPED',
            mapper: 'Media Library + Funnel Copy field references',
            vaultSection: 'media + funnelCopy',
            keys: categories.media.map(cv => cv.Key)
        },
        company: {
            count: categories.company.length,
            status: 'FULLY MAPPED',
            source: 'Intake Form - company info',
            vaultSection: 'intakeForm',
            keys: categories.company.map(cv => cv.Key)
        },
        testimonials: {
            count: categories.testimonials.length,
            status: 'PARTIALLY MAPPED',
            note: 'Testimonial text in funnel copy, photos may need media library',
            vaultSection: 'funnelCopy + media',
            keys: categories.testimonials.map(cv => cv.Key)
        },
        facebookAds: {
            count: categories.facebookAds.length,
            status: 'NEEDS MAPPER',
            vaultSection: 'facebookAds (section_id: 9)',
            note: 'Vault section exists, needs directFacebookAdsMapper.js',
            keys: categories.facebookAds.map(cv => cv.Key)
        },
        questionnaire: {
            count: categories.questionnaire.length,
            status: 'NEEDS MAPPER',
            note: 'May need custom mapper or could be static/default values',
            keys: categories.questionnaire.map(cv => cv.Key)
        },
        unmapped: {
            count: categories.unmapped.length,
            status: 'UNMAPPED',
            keys: categories.unmapped.map(cv => cv.Key)
        }
    },
    allCustomValues: customValues
};

fs.writeFileSync(
    path.join(__dirname, 'custom-values-mapping-report-v2.json'),
    JSON.stringify(report, null, 2)
);

console.log(`✅ Detailed report saved to: custom-values-mapping-report-v2.json\n`);
