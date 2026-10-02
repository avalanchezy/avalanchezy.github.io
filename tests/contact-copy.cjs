const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.SITE_URL || 'http://127.0.0.1:8765/';
const origin = new URL(base).origin;
const email = 'yi.zhu@creatis.insa-lyon.fr';
const messages = {
    en: ['Email copied.', 'The address is selected. You can copy it manually.'],
    zh: ['邮箱地址已复制。', '邮箱地址已选中，可以手动复制。'],
    fr: ['Adresse e-mail copiée.', 'L’adresse est sélectionnée. Vous pouvez la copier manuellement.'],
    ja: ['メールアドレスをコピーしました。', 'アドレスを選択しました。手動でコピーできます。'],
    ko: ['이메일 주소를 복사했어요.', '주소를 선택했어요. 직접 복사할 수 있어요.']
};

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    const openContact = async (options = {}, clipboardMode) => {
        const context = await browser.newContext({ locale: 'en-US', ...options });
        await context.route('**/*', route => new URL(route.request().url()).origin === origin
            ? route.continue() : route.abort());
        if (clipboardMode) {
            // Control browser permission failures and pending operations; keep the site's handler real.
            await context.addInitScript(mode => {
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: mode === 'unavailable' ? undefined : {
                        writeText: mode === 'pending'
                            ? () => new Promise(resolve => { window.finishEmailCopy = resolve; })
                            : async () => { throw new DOMException('Clipboard access denied', 'NotAllowedError'); }
                    }
                });
            }, clipboardMode);
        }
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        page.setDefaultTimeout(5000);
        await page.goto(`${base}?page=contact`, { waitUntil: 'networkidle' });
        return { context, page };
    };
    const expectStatus = async (page, expected) => {
        await page.waitForFunction(text => document.getElementById('email-copy-status')?.textContent === text, expected);
        assert.equal(await page.locator('#email-copy-status').innerText(), expected);
        assert.equal(await page.locator('#copy-email').isEnabled(), true, 'The copy button must be reusable');
    };
    try {
        const success = await openContact({ permissions: ['clipboard-read', 'clipboard-write'] });
        assert.equal(await success.page.locator('#copy-email').isVisible(), true, 'JavaScript must reveal the copy button');
        assert.equal(await success.page.locator('#email-copy-status').getAttribute('role'), 'status');
        assert.equal(await success.page.locator('#email-copy-status').getAttribute('aria-live'), 'polite');
        for (const [language, [copied]] of Object.entries(messages)) {
            await success.page.selectOption('#language-select', language);
            await success.page.locator('#copy-email').click();
            await expectStatus(success.page, copied);
            assert.equal(await success.page.evaluate(() => navigator.clipboard.readText()), email,
                'Copy only the email address, without the decorative arrow');
        }
        await success.page.selectOption('#language-select', 'en');
        await expectStatus(success.page, messages.en[0]);
        await success.context.close();
        console.log('PASS: real clipboard, exact email, five success languages, status follows language changes');

        for (const mode of ['denied', 'unavailable']) {
            const fallback = await openContact({}, mode);
            const languages = mode === 'denied' ? Object.keys(messages) : ['en'];
            for (const language of languages) {
                await fallback.page.selectOption('#language-select', language);
                await fallback.page.locator('#copy-email').click();
                await expectStatus(fallback.page, messages[language][1]);
                assert.deepEqual(await fallback.page.evaluate(() => {
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const address = document.getElementById('contact-email-address');
                    return {
                        text: selection.toString(),
                        insideAddress: address.contains(range.startContainer) && address.contains(range.endContainer)
                    };
                }), { text: email, insideAddress: true }, 'Fallback selects only the email text');
                assert.equal(await fallback.page.locator('.contact-email').getAttribute('href'), `mailto:${email}`);
            }
            await fallback.page.selectOption('#language-select', 'fr');
            await expectStatus(fallback.page, messages.fr[1]);
            await fallback.context.close();
        }
        console.log('PASS: denied/unavailable clipboard, exact fallback selection, five fallback languages');

        const pending = await openContact({}, 'pending');
        await pending.page.locator('#copy-email').click();
        assert.equal(await pending.page.locator('#copy-email').isDisabled(), true, 'Prevent duplicate pending writes');
        await pending.page.selectOption('#language-select', 'fr');
        assert.equal(await pending.page.locator('#email-copy-status').innerText(), '');
        await pending.page.evaluate(() => window.finishEmailCopy());
        await expectStatus(pending.page, messages.fr[0]);
        await pending.page.locator('#copy-email').click();
        assert.equal(await pending.page.locator('#email-copy-status').innerText(), '', 'A new attempt clears the previous result');
        await pending.page.evaluate(() => window.finishEmailCopy());
        await expectStatus(pending.page, messages.fr[0]);
        await pending.context.close();
        console.log('PASS: pending state and language changes during clipboard write');

        const noScript = await openContact({ javaScriptEnabled: false });
        assert.equal(await noScript.page.locator('#copy-email').isVisible(), false);
        assert.equal(await noScript.page.locator('.contact-email').isVisible(), true);
        assert.equal(await noScript.page.locator('.contact-email').getAttribute('href'), `mailto:${email}`);
        await noScript.context.close();
        console.log('PASS: no-JavaScript mailto link remains available, copy button stays hidden');
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
