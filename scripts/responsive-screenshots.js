/**
 * TedOS Responsive Screenshot Tool
 *
 * Takes screenshots of every page at 3 viewport sizes:
 *   - Mobile:  375 x 812  (iPhone SE / standard mobile)
 *   - Tablet:  768 x 1024 (iPad)
 *   - Desktop: 1440 x 900 (standard desktop)
 *
 * Output: screenshots/responsive/<viewport>/<page-name>.png
 *
 * Usage:
 *   1. Make sure dev server is running: npm run dev
 *   2. Run: node scripts/responsive-screenshots.js
 *   3. Optional — with auth (for protected pages):
 *      node scripts/responsive-screenshots.js --auth
 *      (Will prompt you to log in manually on first run, then reuses session)
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'responsive');
const AUTH_FILE = path.join(__dirname, '..', 'screenshots', '.auth-state.json');

const VIEWPORTS = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
];

// ─── Pages to screenshot ────────────────────────────────────────────────────
// Group: public — no auth needed
const PUBLIC_PAGES = [
    { path: '/auth/login', name: 'auth-login' },
    { path: '/auth/signup', name: 'auth-signup' },
    { path: '/auth/forgot-password', name: 'auth-forgot-password' },
    { path: '/auth/verify', name: 'auth-verify' },
    { path: '/join', name: 'join' },
];

// Group: user — requires login
const USER_PAGES = [
    { path: '/', name: 'home' },
    { path: '/welcome', name: 'welcome' },
    { path: '/introduction', name: 'introduction' },
    { path: '/dashboard', name: 'dashboard' },
    { path: '/onboarding', name: 'onboarding' },
    { path: '/intake_form', name: 'intake-form' },
    { path: '/vault', name: 'vault' },
    { path: '/guide', name: 'guide' },
    { path: '/team', name: 'team' },
    { path: '/funnel-live', name: 'funnel-live' },
    { path: '/funnel-recommendation', name: 'funnel-recommendation' },
    { path: '/docs/builder-guide', name: 'docs-builder-guide' },
];

// Group: admin — requires admin login
const ADMIN_PAGES = [
    { path: '/admin/login',          name: 'admin-login' },
    { path: '/admin',                name: 'admin-overview' },
    { path: '/admin/users',          name: 'admin-users' },
    { path: '/admin/businesses',     name: 'admin-businesses' },
    { path: '/admin/subscriptions',  name: 'admin-subscriptions' },
    { path: '/admin/billing',        name: 'admin-billing' },
    { path: '/admin/funnels',        name: 'admin-funnels' },
    { path: '/admin/content-review', name: 'admin-content-review' },
    { path: '/admin/announcements',  name: 'admin-announcements' },
    { path: '/admin/knowledge-base', name: 'admin-knowledge-base' },
    { path: '/admin/transcripts',    name: 'admin-transcripts' },
    { path: '/admin/settings',       name: 'admin-settings' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function screenshotPage(page, viewport, route, outDir) {
    const url = `${BASE_URL}${route.path}`;
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        // Small settle delay for animations
        await page.waitForTimeout(800);
        const filePath = path.join(outDir, `${route.name}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`  ✓ ${viewport.name.padEnd(8)} ${route.path}`);
    } catch (err) {
        console.warn(`  ✗ ${viewport.name.padEnd(8)} ${route.path} — ${err.message}`);
    }
}

// ─── Main ───────────────────────────────────────────────────────────────────
(async () => {
    const useAuth = process.argv.includes('--auth');
    const browser = await chromium.launch({ headless: !useAuth });

    let context;

    if (useAuth && fs.existsSync(AUTH_FILE)) {
        // Reuse saved auth session
        context = await browser.newContext({ storageState: AUTH_FILE });
        console.log('🔑 Using saved auth session\n');
    } else if (useAuth) {
        // First run with auth — open browser for manual login
        context = await browser.newContext();
        const loginPage = await context.newPage();
        console.log('🔑 Please log in manually in the browser window that opens...');
        await loginPage.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
        // Wait until user lands on a non-auth page (up to 2 minutes)
        await loginPage.waitForURL(url => !url.href.includes('/auth/'), { timeout: 120000 });
        console.log('✅ Login detected — saving session\n');
        ensureDir(path.dirname(AUTH_FILE));
        await context.storageState({ path: AUTH_FILE });
        await loginPage.close();
    } else {
        context = await browser.newContext();
        console.log('ℹ️  Running without auth. Protected pages will show login redirect.\n');
        console.log('   Run with --auth flag to screenshot authenticated pages.\n');
    }

    const allPages = [...PUBLIC_PAGES, ...USER_PAGES, ...ADMIN_PAGES];
    let total = 0;

    for (const viewport of VIEWPORTS) {
        console.log(`\n📐 ${viewport.name.toUpperCase()} (${viewport.width}×${viewport.height})`);
        console.log('─'.repeat(50));

        const page = await context.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        const outDir = path.join(OUT_DIR, viewport.name);
        ensureDir(outDir);

        for (const route of allPages) {
            await screenshotPage(page, viewport, route, outDir);
            total++;
        }

        await page.close();
    }

    await browser.close();

    console.log(`\n✅ Done — ${total} screenshots saved to: screenshots/responsive/`);
    console.log('   Folder structure:');
    console.log('   screenshots/responsive/mobile/');
    console.log('   screenshots/responsive/tablet/');
    console.log('   screenshots/responsive/desktop/');
})();
