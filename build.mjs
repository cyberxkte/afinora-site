/*
 * Builds the site.
 *
 *   node build.mjs
 *
 * Reads one template per page and one JSON per language, and writes a real HTML
 * file for every combination. English lands at the root, because that is where
 * both stores already point their privacy and support URLs; the other eight
 * languages get a directory each.
 *
 * Static output is the point. GitHub Pages serves files and runs nothing, and
 * a page that assembled itself in the browser would leave Google one indexable
 * URL for nine languages.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE, pageUrl } from './src/layout.mjs';
import landing from './src/templates/landing.mjs';
import support from './src/templates/support.mjs';
import privacy from './src/templates/privacy.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = ROOT;

/** Order matters: it is the order of the language menu. English first. */
const ALL_LANGS = ['en', 'es', 'it', 'fr', 'pt', 'de', 'ja', 'zh', 'ru'];

/**
 * AFINORA_LANGS=en,es narrows a build while a translation is still being
 * written. The published build always runs the full set.
 */
const LANGS = process.env.AFINORA_LANGS
  ? process.env.AFINORA_LANGS.split(',').map((l) => l.trim()).filter(Boolean)
  : ALL_LANGS;

const LANG_NAMES = {
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  ru: 'Русский',
};

const TEMPLATES = { index: landing, support, privacy };

/**
 * Look a key up by dotted path.
 *
 * A missing key is a build failure rather than an empty space on the page: a
 * silent blank in Japanese is exactly the kind of thing nobody notices until a
 * user does.
 */
function lookup(strings, key, lang) {
  const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), strings);
  if (value === undefined) {
    throw new Error(`Missing key "${key}" in ${lang}.json`);
  }
  return value;
}

/** The subset of strings the mockups need at runtime, handed to the page. */
function runtimeStrings(strings) {
  return strings.ui || {};
}

async function loadLocale(lang) {
  const file = join(ROOT, 'src', 'locales', `${lang}.json`);
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Everything under src/locales/en.json is required of every other language. */
function checkComplete(reference, candidate, lang, path = '') {
  for (const [key, value] of Object.entries(reference)) {
    const here = path ? `${path}.${key}` : key;
    if (!(key in candidate)) {
      throw new Error(`${lang}.json is missing "${here}"`);
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      checkComplete(value, candidate[key], lang, here);
    }
    if (Array.isArray(value) && value.length !== candidate[key].length) {
      throw new Error(`${lang}.json: "${here}" has ${candidate[key].length} items, English has ${value.length}`);
    }
  }
}

function sitemap() {
  const now = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const lang of LANGS) {
    for (const pageName of Object.keys(TEMPLATES)) {
      const loc = SITE + pageUrl(lang, pageName);
      const alternates = LANGS
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${pageUrl(l, pageName)}"/>`)
        .join('\n');
      urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pageUrl('en', pageName)}"/>
    <priority>${pageName === 'index' ? (lang === 'en' ? '1.0' : '0.8') : '0.5'}</priority>
  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/**
 * A short content hash for the stylesheet and the script.
 *
 * It rides on the URL as ?v= so that a change reaches a visitor who already has
 * the old file cached. Without it, a browser holding a stale afinora.js shows
 * every mockup drawn but frozen, and no amount of republishing fixes it.
 */
async function assetVersion(path) {
  const bytes = await readFile(join(ROOT, path));
  /*
    Hash the content, not the line endings.

    Git hands this file CRLF on a Windows checkout and LF on the Linux runner,
    so hashing the raw bytes gave two different versions for one unchanged
    stylesheet. Every build then disagreed with the last one, the workflow
    committed the difference, and the next push hit a conflict over nothing.
  */
  const normalised = bytes.toString('utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalised, 'utf8').digest('hex').slice(0, 10);
}

async function main() {
  const reference = await loadLocale('en');
  const assets = {
    css: await assetVersion('assets/css/site.css'),
    js: await assetVersion('assets/js/afinora.js'),
    fonts: await assetVersion('assets/css/fonts.css'),
  };
  let written = 0;

  for (const lang of LANGS) {
    const strings = lang === 'en' ? reference : await loadLocale(lang);
    if (lang !== 'en') checkComplete(reference, strings, lang);

    const t = (key) => lookup(strings, key, lang);

    for (const [pageName, template] of Object.entries(TEMPLATES)) {
      const ctx = {
        lang,
        page: pageName,
        t,
        langs: LANGS,
        langNames: LANG_NAMES,
        strings: runtimeStrings(strings),
        assets,
      };
      const html = template(ctx);

      const dir = lang === 'en' ? OUT : join(OUT, lang);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${pageName}.html`), html, 'utf8');
      written++;
    }
  }

  await writeFile(join(OUT, 'sitemap.xml'), sitemap(), 'utf8');
  await writeFile(join(OUT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');

  console.log(`Built ${written} pages in ${LANGS.length} languages, plus sitemap.xml and robots.txt.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
