/*
 * Support / FAQ.
 *
 * This page is one of the two the stores require, and it is the one a reviewer
 * opens when something in the app does not behave. Everything here is a real
 * answer to a real failure, not a contact form.
 */

import { esc, page, rel, CONTACT } from '../layout.mjs';

export default function support(ctx) {
  const { t, lang } = ctx;

  const questions = t('support.questions').map((q) => {
    const list = q.list
      ? `<ul>${q.list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      : '';
    const body = q.body ? `<p>${esc(q.body)}</p>` : '';
    // The electric-guitar question gets the amber callout: it is the one users
    // actually hit, and the answer is a hardware requirement rather than a bug.
    const cls = q.callout ? 'qa callout' : 'qa';
    return `<div class="${cls}">
      <h2>${esc(q.heading)}</h2>
      ${body}
      ${list}
    </div>`;
  }).join('\n    ');

  const main = `
<section>
  <div class="wrap doc">
    <p class="eyebrow">${esc(t('nav.support'))}</p>
    <h1 style="margin-top:14px">${esc(t('support.heading'))}</h1>
    <p class="lead" style="margin-top:20px">${esc(t('support.intro'))}</p>
  </div>
</section>

<section style="padding-top:0">
  <div class="wrap doc">
    ${questions}
  </div>
</section>

<section class="contact-band" style="padding-top:40px">
  <div class="wrap doc">
    <h2 class="sub-h2">${esc(t('support.contactHeading'))}</h2>
    <p class="lead" style="margin-top:14px">${esc(t('support.contactBody'))}</p>
    <a class="btn" href="mailto:${CONTACT}">${CONTACT}</a>
  </div>
</section>

<section>
  <div class="wrap doc">
    <div class="page-nav">
      <a href="${rel(lang, 'support', 'index')}">${esc(t('nav.home'))}</a>
      <a href="${rel(lang, 'support', 'privacy')}">${esc(t('nav.privacy'))}</a>
    </div>
  </div>
</section>
`;

  return page(ctx, main);
}
