# avalanchezy.github.io

## Profile details

Home includes a three-part research overview linked to Publications. Education uses a wider timeline, a city trail and official institution logos; research internships also show their host institution. The seven official logo assets and their source URLs/checksums are recorded in `assets/institutions/sources.json`. Logo artwork and colors remain intact on white backgrounds in both themes; only SVG whitespace was normalized. Earlier school entries remain text-only because a downloadable official emblem could not be verified.

About links to the author's ORCID and CV. Contact offers a localized copy-email button; if clipboard access is unavailable or denied, it selects the address for manual copying. The mailto link works without JavaScript. Run `node tests/contact-copy.cjs` with the same Playwright environment described below to check copying, fallback, pending state and language changes.

## Illustrated publications

The Publications view includes a short summary and an original AI-generated concept illustration for each of the four papers. Summaries, image descriptions and the illustration note are available in English, Chinese, French, Japanese and Korean. The English HTML remains readable without JavaScript.

`assets/publications/` contains the four 960 × 640 WebP images (about 300 KB total). Images load lazily with reserved dimensions and open at full size in a new tab. `manifest.json` records the full generation prompts and the papers used as sources; illustrations are conceptual, not experimental results. MapPano3D was read from the author's local final manuscript while its HAL record was pending. The other three full papers were read from HAL.

## Page navigation

The six navigation items open separate views rather than scrolling through a long page. Views use shareable URLs such as `?page=publications`, which work on GitHub Pages without a server-side router. Reloading, opening a link in another tab, and browser back/forward navigation preserve the selected view. Existing links such as `#publications` still work.

About includes only personal-life photos and the cat. Publications hosts the conference photos: MICCAI 2026, the ISBI 2026 poster, and the Centrale Lyon invited talk beside its event details. Photo shuffle stays within the current page and allows repeats. Home includes the research overview and visitor postcard. Language, theme, and publication filters remain available when switching views. Printing includes the current view. Without JavaScript, the complete page and its original anchor links remain accessible.

To check navigation, serve this directory with `python -m http.server 8765 --bind 127.0.0.1`, then run `node tests/navigation.cjs` with Playwright installed. `SITE_URL` overrides the preview address; `PLAYWRIGHT_MODULE` can point to an existing Playwright installation. The browser checks cover desktop/mobile navigation, direct links, history, five languages, publication filters, photos, theme switching, and the no-JavaScript fallback. Third-party requests are blocked during these checks.

## Visitor postcard

Home uses a real Stats4U counter, **1881857609**, created on 22 September 2026.
Its public dashboard is https://www.stats4u.net/live/1881857609.

- `visitors.js` loads one counting map image per production page load and reads its totals from the provider's public JSON endpoint. The map is not lazy-loaded, so visitors do not have to scroll to the footer to be counted.
- `t` is page views, not unique people; `c` contains country/region totals. Statistics begin when this counter is activated and do not include earlier Google Analytics history. Provider counts may include automated traffic.
- Local previews append `rl=1`, the provider's display-only flag. Language and theme changes do not reload the map or increase counts.
- The embed uses only the map image and a read-only totals request, with no Stats4U tracking script, city dots, click tracking or screen measurement. Approximate country/region locations come from the provider.
- If the service is unavailable or blocked, the card shows a localized message and dashes, never invented totals. `visitors.css` and `visitors-locales.js` contain its theme and five-language copy.
- `assets/visitor-world.svg` is an empty map exported from the same Stats4U image endpoint with `rl=1` before activation. It supplies an unmarked outline while loading or if remote images are blocked; it contains no sample visitor locations or counts.

Official references: [map options](https://www.stats4u.net/en/maps), [counting information](https://www.stats4u.net/en/about), [display-only refresh in the embed source](https://www.stats4u.net/s4u.js), [public totals format used by the provider](https://www.stats4u.net/js/globe.js).
