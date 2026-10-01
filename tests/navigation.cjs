const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.SITE_URL || 'http://127.0.0.1:8765/';
const origin = new URL(base).origin;

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    try {
        for (const width of [1440, 390]) {
            const context = await browser.newContext({ viewport: { width, height: 1000 } });
            // Keep the real site scripts; avoid recording visits or relying on third-party services.
            await context.route('**/*', route => new URL(route.request().url()).origin === origin
                ? route.continue() : route.abort());
            const page = await context.newPage();
            page.on('pageerror', error => errors.push(error.message));
            const navigate = async key => {
                if (width < 1001) await page.locator('.mobile-menu-btn').click();
                await page.locator(`.nav-links [data-i18n="${key}"]`).click();
            };
            await page.goto(base, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('#home').isVisible(), true);
            assert.equal(await page.locator('#about').isVisible(), false, 'Home must not stack the other pages below it');
            assert.equal(await page.locator('#visitors').isVisible(), true);

            await navigate('navPublications');
            assert.equal(new URL(page.url()).searchParams.get('page'), 'publications');
            assert.equal(await page.locator('#publications').isVisible(), true);
            assert.equal(await page.locator('#home').isVisible(), false);
            assert.equal(await page.locator('#visitors').isVisible(), false);
            assert.equal(await page.evaluate(() => window.scrollY), 0, 'Navigation must replace the page without scrolling down');
            assert.equal(await page.locator('.nav-links [aria-current="page"]').getAttribute('data-i18n'), 'navPublications');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'publications-title');
            assert.equal(await page.locator('.mobile-menu-btn').getAttribute('aria-expanded'), 'false');
            assert.equal(await page.locator('.publication-item .paper-link').first().getAttribute('href'), 'https://hal.science/view/index/docid/5774047');

            for (const language of ['en', 'zh', 'fr', 'ja', 'ko']) {
                await page.selectOption('#language-select', language);
                assert.equal(await page.locator('#publications').isVisible(), true);
                assert.equal(await page.locator('#home').isVisible(), false);
                assert.match(await page.locator('.publication-item .paper-link').first().getAttribute('aria-label'), /MapPano3D/);
                for (const [year, count] of [['2026', 3], ['2024', 1], ['all', 4]]) {
                    await page.locator(`.filter-button[data-year="${year}"]`).click();
                    assert.equal(await page.locator('.publication-item:not([hidden])').count(), count);
                }
                assert.ok(!(await page.locator('body').innerText()).includes('undefined'));
            }
            await page.selectOption('#language-select', 'en');
            await page.reload({ waitUntil: 'networkidle' });
            assert.equal(await page.locator('#publications').isVisible(), true, 'A copied page URL must survive reload');
            await page.locator('.skip-link').focus();
            await page.locator('.skip-link').press('Enter');
            await navigate('navAbout');
            assert.equal(await page.locator('#about').isVisible(), true);
            assert.equal(await page.locator('#life').isVisible(), true, 'Photos stay accessible on About');
            await page.locator('.photo-button').first().click();
            assert.equal(await page.locator('#photo-dialog').isVisible(), true);
            await page.goBack();
            assert.equal(await page.locator('#publications').isVisible(), true);
            assert.equal(await page.locator('#life').isVisible(), false);
            assert.equal(await page.locator('#photo-dialog').isVisible(), false, 'History navigation must close an open photo');
            await page.goForward();
            assert.equal(await page.locator('#about').isVisible(), true);
            assert.equal(await page.evaluate(() => window.scrollY), 0);
            for (const [key, id] of [['navEducation', 'education'], ['navExperience', 'experience'], ['navContact', 'contact']]) {
                await navigate(key);
                assert.equal(await page.locator(`#${id}`).isVisible(), true);
                assert.equal(await page.locator('#about').isVisible(), false);
                assert.equal(await page.evaluate(() => window.scrollY), 0);
            }
            await page.locator('.theme-toggle').click();
            assert.equal(await page.locator('body').evaluate(el => el.classList.contains('dark')), true);
            await page.locator('.site-footer a').click();
            assert.equal(await page.locator('#home').isVisible(), true);
            await page.locator('.hero-links a').first().click();
            assert.equal(await page.locator('#about').isVisible(), true);

            await page.goto(`${base}#publications`, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('#publications').isVisible(), true, 'Existing shared hash links must keep working');
            assert.equal(await page.locator('#home').isVisible(), false);
            await page.goto(`${base}?page=missing`, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('#home').isVisible(), true);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
            await page.goto(`${base}#life`, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('#life').isVisible(), true);
            assert.equal(await page.locator('#about').isVisible(), true);
            assert.equal(new URL(page.url()).hash, '#life');
            assert.ok((await page.locator('#life').boundingBox()).y < 200, 'A gallery deep link must still land on the gallery');
            await page.reload({ waitUntil: 'networkidle' });
            assert.ok((await page.locator('#life').boundingBox()).y < 200);
            await navigate('navAbout');
            assert.equal(new URL(page.url()).hash, '', 'The page tab must clear an old subsection destination');
            assert.equal(await page.evaluate(() => window.scrollY), 0);
            await page.goto(`${base}#visitors`, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('#visitors').isVisible(), true);
            assert.equal(new URL(page.url()).hash, '#visitors');
            assert.ok(await page.evaluate(() => window.scrollY > 0), 'A visitor-card deep link must preserve its destination');
            assert.ok((await page.locator('#visitors').boundingBox()).y < 800);
            console.log(`PASS: ${width}px navigation, five languages, filters, history, direct links, photos, theme`);
            await context.close();
        }
        const fallback = await browser.newContext({ javaScriptEnabled: false });
        await fallback.route('**/*', route => new URL(route.request().url()).origin === origin
            ? route.continue() : route.abort());
        const page = await fallback.newPage();
        await page.goto(base);
        await page.locator('.nav-links [data-i18n="navPublications"]').click();
        assert.equal(new URL(page.url()).hash, '#publications');
        assert.equal(await page.locator('#publications').isVisible(), true);
        await fallback.close();
        console.log('PASS: no-JavaScript content and anchor navigation');
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
