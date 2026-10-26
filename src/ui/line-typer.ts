// 한 줄 받아쓰기 부품. 목표 줄과 친 줄을 보여주고 키 하나하나를 채점한다.
// 틀린 자리에는 원작처럼 빨간 화살표를 남긴다. 낱말익힘·단문·장문·검정이 같이 쓴다.

import { charForEvent, type Layout } from '../core/keyboard';
import type { Lang } from '../core/settings';
import { createTyper } from '../core/typer';
import { strokesOf } from '../core/words';
import { esc, h } from './common';

export interface LineTyper {
  el: HTMLElement;
  readonly done: boolean;
  readonly index: number;
  readonly strokes: string[];
  /** 아직 안 친 키 수 */
  readonly remaining: number;
  /** 다음에 쳐야 할 글자 */
  readonly expected: string | undefined;
  /** keydown을 넘긴다. 처리했으면 true. */
  handle(e: KeyboardEvent): boolean;
  setActive(on: boolean): void;
}

export function lineTyper(opts: {
  text: string;
  lang: Lang;
  layout: Layout;
  onStroke(expected: string, ok: boolean): void;
  onComplete?(): void;
}): LineTyper {
  const { text, lang, layout } = opts;
  const strokes = strokesOf(text, lang);
  const chars = [...text];
  // 글자 i가 끝나는 키 위치 (키 번호 → 글자 번호 변환용)
  const ends: number[] = [];
  let acc = 0;
  for (const ch of chars) ends.push((acc += strokesOf(ch, lang).length));
  const charAt = (k: number): number => {
    let i = 0;
    while (i < ends.length && k >= ends[i]) i++;
    return Math.min(i, chars.length - 1);
  };

  const typer = createTyper(lang);
  let index = 0;
  const errors = new Set<number>();

  const el = h('div', 'line');
  const targetEl = h('div', 'line-target');
  targetEl.innerHTML = chars.map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  const typedEl = h('div', 'line-typed');
  const typedText = h('span', 'line-typed-text');
  const caret = h('span', 'caret');
  typedEl.append(typedText, caret);
  el.append(targetEl, typedEl);
  const charEls = [...targetEl.querySelectorAll<HTMLElement>('.ch')];

  function paint(): void {
    typedText.textContent = typer.text;
    const cur = index < strokes.length ? charAt(index) : -1;
    charEls.forEach((c, i) => {
      c.classList.toggle('cur', i === cur);
      c.classList.toggle('err', errors.has(i));
      c.classList.toggle('done', cur === -1 ? true : i < cur);
    });
  }

  function complete(): void {
    paint();
    opts.onComplete?.();
  }

  paint();

  return {
    el,
    get done() {
      return index >= strokes.length;
    },
    get index() {
      return index;
    },
    get strokes() {
      return strokes;
    },
    get remaining() {
      return Math.max(0, strokes.length - index);
    },
    get expected() {
      return strokes[index];
    },
    setActive(on) {
      el.classList.toggle('active', on);
    },
    handle(e) {
      if (e.repeat && e.code !== 'Backspace') return false;
      if (e.code === 'Backspace') {
        if (index > 0) {
          index--;
          typer.backspace();
          paint();
        }
        return true;
      }
      if (index >= strokes.length) return false;
      const ch = charForEvent(layout, e);
      if (ch === null) return false;
      const expected = strokes[index];
      const ok = ch === expected;
      if (!ok) errors.add(charAt(index));
      typer.feed(ch);
      index++;
      opts.onStroke(expected, ok);
      if (index >= strokes.length) complete();
      else paint();
      return true;
    },
  };
}
