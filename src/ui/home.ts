// 홈. 연습 자판 고르기, 이어서 하기, 바로 가기, 최근 기록.

import type { Lang, Settings } from '../core/settings';
import { lastStageDone, loadHistory } from '../core/store';
import { STAGES } from '../data/stages';
import { stageName, t, type I18nKey } from '../i18n';
import { esc, fmtDate, h, type View } from './common';

export function renderHome(opts: { settings: Settings; user: string; onLang(lang: Lang): void; go(hash: string): void }): View {
  const { settings, user } = opts;
  const lang = settings.lang;
  const nextPlace = Math.min(10, lastStageDone(lang, 'place') + 1);
  const nextWord = Math.min(10, lastStageDone(lang, 'word') + 1);
  const recent = loadHistory().filter((r) => r.lang === lang).slice(-6).reverse();

  const el = h('section', 'home');
  el.innerHTML = `
    <div class="hero">
      <p class="welcome">${esc(t('home.welcome', { name: user }))}</p>
      <div class="seg big" role="group" aria-label="${t('home.practiceLang')}">
        <button class="seg-btn ${lang === 'ko' ? 'on' : ''}" data-lang="ko">${t('common.lang.ko')}</button>
        <button class="seg-btn ${lang === 'en' ? 'on' : ''}" data-lang="en">${t('common.lang.en')}</button>
      </div>
    </div>
    <h3 class="section-title">${t('home.continue')}</h3>
    <div class="cards two">
      <button class="big-card" data-go="#/place/${nextPlace}"><span class="big-card-title">${t('menu.place')} ${nextPlace}</span><span class="muted">${esc(stageName(lang, nextPlace))} ${t('stage.drill')}</span></button>
      <button class="big-card" data-go="#/words/${nextWord}"><span class="big-card-title">${t('menu.words')} ${nextWord}</span><span class="muted">${esc(stageName(lang, nextWord))}</span></button>
    </div>
    <h3 class="section-title">${t('home.quick')}</h3>
    <div class="cards four">
      <button class="big-card" data-go="#/short"><span class="big-card-title">${t('menu.sent.short')}</span></button>
      <button class="big-card" data-go="#/long"><span class="big-card-title">${t('menu.sent.long')}</span></button>
      <button class="big-card" data-go="#/venice"><span class="big-card-title">${t('menu.game.venice')}</span></button>
      <button class="big-card" data-go="#/puzzle"><span class="big-card-title">${t('menu.game.puzzle')}</span></button>
    </div>
    <h3 class="section-title">${t('home.recent')}</h3>
    ${
      recent.length
        ? `<table class="board"><tbody>${recent
            .map(
              (r) =>
                `<tr><td>${fmtDate(r.ts)}</td><td>${t(`stats.mode.${r.mode}` as I18nKey)}${r.key ? ` ${r.key}` : ''}${r.title ? ` · ${esc(r.title)}` : ''}</td><td>${r.kpm} ${t('common.speedUnit')}</td><td>${r.accuracy}%</td>${r.score !== undefined ? `<td>${r.score} ${t('common.score')}</td>` : '<td></td>'}</tr>`,
            )
            .join('')}</tbody></table>`
        : `<p class="muted">${t('common.noRecord')}</p>`
    }
    <p class="muted stages-row">${STAGES[lang].map((s) => `<a href="#/place/${s.id}">${s.id}</a>`).join(' ')}</p>
  `;
  el.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => b.addEventListener('click', () => opts.onLang(b.dataset.lang as Lang)));
  el.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => b.addEventListener('click', () => opts.go(b.dataset.go!)));
  return { el, destroy() {} };
}
