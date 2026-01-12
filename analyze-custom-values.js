const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, 'store', 'ghl-custom-values-F6NirXNNc04hNj7JcB3R-1768244527648.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (simple parser for quoted fields)
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

const customValues = [];
for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Parse CSV line respecting quotes
    const matches = lines[i].match(/("(?:[^"]|"")*"|[^,]+)(?:,|$)/g);
    if (!matches) continue;

    const values = matches.map(m => m.replace(/,$/, '').replace(/^"|"$/g, '').trim());

    const row = {};
    headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
    });

    customValues.push(row);
}

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
    // Funnel Copy (02_optin, 02_vsl, 02_booking, 02_thankyou)
    else if (key.startsWith('02_optin') || key.startsWith('02_vsl') || key.startsWith('02_booking') || key.startsWith('02_thankyou') || key.startsWith('02 vsl') || key.startsWith('02 optin') || key.startsWith('02 booking') || key.startsWith('02 thankyou')) {
        categories.funnelCopy.push(cv);
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
    else if (key.includes('company_') || key.includes('footer_')) {
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
console.log(`   Includes: Optin_Email_Subject/Body/Preheader 1-15, time variants, Free Gift Email`);

console.log(`\n💬 SMS Section (directSMSMapper.js):`);
console.log(`   Total: ${categories.sms.length} custom values`);
console.log(`   Includes: Optin_SMS_1-15, time variants`);

console.log(`\n📅 APPOINTMENT REMINDERS Section (directAppointmentRemindersMapper.js):`);
console.log(`   Total: ${categories.appointmentReminders.length} custom values`);
console.log(`   Includes: Email/SMS when booked, 48h/24h/1h/10min before, at call time`);

console.log(`\n📄 FUNNEL COPY Section (extractFunnelCopyCustomValues in pushSystem.js):`);
console.log(`   Total: ${categories.funnelCopy.length} custom values`);
console.log(`   Includes: 02_optin_*, 02_vsl_*, 02_booking_*, 02_thankyou_* fields`);

console.log(`\n🎨 BRAND COLORS (from Intake Form brandColors):`);
console.log(`   Total: ${categories.colors.length} custom values`);
console.log(`   Includes: All *_color, *_bgcolor, *_bg fields`);

console.log(`\n🖼️ MEDIA LIBRARY Section (media field mappings):`);
console.log(`   Total: ${categories.media.length} custom values`);
console.log(`   Includes: logo, images, videos, mockups`);

console.log(`\n🏢 COMPANY INFO (from Intake Form):`);
console.log(`   Total: ${categories.company.length} custom values`);
console.log(`   Includes: company_name, company_address, company_support_email, etc.`);

console.log(`\n📱 FACEBOOK ADS Section:`);
console.log(`   Total: ${categories.facebookAds.length} custom values`);
console.log(`   Includes: fb_ad_headline_*, fb_ad_primary_*, etc.`);
console.log(`   Status: ⚠️ NOT YET MAPPED (facebookAds section exists in vault)`);

console.log(`\n❓ QUESTIONNAIRE Section:`);
console.log(`   Total: ${categories.questionnaire.length} custom values`);
console.log(`   Includes: questionnaire_*, survey_* fields`);
console.log(`   Status: ⚠️ NOT YET MAPPED (may need custom mapper)`);

const totalMapped = categories.emails.length +
                   categories.sms.length +
                   categories.appointmentReminders.length +
                   categories.funnelCopy.length +
                   categories.colors.length +
                   categories.media.length +
                   categories.company.length;

console.log(`\n${'='.repeat(80)}`);
console.log(`📊 MAPPING SUMMARY`);
console.log(`${'='.repeat(80)}`);
console.log(`✅ Fully Mapped & Ready: ${totalMapped} custom values`);
console.log(`⚠️ Facebook Ads (unmapped): ${categories.facebookAds.length} custom values`);
console.log(`⚠️ Questionnaire (unmapped): ${categories.questionnaire.length} custom values`);
console.log(`❌ Other Unmapped: ${categories.unmapped.length} custom values`);
console.log(`📈 Total GHL Custom Values: ${customValues.length}`);
console.log(`🎯 Coverage: ${((totalMapped / customValues.length) * 100).toFixed(1)}% mapped\n`);

// Show unmapped samples
if (categories.unmapped.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('❌ UNMAPPED CUSTOM VALUES (Sample - First 20):');
    console.log(`${'='.repeat(80)}\n`);
    categories.unmapped.slice(0, 20).forEach((cv, idx) => {
        console.log(`${idx + 1}. ${cv.Key}`);
        console.log(`   Category: ${cv.Category}`);
        console.log(`   Value: ${cv.Value.substring(0, 60)}${cv.Value.length > 60 ? '...' : ''}\n`);
    });

    if (categories.unmapped.length > 20) {
        console.log(`... and ${categories.unmapped.length - 20} more unmapped values\n`);
    }
}

// Save detailed report to JSON
const report = {
    totalCustomValues: customValues.length,
    totalMapped,
    coveragePercentage: ((totalMapped / customValues.length) * 100).toFixed(1),
    byCategory: {
        emails: {
            count: categories.emails.length,
            status: 'MAPPED',
            mapper: 'directEmailMapper.js',
            keys: categories.emails.map(cv => cv.Key)
        },
        sms: {
            count: categories.sms.length,
            status: 'MAPPED',
            mapper: 'directSMSMapper.js',
            keys: categories.sms.map(cv => cv.Key)
        },
        appointmentReminders: {
            count: categories.appointmentReminders.length,
            status: 'MAPPED',
            mapper: 'directAppointmentRemindersMapper.js',
            keys: categories.appointmentReminders.map(cv => cv.Key)
        },
        funnelCopy: {
            count: categories.funnelCopy.length,
            status: 'MAPPED',
            mapper: 'extractFunnelCopyCustomValues in pushSystem.js',
            keys: categories.funnelCopy.map(cv => cv.Key)
        },
        colors: {
            count: categories.colors.length,
            status: 'MAPPED',
            source: 'Intake Form brandColors',
            keys: categories.colors.map(cv => cv.Key)
        },
        media: {
            count: categories.media.length,
            status: 'MAPPED',
            mapper: 'Media Library + Funnel Copy fields',
            keys: categories.media.map(cv => cv.Key)
        },
        company: {
            count: categories.company.length,
            status: 'MAPPED',
            source: 'Intake Form company info',
            keys: categories.company.map(cv => cv.Key)
        },
        facebookAds: {
            count: categories.facebookAds.length,
            status: 'UNMAPPED',
            note: 'facebookAds section exists in vault, needs mapper',
            keys: categories.facebookAds.map(cv => cv.Key)
        },
        questionnaire: {
            count: categories.questionnaire.length,
            status: 'UNMAPPED',
            note: 'May need custom mapper or static values',
            keys: categories.questionnaire.map(cv => cv.Key)
        },
        unmapped: {
            count: categories.unmapped.length,
            status: 'UNMAPPED',
            keys: categories.unmapped.map(cv => cv.Key)
        }
    }
};

fs.writeFileSync(
    path.join(__dirname, 'custom-values-mapping-report.json'),
    JSON.stringify(report, null, 2)
);

console.log(`\n✅ Detailed report saved to: custom-values-mapping-report.json\n`);
