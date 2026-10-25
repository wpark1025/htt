// 낱말 연습 화면. 수준에 맞는 낱말을 하나씩 보여주고 키 단위로 채점한다.
// 틀린 키는 넘어가지 않으므로 Backspace가 필요 없다. 한글은 오토마타로 조합해 보여준다.

import { charForEvent, findKey, MODIFIER_CODES, shiftCodeFor, type Layout } from '../core/keyboard';
import { appendHistory, type Lang, type Settings } from '../core/settings';
import { sfx } from '../core/sound';
import { createTyper } from '../core/typer';
import { strokesOf, type WordInfo } from '../core/words';
import type { WordLevel } from '../data/levels';
import { renderFingerLegend, renderKeyboard, type KeyboardView } from './keyboard';
import type { PracticeHandle } from './place-practice';

export function renderWordPractice(opts: {
  lang: Lang;
  layout: Layout;
  level: WordLevel;
  words: WordInfo[];
  settings: Settings;
  onExit(): void;
  onRetry(): void;
  onNext(): void;
}): PracticeHandle {
  const { lang, layout, level, words, settings } = opts;
  let wi = 0; // 낱말 번호
  let ki = 0; // 낱말 안에서 누른 키 수
  let correct = 0;
  let wrong = 0;
  let startedAt = 0;
  let finished = false;
  const typer = createTyper(lang);
  const missByLabel = new Map<string, number>();

  const el = document.createElement('section');
  el.className = 'practice';
  el.innerHTML = `
    <header class="practice-top">
      <button class="btn btn-ghost" data-act="exit">← 돌아가기</button>
      <h2>낱말 연습 · 수준 ${level.id} ${level.name[lang]}</h2>
      <div class="stats">
        <span><b data-stat="progress">0</b> / ${words.length}</span>
        <span>정확도 <b data-stat="acc">100</b>%</span>
      </div>
    </header>
    <div class="target-area word-area">
      <div class="word-target" aria-live="polite"></div>
      <div class="word-typed"><span class="word-typed-text"></span><span class="caret"></span></div>
      <div class="target-next word-next"></div>
    </div>
  `;

  let kb: KeyboardView | null = null;
  if (settings.showKeyboard) {
    kb = renderKeyboard(layout);
    el.appendChild(kb.el);
    el.appendChild(renderFingerLegend());
  }

  const targetEl = el.querySelector<HTMLElement>('.word-target')!;
  const typedEl = el.querySelector<HTMLElement>('.word-typed')!;
  const typedText = el.querySelector<HTMLElement>('.word-typed-text')!;
  const nextEl = el.querySelector<HTMLElement>('.word-next')!;
  const progEl = el.querySelector<HTMLElement>('[data-stat="progress"]')!;
  const accEl = el.querySelector<HTMLElement>('[data-stat="acc"]')!;

  el.querySelector('[data-act="exit"]')!.addEventListener('click', () => opts.onExit());

  /** 글자별 누적 키 수: 글자 i가 끝나는 키 위치 */
  function charEnds(w: WordInfo): number[] {
    let acc = 0;
    return [...w.w].map((ch) => (acc += strokesOf(ch, lang).length));
  }

  function show(): void {
    const w = words[wi];
    if (!w) return;
    const ends = charEnds(w);
    targetEl.innerHTML = [...w.w]
      .map((ch, i) => {
        const start = i === 0 ? 0 : ends[i - 1];
        const cls = ki >= ends[i] ? 'done' : ki >= start ? 'cur' : '';
        return `<span class="${cls}">${ch}</span>`;
      })
      .join('');
    typedText.textContent = typer.text;
    nextEl.innerHTML = words
      .slice(wi + 1, wi + 4)
      .map((n) => `<span>${n.w}</span>`)
      .join('');
    const expected = w.strokes[ki];
    const key = expected ? findKey(layout, expected) : null;
    kb?.setTarget(key?.code ?? null, key?.shift ? shiftCodeFor(key.code) : null);
    progEl.textContent = String(wi);
    const total = correct + wrong;
    accEl.textContent = total ? String(Math.round((correct / total) * 100)) : '100';
  }

  function finish(): void {
    finished = true;
    const ms = Math.max(1, Date.now() - startedAt);
    const total = correct + wrong;
    const accuracy = total ? Math.round((correct / total) * 1000) / 10 : 100;
    const kpm = Math.round((correct / ms) * 60000);
    appendHistory({
      ts: Date.now(),
      lang,
      mode: 'word',
      level: level.id,
      count: words.length,
      correct,
      wrong,
      ms,
      kpm,
      accuracy,
    });
    if (settings.sound) sfx.done();
    kb?.setTarget(null);

    const worst = [...missByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const result = document.createElement('div');
    result.className = 'result';
    result.innerHTML = `
      <h3>${accuracy >= 95 ? '아주 잘했어요!' : accuracy >= 80 ? '잘했어요!' : '조금 더 연습해요'}</h3>
      <div class="result-grid">
        <div><span class="big">${accuracy}%</span><span>정확도</span></div>
        <div><span class="big">${kpm}</span><span>타/분</span></div>
        <div><span class="big">${Math.round(ms / 1000)}초</span><span>낱말 ${words.length}개</span></div>
      </div>
      ${
        worst.length
          ? `<p class="muted">자주 틀린 글자: ${worst.map(([l, n]) => `<b>${l}</b> ${n}번`).join(', ')}</p>`
          : '<p class="muted">한 번도 틀리지 않았어요.</p>'
      }
      <div class="result-actions">
        <button class="btn" data-act="retry">다시 하기</button>
        ${level.id < 5 ? '<button class="btn btn-primary" data-act="next">다음 수준 →</button>' : ''}
        <button class="btn btn-ghost" data-act="exit">처음으로</button>
      </div>
    `;
    result.querySelector('[data-act="retry"]')!.addEventListener('click', () => opts.onRetry());
    result.querySelector('[data-act="next"]')?.addEventListener('click', () => opts.onNext());
    result.querySelector('[data-act="exit"]')!.addEventListener('click', () => opts.onExit());
    el.querySelector('.target-area')!.replaceWith(result);
    progEl.textContent = String(words.length);
  }

  function shake(): void {
    typedEl.classList.remove('shake');
    void typedEl.offsetWidth;
    typedEl.classList.add('shake');
  }

  function onKey(e: KeyboardEvent): void {
    if (finished) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;
    if (!e.code) return;
    if (e.code === 'Escape') {
      opts.onExit();
      return;
    }
    if (MODIFIER_CODES.has(e.code)) return;
    const ch = charForEvent(layout, e);
    if (ch === null) return;
    e.preventDefault();

    const w = words[wi];
    const expected = w.strokes[ki];
    // 낱말 사이에 습관적으로 누르는 Space는 틀림으로 세지 않는다
    if (ch === ' ' && expected !== ' ') return;
    if (!startedAt) startedAt = Date.now();

    const key = findKey(layout, expected);
    const ok = ch === expected;
    kb?.flash(e.code, ok);
    if (settings.sound) (ok ? sfx.hit : sfx.miss)();

    if (ok) {
      correct++;
      ki++;
      typer.feed(ch);
      if (ki >= w.strokes.length) {
        wi++;
        ki = 0;
        typer.reset();
        if (wi >= words.length) {
          finish();
          return;
        }
      }
      show();
    } else {
      wrong++;
      missByLabel.set(expected, (missByLabel.get(expected) ?? 0) + 1);
      if (key && key.code !== e.code) kb?.setTarget(key.code, key.shift ? shiftCodeFor(key.code) : null);
      shake();
      show();
    }
  }

  window.addEventListener('keydown', onKey);
  show();

  return {
    el,
    destroy() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
