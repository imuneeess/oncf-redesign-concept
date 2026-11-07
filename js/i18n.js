// Tiny i18n runtime: EN / FR / AR (RTL). Dictionary lives in i18n-data.js.
import { DICT } from './i18n-data.js';
import { STATIONS } from './live.js';

export const LANGS = ['en', 'fr', 'ar'];
const saved = localStorage.getItem('oncf-lang');
const nav = (navigator.language || 'fr').slice(0, 2);
export let lang = LANGS.includes(saved) ? saved : LANGS.includes(nav) ? nav : 'fr';

export const t = (key, vars = {}) => {
  let s = DICT[key]?.[lang] ?? DICT[key]?.en ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
};
export const station = (code) => STATIONS[code]?.[lang] ?? code;
export const isRTL = () => lang === 'ar';
export const num = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US').format(n);

function apply() {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-station]').forEach((el) => (el.textContent = station(el.dataset.station)));
  document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  const title = document.querySelector('meta[name="i18n-title"]');
  if (title) document.title = `${t(title.content)} · ONCF (${t('meta.concept')})`;
  // headlines re-rendered by innerHTML lose the word-split markup: show them directly
  document.querySelectorAll('.split[data-i18n]').forEach((el) => el.classList.add('in'));
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  lang = l;
  localStorage.setItem('oncf-lang', l);
  document.documentElement.classList.add('lang-swap');
  apply();
  setTimeout(() => document.documentElement.classList.remove('lang-swap'), 500);
}

document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
apply();
// first paint: let main.js split headlines (it runs after this module)
document.querySelectorAll('.split[data-i18n]').forEach((el) => el.classList.remove('in'));
