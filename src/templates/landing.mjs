/*
 * The landing page.
 *
 * One template for all nine languages: everything a reader sees comes from the
 * locale file, and every app mockup is an empty <div data-mock="..."> that
 * afinora.js fills in and animates.
 */

import { esc, page, rel, PLAY_URL, APPLE_URL, MARK } from '../layout.mjs';

function storeButtons(t, className = '') {
  return `<div class="store-row${className ? ' ' + className : ''}">
      <a class="store-btn play" href="${PLAY_URL}" rel="noopener">
        <span class="top">${esc(t('hero.getItOn'))}</span>
        <span class="name">Google Play</span>
      </a>
      <a class="store-btn apple" href="${APPLE_URL}" rel="noopener">
        <span class="top">${esc(t('hero.downloadOn'))}</span>
        <span class="name">App Store</span>
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
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">${esc(t('hero.eyebrow'))}</p>
        <h1>${esc(t('hero.heading'))}</h1>
        <p class="lead">${esc(t('hero.body'))}</p>
        ${storeButtons(t)}
        <p class="fine">${esc(t('hero.fine'))}</p>
      </div>
      <div>
        <div class="phone">
          <div class="screen" data-mock="tuner"></div>
        </div>
      </div>
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

<section class="technique" id="features">
  <div class="wrap">
    <p class="eyebrow">${esc(t('technique.eyebrow'))}</p>
    <h2 style="margin-top:14px">${esc(t('technique.heading'))}</h2>
    <p class="lead" style="margin-top:20px">${esc(t('technique.body'))}</p>

    <div class="highway-card">
      <div data-mock="highway"></div>
      <div class="legend">
        <div><span class="dot" style="background:#5ee7f0"></span>${esc(t('technique.legendPerfect'))}</div>
        <div><span class="dot" style="background:#8fbf5a"></span>${esc(t('technique.legendHit'))}</div>
        <div><span class="dot" style="background:#e0554a"></span>${esc(t('technique.legendMiss'))}</div>
      </div>
    </div>

    <div class="trio">
      ${t('technique.points').map((p) => `<div>
        <h3>${esc(p.heading)}</h3>
        <p class="small">${esc(p.body)}</p>
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
      <div class="listen-card">
        <div class="listen-figure" data-mock="listen-device"></div>
        <div class="listen-body">
          <h3>${esc(t('listens.device.heading'))}</h3>
          <p>${esc(t('listens.device.body'))}</p>
        </div>
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
