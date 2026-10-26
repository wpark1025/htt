// 통계: 글쇠 학습 상황(회차별 속도 그래프), 글쇠별 속도·정확도, 파일로 보내기.

import type { Lang } from '../core/settings';
import { exportAll, loadHistory, loadKeyStats, type Mode } from '../core/store';
import { t, type I18nKey } from '../i18n';
import { esc, fmtDate, h, onKeys, type View } from './common';

export type StatsKind = 'progress' | 'speed' | 'accuracy' | 'export';

function lineChart(points: number[], max: number, labels: string[]): string {
  const W = 760;
  const H = 300;
  const L = 48;
  const B = 28;
  const n = Math.max(points.length, 1);
  const x = (i: number) => L + ((W - L - 10) * (i + 0.5)) / Math.max(n, 24);
  const y = (v: number) => H - B - ((H - B - 10) * Math.min(v, max)) / max;
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => Math.round(max * f));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    ${ticks.map((v) => `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="tick">${v}</text><line x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" class="gridline"/>`).join('')}
    <path d="${path}" class="series"/>
    ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p)}" r="4" class="dot"><title>${esc(labels[i])}: ${p}</title></circle>`).join('')}
    ${points.map((_, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="tick">${i + 1}</text>`).join('')}
  </svg>`;
}

function barChart(rows: { label: string; value: number }[], max: number, unit: string): string {
  if (!rows.length) return `<p class="muted center">${t('stats.empty')}</p>`;
  return `<div class="bars">${rows
    .map(
      (r) =>
        `<div class="bar-row"><span class="bar-label">${esc(r.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, (r.value / max) * 100)}%"></div></div><span class="bar-val">${Math.round(r.value)}${unit}</span></div>`,
    )
    .join('')}</div>`;
}

export function renderStats(opts: { kind: StatsKind; lang: Lang; onExit(): void }): View {
  const { kind, lang } = opts;
  const el = h('section', 'practice stats-page');
  const title = kind === 'export' ? t('stats.export') : t(`stats.${kind}` as I18nKey);
  el.innerHTML = `<header class="practice-top"><h2>${esc(title)}</h2></header><div class="work"></div>`;
  const work = el.querySelector<HTMLElement>('.work')!;

  if (kind === 'progress') {
    const hist = loadHistory().filter((r) => r.lang === lang && r.mode !== 'venice' && r.mode !== 'puzzle');
    const last = hist.slice(-24);
    if (!last.length) work.innerHTML = `<p class="muted center">${t('stats.empty')}</p>`;
    else {
      const max = Math.max(100, Math.ceil(Math.max(...last.map((r) => r.kpm)) / 100) * 100);
      work.innerHTML =
        `<p class="muted">${t('common.speed')} (${t('common.speedUnit')}) · ${t('stats.sessions')}</p>` +
        lineChart(
          last.map((r) => r.kpm),
          max,
          last.map((r) => `${fmtDate(r.ts)} ${t(`stats.mode.${r.mode}` as I18nKey)}`),
        ) +
        `<table class="board"><thead><tr><th>#</th><th>${t('common.date')}</th><th>${t('common.kind')}</th><th>${t('common.speedUnit')}</th><th>${t('common.accuracy')}</th></tr></thead><tbody>${last
          .map((r, i) => `<tr><td>${i + 1}</td><td>${fmtDate(r.ts)}</td><td>${t(`stats.mode.${r.mode as Mode}` as I18nKey)}${r.key ? ` ${r.key}` : ''}${r.title ? ` · ${esc(r.title)}` : ''}</td><td>${r.kpm}</td><td>${r.accuracy}%</td></tr>`)
          .join('')}</tbody></table>`;
    }
  } else if (kind === 'speed' || kind === 'accuracy') {
    const ks = loadKeyStats(lang);
    const rows = Object.entries(ks)
      .filter(([ch, s]) => ch !== ' ' && s.n >= 3)
      .map(([ch, s]) => ({
        label: ch,
        value: kind === 'speed' ? (s.ok && s.ms ? 60000 / (s.ms / s.ok) : 0) : (s.ok / s.n) * 100,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    work.innerHTML = `<p class="muted">${t('stats.byKey')}</p>` + barChart(rows, kind === 'speed' ? 600 : 100, kind === 'speed' ? '' : '%');
  } else {
    work.innerHTML = `<p class="center">${t('stats.exportHint')}</p>`;
    const btn = h('button', 'btn btn-primary center', t('stats.export'));
    btn.addEventListener('click', () => {
      const blob = new Blob([exportAll()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `htt-records-${fmtDate(Date.now())}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    work.appendChild(btn);
  }

  const off = onKeys(() => {}, opts.onExit);
  return { el, destroy: off };
}
