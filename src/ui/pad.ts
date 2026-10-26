// 연습장. 자유롭게 친다. 입력기 없이 오토마타로 한글을 조합해 보여준다.

import { charForEvent, MODIFIER_CODES, type Layout } from '../core/keyboard';
import type { Lang } from '../core/settings';
import { createTyper } from '../core/typer';
import { t } from '../i18n';
import { h, onKeys, type View } from './common';

export function renderPad(opts: { lang: Lang; layout: Layout; onExit(): void }): View {
  const { lang, layout } = opts;
  const typer = createTyper(lang);
  let lines: string[] = [];

  const el = h('section', 'practice pad');
  el.innerHTML = `
    <header class="practice-top">
      <h2>${t('pad.title')}</h2>
      <div class="stats"><button class="btn btn-ghost" data-act="clear">${t('pad.clear')}</button></div>
    </header>
    <div class="work pad-paper"><div class="pad-text"></div><span class="caret"></span></div>
  `;
  const textEl = el.querySelector<HTMLElement>('.pad-text')!;
  const paint = () => {
    textEl.textContent = [...lines, typer.text].join('\n');
  };
  el.querySelector('[data-act="clear"]')!.addEventListener('click', () => {
    lines = [];
    typer.reset();
    paint();
  });

  const off = onKeys((e) => {
    if (e.code === 'Enter') {
      lines.push(typer.text);
      typer.reset();
    } else if (e.code === 'Backspace') {
      if (typer.text) typer.backspace();
      else if (lines.length) {
        const last = lines.pop()!;
        typer.reset();
        for (const ch of last) typer.feed(ch);
      }
    } else {
      if (e.repeat || MODIFIER_CODES.has(e.code)) return;
      const ch = charForEvent(layout, e);
      if (ch === null) return;
      typer.feed(ch);
    }
    e.preventDefault();
    paint();
  }, opts.onExit);

  paint();
  return { el, destroy: off };
}
