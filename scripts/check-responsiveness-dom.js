const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const AUTH_FILE = path.join(__dirname, '..', 'screenshots', '.auth-state.json');

const VIEWPORTS = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = [
    { path: '/auth/login', name: 'auth-login' },
    { path: '/auth/signup', name: 'auth-signup' },
    { path: '/auth/forgot-password', name: 'auth-forgot-password' },
    { path: '/auth/verify', name: 'auth-verify' },
    { path: '/join', name: 'join' },
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

(async () => {
    let report = '# 📱 Web Responsiveness & DOM Report\n\n';
    report += `Generated at: ${new Date().toLocaleString()}\n\n`;
    report += `This report checks for horizontal overflow, elements exceeding viewport width, and other responsiveness issues across Mobile, Tablet, and Desktop viewports.\n\n`;
    
    console.log('Starting Playwright...');
    const browser = await chromium.launch();
    
    let context;
    if (fs.existsSync(AUTH_FILE)) {
        console.log('Using authenticated state...');
        context = await browser.newContext({ storageState: AUTH_FILE });
    } else {
        console.log('No authenticated state found! User pages will redirect to login.');
        context = await browser.newContext();
    }

    for (const route of PAGES) {
        console.log(`Checking ${route.name}...`);
        report += `## Page: ${route.name}\n`;
        report += `- **Path**: \`${route.path}\`\n\n`;
        
        let foundIssuesOnPage = false;
        
        for (const viewport of VIEWPORTS) {
            const page = await context.newPage();
            try {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                // Catch navigation errors but continue
                await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.warn(`Goto timeout for ${route.path}`));
                await page.waitForTimeout(1500); // Allow styles and animations to apply
                console.log(`  -> URL after load: ${page.url()}`);
                
                const metrics = await page.evaluate(() => {
                    const winWidth = window.innerWidth;
                    const docWidth = document.documentElement.scrollWidth;
                    const hasHorizontalScroll = docWidth > winWidth;
                    
                    const isVisible = (elem) => !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
                    const issues = [];
                    
                    document.querySelectorAll('*').forEach(el => {
                        if (!isVisible(el)) return;
                        const tagName = el.tagName.toLowerCase();
                        if (['html', 'body', 'script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) return;
                        
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        
                        // Use heuristic limits to ignore minor 1-2px subpixel rounding problems
                        if (rect.right > (winWidth + 2) && rect.width > 0 && style.position !== 'absolute' && style.position !== 'fixed') {
                            const classString = className = typeof el.className === 'string' && el.className ? el.className.split(' ').join('.') : '';
                            issues.push({
                                element: `${tagName}${classString ? '.' + classString : ''}${el.id ? '#' + el.id : ''}`,
                                issueType: 'Exceeds viewport width',
                                severity: 'high',
                                extra: `Right bound: ${rect.right.toFixed(1)}px (Viewport: ${winWidth}px)`
                            });
                        }
                        
                        // Checking internal scrolling where scrollbar isn't intended (overflowX != auto/scroll/hidden)
                        if (el.scrollWidth > (el.clientWidth + 2) && style.overflowX !== 'auto' && style.overflowX !== 'scroll' && style.overflowX !== 'hidden') {
                            const classString = typeof el.className === 'string' && el.className ? el.className.split(' ').join('.') : '';
                            issues.push({
                                element: `${tagName}${classString ? '.' + classString : ''}${el.id ? '#' + el.id : ''}`,
                                issueType: 'Internal content overflows horizontally',
                                severity: 'medium',
                                extra: `scrollWidth: ${el.scrollWidth}px, clientWidth: ${el.clientWidth}px`
                            });
                        }
                    });
                    
                    return { docWidth, winWidth, hasHorizontalScroll, issues };
                });
                
                if (metrics.hasHorizontalScroll || metrics.issues.length > 0) {
                    foundIssuesOnPage = true;
                    report += `### 📏 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})\n`;
                    
                    if (metrics.hasHorizontalScroll) {
                        report += `> [!WARNING]\n`;
                        report += `> Horizontal scrollbar detected! Document width is **${metrics.docWidth}px** while viewport is **${metrics.winWidth}px**.\n\n`;
                    }
                    
                    if (metrics.issues.length > 0) {
                        report += `**Problematic Elements Detected:**\n`;
                        // Remove duplicates by element signature + issue type
                        const uniqueIssues = new Map();
                        metrics.issues.forEach(issue => {
                            // Don't clutter report with hundreds of similar items
                            const key = `${issue.element}-${issue.issueType}`;
                            if (!uniqueIssues.has(key)) uniqueIssues.set(key, issue);
                        });
                        
                        const limitedIssues = Array.from(uniqueIssues.values()).slice(0, 10);
                        
                        limitedIssues.forEach(issue => {
                            report += `- \`${issue.element}\`\n  - **Issue**: ${issue.issueType}\n  - **Details**: ${issue.extra}\n`;
                        });
                        
                        if (uniqueIssues.size > 10) {
                            report += `- *...and ${uniqueIssues.size - 10} more similar elements.*\n`;
                        }
                        report += '\n';
                    }
                }
                
            } catch (err) {
                console.error(`Error checking ${viewport.name} on ${route.name}:`, err.message);
                report += `### 📏 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})\n`;
                report += `> [!CAUTION]\n> Error checking this viewport: \`${err.message}\`\n\n`;
            }
            await page.close();
        }
        
        if (!foundIssuesOnPage) {
            report += `> [!TIP]\n> No responsiveness issues detected on any viewport! ✅\n\n`;
        }
        report += `---\n\n`;
    }
    
    await browser.close();
    
    // Save locally
    const reportPath = path.join(__dirname, '..', 'responsive-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n🎉 Report generated successfully! Saved to: ${reportPath}`);
})();
