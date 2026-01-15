// scripts/test-pabbly-deploy.js

/**
 * Pabbly Webhook Test Script
 * Use this to trigger your Pabbly "Deploy" webhook with dummy data.
 * This helps you map the fields in Pabbly without waiting for real AI content.
 * 
 * USAGE:
 * 1. Open this file
 * 2. Paste your Pabbly Webhook URL in the variable below
 * 3. Run: node scripts/test-pabbly-deploy.js
 */

// PASTE YOUR PABBLY WEBHOOK URL HERE
const PABBLY_DEPLOY_WEBHOOK_URL = "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNzA0MzQ1MjZjNTUzNDUxMzIi_pc";

// ---------------------------------------------------------

if (!PABBLY_DEPLOY_WEBHOOK_URL) {
    console.error("❌ ERROR: Please duplicate this file, open it, and paste your Pabbly Webhook URL in line 12.");
    process.exit(1);
}

const dummyPayload = {
    userId: "test_user_" + Math.floor(Math.random() * 1000),
    funnelId: "test_funnel_" + Math.floor(Math.random() * 1000),
    locationId: "test_location_sample_id",

    // This replicates the iterator structure
    customValues: [
        { key: "vsl_hero_headline", value: "SAMPLE: Use this structure to map your iterator" },
        { key: "vsl_sub_headline", value: "SAMPLE: Sub headline content goes here" },
        { key: "optin_headline_text", value: "SAMPLE: Optin Headline" },
        { key: "vsl_video_url", value: "https://www.youtube.com/watch?v=sample" },
        { key: "company_name", value: "Acme Corp Sample" }
    ],

    timestamp: new Date().toISOString(),
    meta: {
        source: 'manual_test_script',
        itemCount: 5
    }
};

console.log("🚀 Sending test payload to Pabbly...");
console.log("URL:", PABBLY_DEPLOY_WEBHOOK_URL);
console.log("Payload:", JSON.stringify(dummyPayload, null, 2));

fetch(PABBLY_DEPLOY_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dummyPayload)
})
    .then(async res => {
        if (res.ok) {
            console.log("✅ SUCCESS! Check your Pabbly dashboard history.");
        } else {
            console.error("❌ FAILED:", res.status, await res.text());
        }
    })
    .catch(err => {
        console.error("❌ NETWORK ERROR:", err.message);
    });
