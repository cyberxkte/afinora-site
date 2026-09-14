/*
 * The landing page.
 *
 * One template for all nine languages: everything a reader sees comes from the
 * locale file, and every app mockup is an empty <div data-mock="..."> that
 * afinora.js fills in and animates.
 */

import { esc, page, rel, PLAY_URL, APPLE_URL, MARK } from '../layout.mjs';

/*
 * The two store glyphs.
 *
 * Both are trademarks, used here to say where the app can be had — which is
 * what they are for. Apple's and Google's brand guidelines would rather you
 * used their own ready-made badges; those are images in their own styling and
 * would sit oddly against these buttons, so the glyph goes inside the site's
 * button instead, the way most product sites do it. If cast-iron compliance
 * ever matters more than the look, swap in the official badge images.
 */
/*
 * Play's glyph in its own four colours, which need a dark ground to work.
 *
 * On the mint button they had nowhere to sit: the glyph's green vanished into
 * the background and the blue and yellow fought it. Both buttons now share the
 * App Store button's dark ground, where all four colours read cleanly and the
 * two marks look like a pair rather than two pieces from different places.
 */
const PLAY_GLYPH = `<svg class="store-glyph" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <path fill="#00C3FF" d="M47.6 1.2C41.7 7.4 38.2 17.1 38.2 29.6v452.8c0 12.5 3.5 22.2 9.4 28.4l1.5 1.5 253.7-253.7v-6L49.1-.3z"/>
      <path fill="#FFCE00" d="M387 341.3l-84.6-84.7v-6l84.7-84.7 1.9 1.1 100.3 57c28.6 16.3 28.6 42.9 0 59.2l-100.3 57z"/>
      <path fill="#FF3A44" d="M388.9 340.1L302.4 253.6 47.6 508.4c9.4 10 25 11.2 42.6 1.2z"/>
      <path fill="#00D26A" d="M388.9 167.1L90.2-2.4C72.6-12.4 57-11.2 47.6-1.2l254.8 254.8z"/>
    </svg>`;

const APPLE_GLYPH = `<svg class="store-glyph" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>`;

/*
 * Store links navigate in place. They must not open a new tab.
 *
 * Asked for a phone, Apple does not answer with a web page: it answers with a
 * redirect to itms-appss://, the scheme that opens the App Store app. In a tab
 * the browser has just opened for it, that hands the visitor a blank tab while
 * the store opens behind it, and the button reads as broken. Google Play does
 * the same with market://.
 *
 * Navigating in place lets the phone hand the link to the store cleanly, and
 * the back gesture returns to this page — which is what a new tab was meant to
 * protect in the first place.
 *
 * `noopener` stays: it costs nothing and still applies if a browser opens one
 * of these in a tab of its own (a middle click, or Cmd held down).
 */
/*
 * The ten instruments, drawn.
 *
 * Strokes rather than fills so they inherit the hover colour, and all in one
 * 48-unit box at their real size relative to each other — a ukulele small, a
 * cello filling the frame. That proportion says more than a caption can, and
 * it is the honest difference between shapes that would otherwise be three
 * near-identical waisted outlines.
 *
 * Same order as instruments.list in every locale.
 */
