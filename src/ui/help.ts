// 도움말 세 쪽. 손가락 기본위치는 자판 그림에 기본 글쇠를 강조한다.

import type { Layout } from '../core/keyboard';
import { t, type I18nKey } from '../i18n';
import { esc, h, onKeys, type View } from './common';
import { renderFingerLegend, renderKeyboard } from './keyboard';

export type HelpKind = 'about' | 'fingers' | 'usage';

export function renderHelp(opts: { kind: HelpKind; layout: Layout; onExit(): void }): View {
  const el = h('section', 'practice help');
  el.innerHTML = `<header class="practice-top"><h2>${esc(t(`help.${opts.kind}.title` as I18nKey))}</h2></header><div class="work"></div>`;
  const work = el.querySelector<HTMLElement>('.work')!;
  if (opts.kind === 'fingers') {
    const kb = renderKeyboard(opts.layout);
    for (const code of ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'])
      kb.el.querySelector(`[data-code="${code}"]`)?.classList.add('home');
    work.append(kb.el, renderFingerLegend());
  }
  const p = h('div', 'prose');
  p.innerHTML = t(`help.${opts.kind}` as I18nKey)
    .split('\n\n')
    .map((para) => `<p>${esc(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
  work.appendChild(p);
  const off = onKeys(
    (e) => {
      if (e.code === 'Space' || e.code === 'Enter') opts.onExit();
    },
    opts.onExit,
  );
  return { el, destroy: off };
}
