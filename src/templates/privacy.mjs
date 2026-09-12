/*
 * Privacy policy.
 *
 * This is a legal document and the URL both stores have on file, so it is the
 * one page on the site that must never 404 and must never drift from the app.
 * The source of truth is docs/privacy-policy.md in the app repo; the English
 * text here is that file, section for section. Translations carry a notice
 * saying the English version governs, which is what keeps nine translations
 * from becoming nine slightly different promises.
 */

import { esc, page, rel, CONTACT } from '../layout.mjs';

export default function privacy(ctx) {
  const { t, lang } = ctx;

  const sections = t('privacy.sections').map((s) => {
    const paragraphs = (s.paragraphs || []).map((p) => `<p>${p}</p>`).join('\n      ');
    const list = s.list
      ? `<${s.ordered ? 'ol' : 'ul'}>${s.list.map((i) => `<li>${i}</li>`).join('')}</${s.ordered ? 'ol' : 'ul'}>`
      : '';
    return `<h2>${esc(s.heading)}</h2>
      ${paragraphs}
      ${list}`;
  }).join('\n      ');

  const translationNote = lang === 'en' ? '' : `
    <p class="fine" style="margin-top:28px">${esc(t('privacy.translationNote'))}</p>`;

  const main = `
<section>
  <div class="wrap doc-narrow">
    <p class="eyebrow">${esc(t('nav.privacy'))}</p>
    <h1 style="margin-top:14px">${esc(t('privacy.heading'))}</h1>
    <p class="fine" style="margin-top:16px">${esc(t('privacy.effective'))}</p>

    <div class="summary-card" style="margin-top:34px">
      <p>${esc(t('privacy.summary'))}</p>
    </div>

    <div class="legal">
      <p>${esc(t('privacy.intro'))}</p>
      ${sections}
      <h2>${esc(t('privacy.contactHeading'))}</h2>
      <p>${esc(t('privacy.contactBody'))} <a href="mailto:${CONTACT}">${CONTACT}</a></p>
    </div>
    ${translationNote}

    <div class="page-nav" style="margin-top:44px">
      <a href="${rel(lang, 'privacy', 'index')}">${esc(t('nav.home'))}</a>
      <a href="${rel(lang, 'privacy', 'support')}">${esc(t('nav.support'))}</a>
    </div>
  </div>
</section>
`;

  return page(ctx, main);
}
