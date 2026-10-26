// 낱말익힘. 그 단계까지 배운 글쇠로만 만든 낱말을 줄 단위로 받아쓴다.

import { findKey, FINGER_OF, MODIFIER_CODES, shiftCodeFor, type Layout } from '../core/keyboard';
import type { Lang, Settings } from '../core/settings';
import { groupLines, pickStageWords } from '../core/stage-words';
import { appendHistory, bestFor, KeySampler, mergeKeyStats } from '../core/store';
import { learnedChars } from '../data/stages';
import { stageName, t } from '../i18n';
import { accuracyOf, esc, gauge, h, kpmOf, onKeys, play, resultCard, type View } from './common';
import { renderFingers, renderKeyboard, type FingerView, type KeyboardView } from './keyboard';
import { lineTyper, type LineTyper } from './line-typer';

export function renderWordPractice(opts: {
  stage: number;
  lang: Lang;
  layout: Layout;
  settings: Settings;
  onExit(): void;
  onNext(): void;
  onRetry(): void;
}): View {
  const { stage, lang, layout, settings } = opts;
  const words = pickStageWords(lang, layout, stage, settings.wordCount);
  const lines = groupLines(words, lang === 'ko' ? 24 : 36);
  const sampler = new KeySampler();
  const best = bestFor(lang, 'word', stage)?.kpm ?? 0;
  let li = 0;
  let correct = 0;
  let wrong = 0;
  let startedAt = 0;
  let finished = false;
  const missByLabel = new Map<string, number>();

  const learned = [...learnedChars(lang, layout, stage)].filter((c) => c !== ' ');
  const el = h('section', 'practice words');
  el.innerHTML = `
    <header class="practice-top">
      <h2>${esc(t('words.title', { stage: stageName(lang, stage) }))}</h2>
      <div class="learned">${t('words.learned')}: ${learned.map((c) => `<kbd>${esc(c)}</kbd>`).join('')}</div>
      <div class="stats"><span><b data-stat="progress">0</b> / ${words.length}</span></div>
    </header>
    <div class="work"><div class="line-stack"></div></div>
  `;
  const stack = el.querySelector<HTMLElement>('.line-stack')!;
  const g = gauge();
  el.querySelector('.work')!.appendChild(g.el);
  let kb: KeyboardView | null = null;
  let fingers: FingerView | null = null;
  if (settings.showKeyboard) {
    kb = renderKeyboard(layout);
    fingers = renderFingers();
    el.append(kb.el, fingers.el);
  }
  const progEl = el.querySelector<HTMLElement>('[data-stat="progress"]')!;

  let typer: LineTyper | null = null;
  let wordsDone = 0;
  const refresh = () => {
    const ms = startedAt ? Date.now() - startedAt : 0;
    g.set(best, kpmOf(correct, ms), accuracyOf(correct, wrong));
    progEl.textContent = String(wordsDone);
    const ex = typer?.expected;
    const key = ex ? findKey(layout, ex) : null;
    kb?.setTarget(key?.code ?? null, key?.shift ? shiftCodeFor(key.code) : null);
    fingers?.set(key ? FINGER_OF[key.code] ?? null : null);
  };

  function nextLine(): void {
    if (li >= lines.length) {
      finish();
      return;
    }
    const text = lines[li];
    typer = lineTyper({
      text,
      lang,
      layout,
      onStroke(expected, ok) {
        sampler.record(expected, ok);
        sampler.mark();
        if (ok) correct++;
        else {
          wrong++;
          missByLabel.set(expected, (missByLabel.get(expected) ?? 0) + 1);
        }
        play(settings.sound, ok ? 'hit' : 'miss');
        refresh();
      },
      onComplete() {
        wordsDone += text.split(' ').length;
        li++;
        play(settings.sound, 'hit');
        setTimeout(() => {
          if (!finished) nextLine();
        }, 250);
      },
    });
    stack.replaceChildren(typer.el);
    typer.setActive(true);
    sampler.mark();
    refresh();
  }

  function finish(): void {
    finished = true;
    const ms = Math.max(1, Date.now() - startedAt);
    const accuracy = accuracyOf(correct, wrong);
    const kpm = kpmOf(correct, ms);
    appendHistory({ lang, mode: 'word', key: stage, count: words.length, correct, wrong, ms, kpm, accuracy });
    mergeKeyStats(lang, sampler.samples);
    play(settings.sound, 'done');
    kb?.setTarget(null);
    fingers?.set(null);
    const worst = [...missByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    el.querySelector('.work')!.replaceWith(
      resultCard({
        accuracy,
        kpm,
        ms,
        missed: worst,
        extra: [{ big: String(words.length), label: t('common.words') }],
        buttons: [
          { label: t('common.retry'), onClick: opts.onRetry },
          ...(stage < 10 ? [{ label: t('result.nextStage'), primary: true, onClick: opts.onNext }] : []),
          { label: t('common.toMenu'), onClick: opts.onExit },
        ],
      }),
    );
  }

  const off = onKeys((e) => {
    if (finished || !typer) return;
    if (e.code === 'Enter') {
      // 줄을 건너뛰면 남은 키는 틀린 것으로
      e.preventDefault();
      if (!typer.done) {
        wrong += typer.remaining;
        wordsDone += lines[li].split(' ').length;
        li++;
        nextLine();
      }
      return;
    }
    if (MODIFIER_CODES.has(e.code) && e.code !== 'Backspace') return;
    if (!startedAt) startedAt = Date.now();
    if (typer.handle(e)) e.preventDefault();
  }, opts.onExit);

  nextLine();
  return { el, destroy: off };
}
