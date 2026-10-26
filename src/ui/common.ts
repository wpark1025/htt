// 화면 공통 부품: 대화상자, 선택 목록, 속도 게이지, 결과 카드, 키 입력 도우미.

import { t } from '../i18n';
import { sfx } from '../core/sound';

export interface View {
  el: HTMLElement;
  destroy(): void;
}

export const h = (tag: string, cls = '', html = ''): HTMLElement => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
};

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const fmtSec = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const fmtDate = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 선택 목록: 위아래 화살표 + Enter, 클릭. 원작의 "위, 아래 화살표로 항목을 고른 뒤에 리턴". */
export function choiceList(
  items: { label: string; sub?: string; value: string }[],
  onPick: (value: string) => void,
  selected = 0,
): View {
  const el = h('div', 'choices');
  el.tabIndex = 0;
  let idx = selected;
  const rows = items.map((it, i) => {
    const b = h('button', 'choice', `<span>${esc(it.label)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}`);
    b.addEventListener('click', () => onPick(it.value));
    b.addEventListener('mouseenter', () => {
      idx = i;
      paint();
    });
    el.appendChild(b);
    return b;
  });
  const paint = () => rows.forEach((r, i) => r.classList.toggle('on', i === idx));
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'ArrowDown') idx = (idx + 1) % items.length;
    else if (e.code === 'ArrowUp') idx = (idx - 1 + items.length) % items.length;
    else if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      onPick(items[idx].value);
      return;
    } else return;
    e.preventDefault();
    paint();
  };
  window.addEventListener('keydown', onKey);
  paint();
  return {
    el,
    destroy() {
      window.removeEventListener('keydown', onKey);
    },
  };
}

/** 가운데 뜨는 대화상자 (원작의 제목 있는 상자). body는 아무 요소. */
export function dialog(title: string, body: HTMLElement, cls = ''): HTMLElement {
  const wrap = h('div', `dialog ${cls}`);
  wrap.appendChild(h('h3', 'dialog-title', esc(title)));
  const inner = h('div', 'dialog-body');
  inner.appendChild(body);
  wrap.appendChild(inner);
  return wrap;
}

/** 속도 게이지: 최고 속도 / 현재 속도 막대와 정확도. */
export interface Gauge {
  el: HTMLElement;
  set(best: number, current: number, accuracy: number): void;
}

export function gauge(max = 600): Gauge {
  const el = h(
    'div',
    'gauge',
    `
    <div class="gauge-head"><span>${t('common.speed')} (${t('common.speedUnit')})</span><span>${t('common.accuracy')}</span></div>
    <div class="gauge-body">
      <div class="gauge-rows">
        <div class="gauge-row"><label>${t('common.best')}</label><div class="bar"><div class="fill" data-bar="best"></div><b data-val="best">0</b></div></div>
        <div class="gauge-row"><label>${t('common.current')}</label><div class="bar"><div class="fill" data-bar="cur"></div><b data-val="cur">0</b></div></div>
      </div>
      <div class="gauge-acc"><b data-val="acc">0</b><span>%</span></div>
    </div>`,
  );
  const bestBar = el.querySelector<HTMLElement>('[data-bar="best"]')!;
  const curBar = el.querySelector<HTMLElement>('[data-bar="cur"]')!;
  const bestVal = el.querySelector<HTMLElement>('[data-val="best"]')!;
  const curVal = el.querySelector<HTMLElement>('[data-val="cur"]')!;
  const accVal = el.querySelector<HTMLElement>('[data-val="acc"]')!;
  return {
    el,
    set(best, current, accuracy) {
      bestBar.style.width = `${Math.min(100, (best / max) * 100)}%`;
      curBar.style.width = `${Math.min(100, (current / max) * 100)}%`;
      bestVal.textContent = String(Math.round(best));
      curVal.textContent = String(Math.round(current));
      accVal.textContent = String(Math.round(accuracy));
    },
  };
}

export interface Tally {
  correct: number;
  wrong: number;
  startedAt: number;
}

export const accuracyOf = (c: number, w: number): number => (c + w ? Math.round((c / (c + w)) * 1000) / 10 : 100);
export const kpmOf = (c: number, ms: number): number => (ms > 0 ? Math.round((c / ms) * 60000) : 0);

/** 결과 카드 */
export function resultCard(opts: {
  accuracy: number;
  kpm: number;
  ms: number;
  extra?: { big: string; label: string }[];
  missed?: [string, number][];
  buttons: { label: string; primary?: boolean; onClick(): void }[];
  heading?: string;
}): HTMLElement {
  const heading = opts.heading ?? (opts.accuracy >= 95 ? t('result.great') : opts.accuracy >= 80 ? t('result.good') : t('result.more'));
  const cells = [
    { big: `${opts.accuracy}%`, label: t('common.accuracy') },
    { big: String(opts.kpm), label: t('common.speedUnit') },
    { big: fmtSec(opts.ms), label: t('common.time') },
    ...(opts.extra ?? []),
  ];
  const el = h(
    'div',
    'result',
    `<h3>${esc(heading)}</h3>
     <div class="result-grid">${cells.map((c) => `<div><span class="big">${esc(c.big)}</span><span>${esc(c.label)}</span></div>`).join('')}</div>
     ${
       opts.missed
         ? opts.missed.length
           ? `<p class="muted">${t('result.missed')}: ${opts.missed.map(([l, n]) => `<b>${esc(l)}</b> ${n}`).join(', ')}</p>`
           : `<p class="muted">${t('result.noMiss')}</p>`
         : ''
     }
     <div class="result-actions"></div>`,
  );
  const actions = el.querySelector('.result-actions')!;
  for (const b of opts.buttons) {
    const btn = h('button', `btn ${b.primary ? 'btn-primary' : ''}`, esc(b.label));
    btn.addEventListener('click', b.onClick);
    actions.appendChild(btn);
  }
  return el;
}

/** ESC 처리와 반복 키 거르기를 포함한 keydown 등록. */
export function onKeys(handler: (e: KeyboardEvent) => void, onEscape?: () => void): () => void {
  const fn = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') {
      if (onEscape) {
        e.preventDefault();
        onEscape();
      }
      return;
    }
    handler(e);
  };
  window.addEventListener('keydown', fn);
  return () => window.removeEventListener('keydown', fn);
}

export function play(sound: boolean, kind: 'hit' | 'miss' | 'done'): void {
  if (sound) sfx[kind]();
}

/** 종료 전 묻기: "연습을 계속합니다 / 메뉴로 갑니다" */
export function confirmLeave(onContinue: () => void, onLeave: () => void): View {
  const list = choiceList(
    [
      { label: t('common.continue'), value: 'go' },
      { label: t('common.toMenu'), value: 'leave' },
    ],
    (v) => (v === 'go' ? onContinue() : onLeave()),
  );
  const el = h('div', 'overlay');
  el.appendChild(dialog('', list.el, 'dialog-small'));
  return { el, destroy: list.destroy };
}
