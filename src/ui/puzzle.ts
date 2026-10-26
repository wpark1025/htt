// 낱말맞추기(십자말풀이). 화살표로 칸을 고르고 글자를 친다. 가로·세로 열쇠는 커서 칸 기준으로 보여준다.

import { toKeystrokes } from '../core/hangul';
import { charForEvent, MODIFIER_CODES, type Layout } from '../core/keyboard';
import type { Lang, Settings } from '../core/settings';
import { appendHistory } from '../core/store';
import { createTyper, type Typer } from '../core/typer';
import { EN_PUZZLES } from '../data/en/puzzles';
import { KO_PUZZLES } from '../data/ko/puzzles';
import { puzzleCells, type Puzzle, type PuzzleWord } from '../data/puzzles';
import { t } from '../i18n';
import { choiceList, dialog, esc, h, onKeys, play, type View } from './common';

export const PUZZLES: Record<Lang, Puzzle[]> = { ko: KO_PUZZLES, en: EN_PUZZLES };

export function renderPuzzleChooser(opts: { lang: Lang; onPick(id: number): void }): View {
  const list = choiceList(
    PUZZLES[opts.lang].map((p) => ({ label: `${t('venice.stageN', { n: p.id })} · ${p.title}`, value: String(p.id) })),
    (v) => opts.onPick(Number(v)),
  );
  const body = h('div');
  body.appendChild(h('p', 'muted center', t('puzzle.chooseHint')));
  body.appendChild(list.el);
  const el = h('section', 'chooser');
  el.appendChild(dialog(t('puzzle.choose'), body));
  return { el, destroy: list.destroy };
}

