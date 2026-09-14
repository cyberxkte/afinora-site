/*
 * The shell every page shares: head, header, footer.
 *
 * There is one of each, for every language. A page template supplies its own
 * <main>; everything around it comes from here, so a change to the footer or
 * the language menu happens once.
 */

export const SITE = 'https://afinora.app';
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.afinora.app';
/*
 * No country code and no name slug on purpose.
 *
 * A regional link (/mx/, /us/) shows "not available in your country" to
 * everyone outside it, and a slug taken from the app's name breaks the day the
 * name changes — which it already did, from "Afinora" to "Afinora: Tuner &
 * Training". The bare id lets Apple send each visitor to their own storefront.
 */
export const APPLE_URL = 'https://apps.apple.com/app/id6771803917';

/**
 * The contact address.
 *
 * An address on the product's own domain rather than a personal one: it is what
 * docs/privacy-policy.md already promises, it survives changing mail providers,
 * and it keeps a private mailbox off a public page.
 *
 * It is a Porkbun forwarder, which means IT ONLY WORKS WHILE THAT FORWARDER
 * EXISTS. Both stores require a working way to make contact, and Apple has been
 * known to try the address during review — a bouncing mailbox is worse than no
 * mailbox. If the forwarder is ever removed, change this constant back to one
 * that receives mail before the change is published.
 *
 * It appears on support.html and privacy.html only, never in the footer: those
 * two pages are where the stores require it, and an address repeated in the
 * footer of all 27 pages is what harvesters feed on. The footer's Support link
 * leads to it.
 */
export const CONTACT = 'support@afinora.app';

/** Escape for HTML text and double-quoted attributes. */
export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The mark, inlined so it paints with the first frame and costs no request. */
export const MARK = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g transform="translate(5 6.567) scale(0.9)">
    <defs>
      <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect x="0" y="0" width="100" height="100" fill="#fff"/>
        <circle cx="50" cy="66" r="7.5" fill="#000"/>
      </mask>
    </defs>
    <path d="M27 66 L73 66" fill="none" stroke="#2f7f60" stroke-width="6" stroke-linecap="round" mask="url(#m)"/>
    <g fill="none" stroke="#34d399" stroke-width="11">
      <path d="M20 88 L32.38 56.64"/>
      <path d="M80 88 L67.62 56.64"/>
      <path d="M36.42 46.4 L50 12 L63.58 46.4" stroke-linejoin="round"/>
    </g>
    <circle cx="50" cy="66" r="5" fill="#6ee7b7"/>
  </g>
</svg>`;

/*
 * Typefaces, served from this domain and never from fonts.googleapis.com: that
 * request hands every visitor's IP address to Google before they have agreed to
 * anything. See assets/css/fonts.css for the rest of the reasoning.
 *
 * The two faces that set the first screen are preloaded so the headline does
 * not flash. Both are variable files — one covers every weight of its family,
 * which is why the preloaded name says 500 and the headline at 700 still uses
 * it.
 */
const FONT_PRELOADS = [
  'space-grotesk-500-latin.woff2',
  'ibm-plex-sans-400-latin.woff2',
];

/** Where a page lives for a given language. English sits at the root. */
export function pageUrl(lang, page) {
  const dir = lang === 'en' ? '' : `${lang}/`;
  return page === 'index' ? `/${dir}` : `/${dir}${page}.html`;
}

/**
 * The same URL, but marked as a deliberate choice of language.
 *
 * The root page sends a visitor to their own language on a first visit, so a
 * plain link back to English would bounce straight back here. `?hl=` says "the
 * reader picked this", which the redirect script records and then obeys
 * forever. It rides on the URL rather than on a click handler so that it still
 * works with no JavaScript, and every page carries a query-free canonical so
 * the parameter never reaches an index.
 */
export function chosenLangUrl(lang, page) {
  return `${pageUrl(lang, page)}?hl=${lang}`;
}

/**
 * Sends a first-time visitor to their own language, once, from the root only.
 *
 * Runs inline and synchronously in <head> so the English page never paints
 * before the redirect. It goes on every page, because remembering a choice has
 * to happen wherever the reader makes it — but it only ever *redirects* from
 * the root. Deliberately narrow:
 *
 *  - privacy.html and support.html are the URLs both stores have on file, and
 *    a reviewer opening one must land on exactly it, in the language they
 *    asked for. Those pages record a choice and redirect no one.
 *  - A reader who picks a language is obeyed from then on, via ?hl= and a
 *    remembered flag. Without that, the English link would bounce a Spanish
 *    browser straight back to /es/.
 *  - Crawlers are left alone. Google asks for hreflang rather than redirects,
 *    and hreflang is what tells it the other eight versions exist.
 *  - replace(), not assign(), so Back leaves the site instead of ping-ponging.
 */
export function redirectScript(langs) {
  const others = langs.filter((l) => l !== 'en');
  return `<script>(function(){try{
var K='afinora.lang',u=new URL(location.href),q=u.searchParams.get('hl');
if(q){try{localStorage.setItem(K,q);}catch(e){}
u.searchParams.delete('hl');history.replaceState(null,'',u.pathname+u.search+u.hash);return;}
if(u.pathname!=='/'&&u.pathname!=='/index.html')return;
try{if(localStorage.getItem(K))return;}catch(e){}
if(/bot|crawl|spider|slurp|bingpreview|duckduckgo|baidu|yandex|lighthouse/i.test(navigator.userAgent))return;
var S=${JSON.stringify(others)},L=navigator.languages||[navigator.language||'en'];
for(var i=0;i<L.length;i++){var c=String(L[i]).toLowerCase().split('-')[0];
if(c==='en')return;
if(S.indexOf(c)>-1){location.replace('/'+c+'/');return;}}
}catch(e){}})();</script>`;
}

/** A link from one page to another within the same language. */
export function rel(lang, from, to) {
  // Every page of a language lives in the same directory, so a bare filename
  // is enough and keeps the built pages portable.
  return to === 'index' ? (from === 'index' ? '#top' : './') : `${to}.html`;
}

/**
 * A link to a section of the landing page.
 *
 * On the landing page itself that is a bare `#id`. Concatenating rel()'s
 * output instead produced `#top#features`, which is not an anchor, does not
 * match anything, and quietly does nothing when clicked.
 */
