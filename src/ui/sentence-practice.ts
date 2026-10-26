// 단문 연습. 속담을 한 줄씩 받아쓴다. 틀린 자리엔 빨간 화살표.

import { MODIFIER_CODES, type Layout } from '../core/keyboard';
import type { Lang, Settings } from '../core/settings';
import { appendHistory, bestFor, KeySampler, mergeKeyStats } from '../core/store';
import { EN_SENTENCES } from '../data/en/sentences';
import { KO_SENTENCES } from '../data/ko/sentences';
import { t } from '../i18n';
import { accuracyOf, confirmLeave, gauge, h, kpmOf, onKeys, play, resultCard, type View } from './common';
import { lineTyper, type LineTyper } from './line-typer';

const SENTENCES: Record<Lang, string[]> = { ko: KO_SENTENCES, en: EN_SENTENCES };
const PER_ROUND = 10;

export function renderSentencePractice(opts: {
  lang: Lang;
  layout: Layout;
  settings: Settings;
  onExit(): void;
  onRetry(): void;
}): View {
  const { lang, layout, settings } = opts;
  const pool = [...SENTENCES[lang]].sort(() => Math.random() - 0.5).slice(0, PER_ROUND);
  const sampler = new KeySampler();
  const best = bestFor(lang, 'short')?.kpm ?? 0;
  let si = 0;
  let correct = 0;
  let wrong = 0;
  let startedAt = 0;
  let finished = false;
  let leaving: View | null = null;

  const el = h('section', 'practice sentences');
  el.innerHTML = `
    <header class="practice-top">
      <h2>${t('short.title')}</h2>
      <div class="stats"><span><b data-stat="progress">0</b> / ${pool.length}</span></div>
    </header>
    <div class="work"><div class="line-stack"></div></div>
  `;
  const stack = el.querySelector<HTMLElement>('.line-stack')!;
  const g = gauge();
  el.querySelector('.work')!.appendChild(g.el);
  const progEl = el.querySelector<HTMLElement>('[data-stat="progress"]')!;
  let typer: LineTyper | null = null;

  const refresh = () => {
    const ms = startedAt ? Date.now() - startedAt : 0;
    g.set(best, kpmOf(correct, ms), accuracyOf(correct, wrong));
    progEl.textContent = String(si);
  };

  function next(): void {
    if (si >= pool.length) {
      finish();
      return;
    }
    typer = lineTyper({
      text: pool[si],
      lang,
      layout,
      onStroke(expected, ok) {
        sampler.record(expected, ok);
        sampler.mark();
        if (ok) correct++;
        else wrong++;
        play(settings.sound, ok ? 'hit' : 'miss');
        refresh();
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
    appendHistory({ lang, mode: 'short', count: pool.length, correct, wrong, ms, kpm, accuracy });
    mergeKeyStats(lang, sampler.samples);
    play(settings.sound, 'done');
    el.querySelector('.work')!.replaceWith(
      resultCard({
        accuracy,
        kpm,
        ms,
        buttons: [
          { label: t('common.retry'), primary: true, onClick: opts.onRetry },
          { label: t('common.toMenu'), onClick: opts.onExit },
        ],
      }),
    );
  }

  const off = onKeys(
    (e) => {
      if (finished || !typer || leaving) return;
      if (e.code === 'Enter') {
        e.preventDefault();
        if (!typer.done) wrong += typer.remaining;
        si++;
        next();
        return;
      }
      if (MODIFIER_CODES.has(e.code) && e.code !== 'Backspace') return;
      if (!startedAt) startedAt = Date.now();
      if (typer.handle(e)) e.preventDefault();
    },
    () => {
      if (finished) return opts.onExit();
      if (leaving) return;
      leaving = confirmLeave(
        () => {
          leaving?.destroy();
          leaving?.el.remove();
          leaving = null;
        },
        () => opts.onExit(),
      );
      el.appendChild(leaving.el);
    },
  );

  next();
  return {
    el,
    destroy() {
      off();
      leaving?.destroy();
    },
  };
}