const INSTRUMENT_SHAPES = [
  `<path d="M20 25.5c0-3.4 2-5.6 4.5-5.6s4.5 2.2 4.5 5.6c0 2-1.1 3.2-1.1 4.6 0 1.6 1.6 2.9 1.6 5.4 0 3.6-2.2 6.2-5 6.2s-5-2.6-5-6.2c0-2.5 1.6-3.8 1.6-5.4 0-1.4-1.1-2.6-1.1-4.6Z"/><circle cx="24.5" cy="33.2" r="2.1"/><path d="M24.5 19.9V7.5"/><path d="M22.7 7.5h3.6v-2h-3.6z"/>`,
  `<path d="M20 25.5c0-3.4 2-5.6 4.5-5.6s4.5 2.2 4.5 5.6c0 2-1.1 3.2-1.1 4.6 0 1.6 1.6 2.9 1.6 5.4 0 3.6-2.2 6.2-5 6.2s-5-2.6-5-6.2c0-2.5 1.6-3.8 1.6-5.4 0-1.4-1.1-2.6-1.1-4.6Z"/><circle cx="24.5" cy="33.2" r="2.1"/><path d="M24.5 19.9V6"/><path d="M22.4 6h4.2v-2.4h-4.2z"/>`,
  `<path d="M19.4 30.4c0-2.6 1.4-4.4 3.3-4.4 1 0 1.5.5 1.8 1.4.3-.9.8-1.4 1.8-1.4 1.9 0 3.3 1.8 3.3 4.4 0 4-1.9 10.6-5.1 10.6s-5.1-6.6-5.1-10.6Z"/><path d="M24.5 26V4.5"/><path d="M22.4 4.5h4.2V2h-4.2z"/>`,
  `<path d="M20.9 30.6c0-2.3 1.6-3.8 3.6-3.8s3.6 1.5 3.6 3.8c0 1.4-.9 2.2-.9 3.1 0 1.1 1.3 2 1.3 3.7 0 2.5-1.8 4.3-4 4.3s-4-1.8-4-4.3c0-1.7 1.3-2.6 1.3-3.7 0-.9-.9-1.7-.9-3.1Z"/><circle cx="24.5" cy="35.6" r="1.6"/><path d="M24.5 26.8V16"/><path d="M23 16h3v-1.7h-3z"/>`,
  `<path d="M21.2 29c0-2.5 1.5-4.1 3.3-4.1s3.3 1.6 3.3 4.1c0 1.5-.8 2.4-.8 3.4 0 1.2 1.2 2.2 1.2 4 0 2.7-1.7 4.7-3.7 4.7s-3.7-2-3.7-4.7c0-1.8 1.2-2.8 1.2-4 0-1-.8-1.9-.8-3.4Z"/><circle cx="24.5" cy="34.3" r="1.5"/><path d="M24.5 24.9V13.5"/><path d="M23 13.5h3v-1.8h-3z"/>`,
  `<path d="M20.6 28.4c0-2.7 1.7-4.5 3.9-4.5s3.9 1.8 3.9 4.5c0 1.6-1 2.6-1 3.7 0 1.3 1.4 2.3 1.4 4.3 0 2.9-1.9 5-4.3 5s-4.3-2.1-4.3-5c0-2 1.4-3 1.4-4.3 0-1.1-1-2.1-1-3.7Z"/><path d="M22.2 30.6v3.4M26.8 30.6v3.4"/><path d="M24.5 23.9V13.8"/><path d="M24.5 13.8c-1.5 0-2.3-1-2.3-2.1 0-1 .8-1.9 1.9-1.9 1 0 1.6.7 1.6 1.5 0 .8-.6 1.3-1.3 1.3"/>`,
  `<path d="M19.8 26.9c0-3.1 2-5.2 4.7-5.2s4.7 2.1 4.7 5.2c0 1.8-1.2 3-1.2 4.2 0 1.5 1.7 2.7 1.7 5 0 3.3-2.3 5.8-5.2 5.8s-5.2-2.5-5.2-5.8c0-2.3 1.7-3.5 1.7-5 0-1.2-1.2-2.4-1.2-4.2Z"/><path d="M21.7 29.5v3.9M27.3 29.5v3.9"/><path d="M24.5 21.7V9.8"/><path d="M24.5 9.8c-1.7 0-2.6-1.1-2.6-2.4 0-1.2.9-2.2 2.2-2.2 1.2 0 1.9.8 1.9 1.7 0 .9-.7 1.5-1.5 1.5"/>`,
  `<path d="M18.4 24.3c0-3.9 2.5-6.5 6.1-6.5s6.1 2.6 6.1 6.5c0 2.3-1.6 3.8-1.6 5.3 0 1.9 2.2 3.4 2.2 6.3 0 4.2-3 7.3-6.7 7.3s-6.7-3.1-6.7-7.3c0-2.9 2.2-4.4 2.2-6.3 0-1.5-1.6-3-1.6-5.3Z"/><path d="M20.9 27.6v4.9M28.1 27.6v4.9"/><path d="M24.5 17.8V7"/><path d="M24.5 43.2V46"/>`,
  `<path d="M24.5 23.4c3.6 0 6.3 3.4 6.3 8.2 0 5.3-2.8 9.2-6.3 9.2s-6.3-3.9-6.3-9.2c0-4.8 2.7-8.2 6.3-8.2Z"/><ellipse cx="24.5" cy="32.4" rx="2.4" ry="1.7"/><path d="M24.5 23.4V13"/><path d="M22.6 13h3.8v-2.2h-3.8z"/>`,
  `<circle cx="24.5" cy="33" r="7.4"/><circle cx="24.5" cy="33" r="5"/><path d="M24.5 25.6V11"/><path d="M22.8 11h3.4V9h-3.4z"/>`,
];