export function anchor(lang, from, id) {
  return from === 'index' ? `#${id}` : `./#${id}`;
}

function head({ lang, page, t, langs, strings, assets }) {
  const FONTS = FONT_PRELOADS
    .map((f) => `<link rel="preload" href="/assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`)
    .concat(`<link rel="stylesheet" href="/assets/css/fonts.css?v=${assets.fonts}">`)
    .join('\n  ');
  const url = SITE + pageUrl(lang, page);
  const title = t(`${page}.title`);
  const description = t(`${page}.description`);

  const alternates = langs
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${pageUrl(l, page)}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${SITE}${pageUrl('en', page)}">`)
    .join('\n  ');

  // Told to Google as an application rather than an article: it is what makes
  // the store rating and the platform show up in a result.
  const jsonLd = page === 'index' ? `
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Afinora',
    applicationCategory: 'MusicApplication',
    operatingSystem: 'Android, iOS',
    description,
    url: SITE + '/',
    inLanguage: langs,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: t('index.pricing.freeBody'),
    },
    author: { '@type': 'Organization', name: 'Afinora', url: SITE + '/' },
  })}</script>` : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  ${alternates}
  <link rel="icon" href="/brand/play-icon-512.png" type="image/png">
  <link rel="apple-touch-icon" href="/brand/play-icon-512.png">
  <meta name="theme-color" content="#050505">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Afinora">
  <meta property="og:locale" content="${lang}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/brand/play-feature-graphic.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/brand/play-feature-graphic.png">
  ${FONTS}
  <link rel="stylesheet" href="/assets/css/site.css?v=${assets.css}">${jsonLd}
  <script>window.AFINORA_I18N=${JSON.stringify(strings)};</script>
  ${redirectScript(langs)}
</head>`;
}

function header({ lang, page, t, langs, langNames }) {
  const others = langs
    .map((l) => (l === lang
      ? `<span class="current">${esc(langNames[l])}</span>`
      : `<a href="${chosenLangUrl(l, page)}" hreflang="${l}" lang="${l}">${esc(langNames[l])}</a>`))
    .join('\n        ');

  return `<header class="site-header">
  <div class="inner">
    <a class="brand" href="${rel(lang, page, 'index')}">
      ${MARK}
      <span class="name">Afinora</span>
    </a>
    <div class="header-right">
      <details class="lang">
        <summary aria-label="${esc(t('nav.language'))}">${lang.toUpperCase()} <span aria-hidden="true">▾</span></summary>
        <div class="lang-panel">
        ${others}
        </div>
      </details>
      <a class="btn" href="${anchor(lang, page, 'download')}">${esc(t('nav.download'))}</a>
    </div>
  </div>
</header>`;
}

function footer({ lang, page, t, langs, langNames }) {
  const instruments = t('footer.seo');
  const otherLangs = langs
    .filter((l) => l !== lang)
    .map((l) => `<li><a href="${chosenLangUrl(l, page)}" hreflang="${l}" lang="${l}">${esc(langNames[l])}</a></li>`)
    .join('\n          ');

  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="name">Afinora</div>
        <p>${esc(t('footer.tagline'))}</p>
      </div>
      <div>
        <h4>${esc(t('footer.appHeading'))}</h4>
        <ul>
          <li><a href="${anchor(lang, page, 'features')}">${esc(t('nav.technique'))}</a></li>
          <li><a href="${anchor(lang, page, 'tuner')}">${esc(t('nav.tuner'))}</a></li>
          <li><a href="${anchor(lang, page, 'metronome')}">${esc(t('nav.metronome'))}</a></li>
          <li><a href="${anchor(lang, page, 'scales')}">${esc(t('nav.scales'))}</a></li>
          <li><a href="${anchor(lang, page, 'studio')}">${esc(t('nav.studio'))}</a></li>
          <li><a href="${anchor(lang, page, 'how-it-listens')}">${esc(t('nav.howItListens'))}</a></li>
        </ul>
      </div>
      <div>
        <h4>${esc(t('footer.instrumentsHeading'))}</h4>
        <ul>
          ${instruments.map((s) => `<li><a href="${anchor(lang, page, 'tuner')}">${esc(s)}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h4>${esc(t('footer.helpHeading'))}</h4>
        <ul>
          <li><a href="${rel(lang, page, 'support')}">${esc(t('nav.support'))}</a></li>
          <li><a href="${rel(lang, page, 'privacy')}">${esc(t('nav.privacy'))}</a></li>
          ${otherLangs}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Afinora · afinora.app</span>
      <span>${esc(t('footer.made'))}</span>
    </div>
  </div>
</footer>`;
}

/** Wrap a page body in the shell. */
export function page(ctx, main) {
  return `${head(ctx)}
<body id="top">
<a class="skip" href="#main">${esc(ctx.t('nav.skip'))}</a>
${header(ctx)}
<main id="main">
${main}
</main>
${footer(ctx)}
<script src="/assets/js/afinora.js?v=${ctx.assets.js}" defer></script>
</body>
</html>
`;
}