export function renderPuzzle(opts: {
  puzzle: Puzzle;
  lang: Lang;
  layout: Layout;
  settings: Settings;
  onExit(): void;
  onRetry(): void;
}): View {
  const { puzzle, lang, layout, settings } = opts;
  const answers = puzzleCells(puzzle);
  const values = new Map<string, string>();
  const key = (r: number, c: number) => `${r},${c}`;
  let cur = { r: puzzle.words[0].row, c: puzzle.words[0].col };
  let dir: 'across' | 'down' = puzzle.words[0].dir;
  let cellTyper: Typer = createTyper(lang);
  let solved = false;
  const startedAt = Date.now();
  let checks = 0;

  const el = h('section', 'practice puzzle');
  el.innerHTML = `
    <header class="practice-top"><h2>${t('puzzle.title')} · ${esc(puzzle.title)}</h2>
      <div class="stats"><span data-stat="left"></span></div></header>
    <div class="puzzle-wrap">
      <div class="grid" style="--n:${puzzle.size}"></div>
      <aside class="clues">
        <div class="clue"><h4>${t('puzzle.across')}</h4><p data-clue="across"></p></div>
        <div class="clue"><h4>${t('puzzle.down')}</h4><p data-clue="down"></p></div>
        <button class="btn btn-primary" data-act="check">${t('puzzle.check')} (Enter)</button>
      </aside>
    </div>
  `;
  const grid = el.querySelector<HTMLElement>('.grid')!;
  const cellEls = new Map<string, HTMLElement>();
  for (let r = 0; r < puzzle.size; r++)
    for (let c = 0; c < puzzle.size; c++) {
      const k = key(r, c);
      const cell = h('div', answers.has(k) ? 'cell' : 'cell block');
      if (answers.has(k)) {
        cell.addEventListener('click', () => {
          commitCell();
          if (cur.r === r && cur.c === c) dir = dir === 'across' ? 'down' : 'across';
          cur = { r, c };
          paint();
        });
        cellEls.set(k, cell);
      }
      grid.appendChild(cell);
    }
  const acrossEl = el.querySelector<HTMLElement>('[data-clue="across"]')!;
  const downEl = el.querySelector<HTMLElement>('[data-clue="down"]')!;
  const leftEl = el.querySelector<HTMLElement>('[data-stat="left"]')!;
  el.querySelector('[data-act="check"]')!.addEventListener('click', check);

  const wordsThrough = (r: number, c: number): PuzzleWord[] =>
    puzzle.words.filter((w) => {
      const n = [...w.answer].length;
      return w.dir === 'across' ? w.row === r && c >= w.col && c < w.col + n : w.col === c && r >= w.row && r < w.row + n;
    });
  const wordCells = (w: PuzzleWord): string[] =>
    [...w.answer].map((_, i) => (w.dir === 'across' ? key(w.row, w.col + i) : key(w.row + i, w.col)));
  const isCorrect = (w: PuzzleWord): boolean => wordCells(w).every((k) => values.get(k) === answers.get(k));

  function paint(): void {
    for (const [k, cell] of cellEls) {
      const composing = k === key(cur.r, cur.c) && cellTyper.text ? cellTyper.text : '';
      cell.textContent = composing || values.get(k) || '';
      cell.classList.toggle('cur', k === key(cur.r, cur.c));
      const inWord = wordsThrough(cur.r, cur.c).find((w) => w.dir === dir);
      cell.classList.toggle('hl', Boolean(inWord && wordCells(inWord).includes(k)));
    }
    const ws = wordsThrough(cur.r, cur.c);
    acrossEl.textContent = ws.find((w) => w.dir === 'across')?.clue ?? '—';
    downEl.textContent = ws.find((w) => w.dir === 'down')?.clue ?? '—';
    leftEl.textContent = t('puzzle.remaining', { n: puzzle.words.filter((w) => !isCorrect(w)).length });
  }

  function commitCell(): void {
    const txt = cellTyper.text;
    if (txt) values.set(key(cur.r, cur.c), [...txt][0]);
    cellTyper = createTyper(lang);
  }

  function move(dr: number, dc: number): void {
    commitCell();
    let r = cur.r + dr;
    let c = cur.c + dc;
    // 막힌 칸은 건너뛴다
    for (let g = 0; g < puzzle.size && (r >= 0 && r < puzzle.size && c >= 0 && c < puzzle.size) && !answers.has(key(r, c)); g++) {
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < puzzle.size && c >= 0 && c < puzzle.size && answers.has(key(r, c))) cur = { r, c };
    paint();
  }

  function advance(): void {
    const w = wordsThrough(cur.r, cur.c).find((x) => x.dir === dir);
    const cells = w ? wordCells(w) : [];
    const i = cells.indexOf(key(cur.r, cur.c));
    if (w && i >= 0 && i < cells.length - 1) move(dir === 'down' ? 1 : 0, dir === 'across' ? 1 : 0);
    else {
      commitCell();
      paint();
    }
  }

  function check(): void {
    commitCell();
    checks++;
    const okCells = new Set<string>();
    for (const w of puzzle.words) if (isCorrect(w)) wordCells(w).forEach((k) => okCells.add(k));
    for (const [k, cell] of cellEls) cell.classList.toggle('ok', okCells.has(k));
    paint();
    const left = puzzle.words.filter((w) => !isCorrect(w)).length;
    play(settings.sound, left ? 'miss' : 'done');
    if (!left && !solved) {
      solved = true;
      const ms = Date.now() - startedAt;
      appendHistory({ lang, mode: 'puzzle', key: puzzle.id, count: puzzle.words.length, correct: puzzle.words.length, wrong: checks - 1, ms, kpm: 0, accuracy: 100, score: Math.max(0, 1000 - (checks - 1) * 100) });
      const body = h('div', '', `<p class="center">${t('puzzle.solved')}</p>`);
      const list = choiceList(
        [
          { label: t('common.retry'), value: 'retry' },
          { label: t('common.toMenu'), value: 'menu' },
        ],
        (v) => (v === 'retry' ? opts.onRetry() : opts.onExit()),
      );
      body.appendChild(list.el);
      el.appendChild(h('div', 'overlay')).appendChild(dialog(t('puzzle.title'), body));
      endList = list;
    }
  }
  let endList: View | null = null;

  const off = onKeys((e) => {
    if (solved) return;
    if (e.code === 'ArrowLeft') {
      dir = 'across';
      move(0, -1);
    } else if (e.code === 'ArrowRight') {
      dir = 'across';
      move(0, 1);
    } else if (e.code === 'ArrowUp') {
      dir = 'down';
      move(-1, 0);
    } else if (e.code === 'ArrowDown') {
      dir = 'down';
      move(1, 0);
    } else if (e.code === 'Enter') check();
    else if (e.code === 'Backspace') {
      if (cellTyper.text) cellTyper.backspace();
      else if (values.has(key(cur.r, cur.c))) values.delete(key(cur.r, cur.c));
      else {
        move(dir === 'down' ? -1 : 0, dir === 'across' ? -1 : 0);
        values.delete(key(cur.r, cur.c));
      }
      paint();
    } else if (e.code === 'Space' || e.code === 'Tab') {
      commitCell();
      dir = dir === 'across' ? 'down' : 'across';
      paint();
    } else {
      if (e.repeat || MODIFIER_CODES.has(e.code)) return;
      const ch = charForEvent(layout, e);
      if (ch === null || ch === ' ') return;
      if (lang === 'en') {
        values.set(key(cur.r, cur.c), ch.toUpperCase());
        advance();
      } else {
        cellTyper.feed(ch);
        const txt = [...cellTyper.text];
        if (txt.length >= 2) {
          // 글자가 넘치면 앞 글자는 확정하고 나머지는 다음 칸으로
          values.set(key(cur.r, cur.c), txt[0]);
          const rest = toKeystrokes(txt.slice(1).join(''));
          cellTyper = createTyper(lang);
          advance();
          for (const j of rest) cellTyper.feed(j);
        }
        paint();
      }
    }
    e.preventDefault();
  }, opts.onExit);

  paint();
  return {
    el,
    destroy() {
      off();
      endList?.destroy();
    },
  };
}
