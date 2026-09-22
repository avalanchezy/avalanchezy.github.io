# Xiaolai webfont

`xiaolai-regular.woff2` is a subset of the proportional **Xiaolai Regular
v3.126**, used for the Chinese handwritten headings and notes.

- Project: https://github.com/lxgw/kose-font
- Release: https://github.com/lxgw/kose-font/releases/tag/v3.126
- Original font: https://github.com/lxgw/kose-font/releases/download/v3.126/Xiaolai-Regular.ttf
- License: https://raw.githubusercontent.com/lxgw/kose-font/v3.126/OFL.txt

The SIL Open Font License 1.1 is included unchanged as `OFL-Xiaolai.txt`.
The upstream copyright statement declares no Reserved Font Names, so the
subset retains the internal family name `Xiaolai`.

To regenerate, install `fonttools[woff]`, download the original font above,
then combine `translations.js` and `visitors-locales.js` into a UTF-8 text file,
and run this from the repository root (replace `/path/to` with its location):

```sh
pyftsubset /path/to/Xiaolai-Regular.ttf --text-file=/path/to/combined-copy.txt --unicodes=U+0020-007E,U+2000-206F,U+3000-303F --flavor=woff2 --output-file=assets/fonts/xiaolai-regular.woff2 --layout-features='*' --name-IDs='*' --name-legacy --name-languages='*'
```

The subset includes all source-supported characters in `translations.js`
and `visitors-locales.js`, ASCII, and general/CJK punctuation. Emoji use the browser's emoji font.
Regenerate when Chinese copy introduces new characters.
