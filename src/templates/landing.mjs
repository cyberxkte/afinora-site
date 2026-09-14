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
  <div data-mock="field"></div>
  <div class="hero-scrim"></div>
  <div class="wrap">
    <div class="hero-copy">
      <p class="eyebrow">${esc(t('hero.eyebrow'))}</p>
      <h1>${esc(t('hero.heading'))}</h1>
      <p class="lead">${esc(t('hero.body'))}</p>
      ${storeButtons(t)}
      <p class="fine">${esc(t('hero.fine'))}</p>
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

    <div class="trio">
      ${t('technique.points').map((p) => `<div>
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

<section id="instruments">
  <div class="wrap">
    <h2 class="sub-h2">${esc(t('instruments.heading'))}</h2>
    <p class="lead" style="margin-top:14px">${esc(t('instruments.body'))}</p>
    <div class="pill-row">
      ${t('instruments.list').map((i) => `<span class="pill">${esc(i)}</span>`).join('\n      ')}
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
      <div class="block" id="ear-training">
        <div class="block-copy">
          <p class="eyebrow">${esc(t('blocks.ear.eyebrow'))}</p>
          <h2 class="block-h2">${esc(t('blocks.ear.heading'))}</h2>
          <p class="lead">${esc(t('blocks.ear.body'))}</p>
        </div>
        <div class="price-card">
          <h3>${esc(t('blocks.languages.heading'))}</h3>
          <p style="margin-top:10px">${esc(t('blocks.languages.body'))}</p>
        </div>
      </div>
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

<section class="pricing" id="pro">
  <div class="wrap">
    <p class="eyebrow">${esc(t('pricing.eyebrow'))}</p>
    <h2 class="sub-h2" style="margin-top:14px">${esc(t('pricing.heading'))}</h2>
    <p class="lead" style="margin-top:16px">${esc(t('pricing.body'))}</p>
    <div class="price-grid">
      <div class="price-card">
        <h3>${esc(t('pricing.freeHeading'))}</h3>
        <p>${esc(t('pricing.freeBody'))}</p>
      </div>
      <div class="price-card pro">
        <h3>${esc(t('pricing.proHeading'))}</h3>
        <p>${esc(t('pricing.proBody'))}</p>
        <!-- The price appears exactly once on the page, and near the bottom. -->
        <p class="price">${esc(t('pricing.price'))}</p>
      </div>
      <div class="price-card">
        <h3>${esc(t('pricing.neverHeading'))}</h3>
        <p>${esc(t('pricing.neverBody'))}</p>
      </div>
    </div>
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
