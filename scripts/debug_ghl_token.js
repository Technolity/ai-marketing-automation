const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local or .env
function loadEnv() {
    const envFiles = ['.env.local', '.env'];
    const envVars = {};

    for (const file of envFiles) {
        try {
            const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    if (!envVars[key]) envVars[key] = value;
                }
            });
        } catch (e) {
            // File not found, ignore
        }
    }
    return envVars;
}

const env = loadEnv();
const TOKEN = env.GHL_AGENCY_TOKEN || process.env.GHL_AGENCY_TOKEN;

console.log('--- GHL Token Debugger ---');

if (!TOKEN) {
    console.error('ERROR: GHL_AGENCY_TOKEN not found in .env or .env.local');
    console.error('Please make sure you have a .env.local file with GHL_AGENCY_TOKEN=pit-...');
    process.exit(1);
}

const maskedToken = `${TOKEN.substring(0, 10)}...${TOKEN.substring(TOKEN.length - 5)}`;
console.log(`Using Token: ${maskedToken}`);

// Payload for creating a location (same as your app uses)
const payload = JSON.stringify({
    name: "Debug Test Location",
    companyName: "Debug Test Company",
    email: "debug.test@example.com",
    phone: "+15550000000",
    country: "US",
    timezone: "America/New_York",
    address: "123 Debug St",
    city: "New York",
    state: "NY",
    postalCode: "10001"
});

const options = {
    hostname: 'services.leadconnectorhq.com',
    path: '/locations/',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

console.log('\nSending request to GHL API (POST /locations/)...');

const req = https.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n--- Response Body ---');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));

            if (res.statusCode === 403) {
                console.log('\nAnalysis: 403 Forbidden');
                if (json.message && json.message.includes('scope')) {
                    console.log('-> SCOPE ISSUE: The token is missing required scopes (likely locations.write).');
                } else {
                    console.log('-> TYPE ISSUE: This might be a "Location" token instead of an "Agency" token.');
                    console.log('   Please check that you selected "Agency" when creating the Private Integration in GHL.');
                }
            } else if (res.statusCode === 201 || res.statusCode === 200) {
                console.log('\nSUCCESS! The token is working correctly.');
                console.log('Note: A test location was created (or attempted). You might want to delete it in GHL.');
            }

        } catch (e) {
            console.log('Raw body:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(payload);
req.end();