function storeButtons(t, className = '') {
  return `<div class="store-row${className ? ' ' + className : ''}">
      <a class="store-btn play" href="${PLAY_URL}" rel="noopener noreferrer">
        ${PLAY_GLYPH}
        <span class="store-lines">
          <span class="top">${esc(t('hero.getItOn'))}</span>
          <span class="name">Google Play</span>
        </span>
      </a>
      <a class="store-btn apple" href="${APPLE_URL}" rel="noopener noreferrer">
        ${APPLE_GLYPH}
        <span class="store-lines">
          <span class="top">${esc(t('hero.downloadOn'))}</span>
          <span class="name">App Store</span>
        </span>
      </a>
    </div>`;
}

/**
 * A feature block: copy on one side, a live mockup on the other.
 *
 * `mirrored` puts the phone on the left on a wide screen. It is done with
 * direction in CSS rather than order, so the text still comes first once the
 * grid collapses to a single column.
 */
function block({ id, eyebrow, heading, body, mock, mirrored, phoneClass = '' }) {
  return `<div class="block${mirrored ? ' mirrored' : ''}" id="${id}">
      <div class="block-copy">
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h2 class="block-h2">${esc(heading)}</h2>
        <p class="lead">${esc(body)}</p>
      </div>
      <div>
        <div class="phone phone-sm${phoneClass ? ' ' + phoneClass : ''}">
          <div class="screen" data-mock="${mock}"></div>
        </div>
      </div>
    </div>`;
}

