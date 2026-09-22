# avalanchezy.github.io

## Visitor postcard

The footer uses a real Stats4U counter, **1881857609**, created on 22 September 2026.
Its public dashboard is https://www.stats4u.net/live/1881857609.

- `visitors.js` loads one counting map image per production page load and reads its totals from the provider's public JSON endpoint. The map is not lazy-loaded, so visitors do not have to scroll to the footer to be counted.
- `t` is page views, not unique people; `c` contains country/region totals. Statistics begin when this counter is activated and do not include earlier Google Analytics history. Provider counts may include automated traffic.
- Local previews append `rl=1`, the provider's display-only flag. Language and theme changes do not reload the map or increase counts.
- The embed uses only the map image and a read-only totals request, with no Stats4U tracking script, city dots, click tracking or screen measurement. Approximate country/region locations come from the provider.
- If the service is unavailable or blocked, the card shows a localized message and dashes, never invented totals. `visitors.css` and `visitors-locales.js` contain its theme and five-language copy.
- `assets/visitor-world.svg` is an empty map exported from the same Stats4U image endpoint with `rl=1` before activation. It supplies an unmarked outline while loading or if remote images are blocked; it contains no sample visitor locations or counts.

Official references: [map options](https://www.stats4u.net/en/maps), [counting information](https://www.stats4u.net/en/about), [display-only refresh in the embed source](https://www.stats4u.net/s4u.js), [public totals format used by the provider](https://www.stats4u.net/js/globe.js).
