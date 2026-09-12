# afinora.app

The public site for [Afinora](https://afinora.app), a practice app for string
players. Served by GitHub Pages from this branch.

Two of these pages are not marketing. `privacy.html` and `support.html` are the
URLs registered with Google Play and the App Store, so **their filenames must not
change** and they must never 404 — a dead privacy policy is grounds for removal
from both stores.

## How it is built

One template per page, one JSON per language, and a Node script that writes a
real HTML file for every combination. You edit two kinds of file and never touch
the generated HTML.

```
src/locales/*.json     the words — nine files, en.json is the reference
src/templates/*.mjs    the three page layouts
src/layout.mjs         head, header and footer, shared by every page
assets/css/site.css    all styling
assets/js/afinora.js   the animated app mockups, one shared clock
build.mjs              writes the pages
```

```sh
node build.mjs                      # all nine languages
AFINORA_LANGS=en,es node build.mjs  # just these two, while drafting
```

No dependencies, no bundler, no framework. `node build.mjs` is the whole
toolchain.

Pushing a change to `src/` or `build.mjs` triggers `.github/workflows/build.yml`,
which rebuilds and commits the pages for you.

### Output

| Language | URLs |
|---|---|
| English | `/`, `/privacy.html`, `/support.html` |
| The other eight | `/es/`, `/es/privacy.html`, … and so on for it, fr, pt, de, ja, zh, ru |

English lives at the root because that is where the stores already point.

`build.mjs` also writes `sitemap.xml` and `robots.txt`, and refuses to build if a
translation is missing a key that English has — a blank space in Japanese is not
something anyone would notice until a user did.

## Adding a language

Copy `src/locales/en.json`, translate the values, add the code to `ALL_LANGS` and
`LANG_NAMES` in `build.mjs`. Nothing else.

## Where the design comes from

Every colour, font and measurement is the app's own — surfaces from
`tunerSettings.ts`, state colours from `semanticColors.ts`, fonts from
`typography.ts`. The five phone mockups are drawn live in the DOM from the real
thresholds: the tuner's zones are `tunerDisplaySmoothing.ts`'s 4.5 and 19 cents,
the metronome's dial geometry is `TempoDial.tsx`'s, the note colours are
`laneInkColors`. If any of those change in the app, change them here too.

`privacy.html` is a legal document. Its English text is `docs/privacy-policy.md`
from the app repo, section for section; the translations carry a notice saying
the English version governs. Re-sync it whenever the app's data handling changes.