export default function landing(ctx) {
  const { t, lang } = ctx;
  const supportHref = rel(lang, 'index', 'support');
  const privacyHref = rel(lang, 'index', 'privacy');

  const main = `
<section class="hero">
  <div class="hero-scrim"></div>
  <div class="wrap">
    <div class="hero-split">
      <div class="hero-claim">
        <p class="eyebrow">${esc(t('hero.eyebrow'))}</p>
        <h1>${esc(t('hero.heading'))}</h1>
      </div>
      <div class="hero-detail">
        <p class="lead">${esc(t('hero.body'))}</p>
        ${storeButtons(t)}
        <p class="fine">${esc(t('hero.fine'))}</p>
      </div>
    </div>

    <div class="highway-card">
      <div data-mock="highway"></div>
      <div class="legend">
        <div><span class="dot" style="background:#5ee7f0"></span>${esc(t('technique.legendPerfect'))}</div>
        <div><span class="dot" style="background:#8fbf5a"></span>${esc(t('technique.legendHit'))}</div>
        <div><span class="dot" style="background:#e0554a"></span>${esc(t('technique.legendMiss'))}</div>
      </div>
    </div>
  </div>
</section>

<section class="technique" id="features">
  <div class="wrap">
    <p class="eyebrow">${esc(t('technique.eyebrow'))}</p>
    <h2 style="margin-top:14px">${esc(t('technique.heading'))}</h2>
    <p class="lead" style="margin-top:20px">${esc(t('technique.body'))}</p>

    <!--
      One small demonstration per claim. Three claims and three pictures beats
      three claims and a single screenshot of something else.
    -->
    <div class="tri-cards">
      ${t('technique.points').map((p, i) => `<div class="tri-card">
        <div data-mock="${['mini-exercise', 'mini-tempo', 'mini-history'][i]}"></div>
        <h3>${esc(p.heading)}</h3>
        <p class="small">${esc(p.body)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="stats">
  <div class="wrap">
    <div class="grid">
      ${t('stats').map((s) => `<div class="cell">
        <div class="figure">${esc(s.figure)}</div>
        <div class="label">${esc(s.label)}</div>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="blocks">
      ${block({
        id: 'tuner',
        eyebrow: t('blocks.tuner.eyebrow'),
        heading: t('blocks.tuner.heading'),
        body: t('blocks.tuner.body'),
        // A violin here, while the hero shows a guitar: the same screen twice
        // reads as a duplicated screenshot, and a violin also demonstrates the
        // bowed-string tunings this block's copy promises.
        mock: 'tuner-violin',
        phoneClass: 'phone-violin',
      })}
      ${block({
        id: 'scales',
        eyebrow: t('blocks.scales.eyebrow'),
        heading: t('blocks.scales.heading'),
        body: t('blocks.scales.body'),
        mock: 'fretboard',
        mirrored: true,
      })}
      ${block({
        id: 'metronome',
        eyebrow: t('blocks.metronome.eyebrow'),
        heading: t('blocks.metronome.heading'),
        body: t('blocks.metronome.body'),
        mock: 'metronome',
      })}
      ${block({
        id: 'studio',
        eyebrow: t('blocks.studio.eyebrow'),
        heading: t('blocks.studio.heading'),
        body: t('blocks.studio.body'),
        mock: 'studio',
        mirrored: true,
      })}
    </div>
  </div>
</section>

<section class="listens" id="how-it-listens">
  <div class="wrap">
    <p class="eyebrow">${esc(t('listens.eyebrow'))}</p>
    <h2 class="sub-h2" style="margin-top:14px">${esc(t('listens.heading'))}</h2>
    <p class="lead" style="margin-top:16px">${esc(t('listens.body'))}</p>

    <!--
      Two cards, because there are two ways the sound gets in. What happens to
      it afterwards follows as a note: it is not a third route to choose
      between, and a third identical card said it was.
    -->
    <div class="listen-grid">
      <div class="listen-card">
        <div class="listen-figure" data-mock="listen-mic"></div>
        <div class="listen-body">
          <h3>${esc(t('listens.acoustic.heading'))}</h3>
          <p>${esc(t('listens.acoustic.body'))}</p>
        </div>
      </div>
      <div class="listen-card usb">
        <div class="listen-figure" data-mock="listen-usb"></div>
        <div class="listen-body">
          <h3>${esc(t('listens.electric.heading'))}</h3>
          <p>${esc(t('listens.electric.body'))}</p>
        </div>
      </div>
    </div>

    <div class="listen-note">
      <div class="listen-note-figure" data-mock="listen-device"></div>
      <div class="listen-note-body">
        <h3>${esc(t('listens.device.heading'))}</h3>
        <p>${esc(t('listens.device.body'))}</p>
      </div>
    </div>

    <!-- Naming the hardware is referential use, and it is only defensible with
         this attribution attached. Keep it, and keep the brand out of headings,
         images and page titles. -->
    <p class="trademark">${esc(t('listens.trademark'))}</p>
  </div>
</section>

<section id="privacy">
  <div class="wrap">
    <div class="two-col">
      <div>
        <p class="eyebrow">${esc(t('privacyTeaser.eyebrow'))}</p>
        <h2 class="sub-h2" style="margin-top:14px">${esc(t('privacyTeaser.heading'))}</h2>
      </div>
      <div>
        <p class="lead">${esc(t('privacyTeaser.body'))}</p>
        <div class="link-list">
          <a href="${privacyHref}">${esc(t('nav.privacy'))}</a>
          <a href="${supportHref}">${esc(t('privacyTeaser.supportLink'))}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="instruments" id="instruments">
  <div class="wrap">
    <h2 class="sub-h2">${esc(t('instruments.heading'))}</h2>
    <div class="inst-frieze">
      ${t('instruments.list').map((name, i) => `<div class="inst">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${INSTRUMENT_SHAPES[i]}</svg>
        <span>${esc(name)}</span>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="pricing" id="pro">
  <div class="wrap">
    <p class="eyebrow">${esc(t('pricing.eyebrow'))}</p>
    <h2 class="sub-h2" style="margin-top:14px">${esc(t('pricing.heading'))}</h2>
    <p class="lead" style="margin-top:16px">${esc(t('pricing.body'))}</p>
    <!--
      Two lists with the same four lines, so the difference between them is the
      column rather than a sentence the reader has to hold in their head.
    -->
    <div class="price-grid">
      <div class="price-card">
        <h3>${esc(t('pricing.freeHeading'))}</h3>
        <dl>
          ${t('pricing.freeItems').map((i) => `<div><dt>${esc(i.n)}</dt><dd>${esc(i.label)}</dd></div>`).join('\n          ')}
        </dl>
      </div>
      <div class="price-card pro">
        <h3>${esc(t('pricing.proHeading'))}</h3>
        <dl>
          ${t('pricing.proItems').map((i) => `<div><dt>${esc(i.n)}</dt><dd>${esc(i.label)}</dd></div>`).join('\n          ')}
        </dl>
        <!-- The price appears exactly once on the page, and near the bottom. -->
        <p class="price">${esc(t('pricing.price'))}</p>
      </div>
    </div>

    <!-- Not a third card: a card shaped like the other two would read as a
         third plan, and counting four zeros is a joke that wears out by the
         third one. -->
    <p class="never">${esc(t('pricing.neverBody'))}</p>
  </div>
</section>

<section class="download" id="download">
  <div class="wrap">
    <div class="mark">${MARK}</div>
    <h2>${esc(t('download.heading'))}</h2>
    <p class="lead">${esc(t('download.body'))}</p>
    ${storeButtons(t)}
  </div>
</section>
`;

  return page(ctx, main);
}
