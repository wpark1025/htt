// 타자검정 결과 목록.

import type { Lang } from '../core/settings';
import { loadHistory } from '../core/store';
import { t } from '../i18n';
import { esc, fmtDate, fmtSec, h, onKeys, type View } from './common';
import { examGrade } from './long-practice';

export function renderExamResults(opts: { lang: Lang; onExit(): void }): View {
  const rows = loadHistory()
    .filter((r) => r.mode === 'exam' && r.lang === opts.lang)
    .reverse()
    .slice(0, 30);
  const el = h('section', 'practice exam-results');
  el.innerHTML = `<header class="practice-top"><h2>${t('exam.results')}</h2></header>
    <div class="work">${
      rows.length
        ? `<table class="board"><thead><tr><th>${t('common.date')}</th><th>${t('long.name')}</th><th>${t('exam.net')}</th><th>${t('exam.wrong')}</th><th>${t('exam.elapsed')}</th><th>${t('common.speedUnit')}</th><th>${t('common.accuracy')}</th><th>${t('exam.grade')}</th></tr></thead><tbody>${rows
            .map((r) => {
              const g = examGrade(r.kpm);
              return `<tr><td>${fmtDate(r.ts)}</td><td>${esc(r.title ?? '')}</td><td>${r.score ?? 0}</td><td>${r.wrong}</td><td>${fmtSec(r.ms)}</td><td>${r.kpm}</td><td>${r.accuracy}%</td><td>${g ? t(`exam.grade.${g}`) : t('exam.grade.none')}</td></tr>`;
            })
            .join('')}</tbody></table>`
        : `<p class="muted center">${t('exam.noResults')}</p>`
    }</div>`;
  const off = onKeys(() => {}, opts.onExit);
  return { el, destroy: off };
}
