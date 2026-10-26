// 자리익힘. 단계의 글쇠를 상자에 하나씩 보여주고 물리 키를 채점한다.

import { charForEvent, FINGER_OF, MODIFIER_CODES, shiftCodeFor, type Layout } from '../core/keyboard';
import type { Lang, Settings } from '../core/settings';
import { appendHistory, KeySampler, mergeKeyStats } from '../core/store';
import { stageById, stageChars, type StageKey } from '../data/stages';
import { stageName, t } from '../i18n';
import { accuracyOf, esc, h, kpmOf, onKeys, play, resultCard, type View } from './common';
import { renderFingers, renderKeyboard } from './keyboard';

interface Target extends StageKey {
  label: string;
}

function buildTargets(lang: Lang, layout: Layout, stage: number, count: number): Target[] {
  const toTarget = (k: StageKey): Target | null => {
    const kc = layout.keys[k.code];
    const label = k.shift ? kc?.shift : kc?.base;
    return label ? { ...k, label } : null;
  };
  const main = stageById(lang, stage).keys.map(toTarget).filter((x): x is Target => x !== null);
  const review: Target[] = [];
  for (let s = 1; s < stage; s++) review.push(...stageById(lang, s).keys.map(toTarget).filter((x): x is Target => x !== null));
  const out: Target[] = [];
  let last: Target | null = null;
  for (let i = 0; i < count; i++) {
    const pool = review.length && Math.random() < 0.2 ? review : main;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    for (let g = 0; g < 8 && pool.length > 1 && last && pick.label === last.label; g++) pick = pool[Math.floor(Math.random() * pool.length)];
    out.push(pick);
    last = pick;
  }
  return out;
}

export function renderPlacePractice(opts: {
  stage: number;
  lang: Lang;
  layout: Layout;
  settings: Settings;
  onExit(): void;
  onNext(): void;
  onRetry(): void;
}): View {
  const { stage, lang, layout, settings } = opts;
  const targets = buildTargets(lang, layout, stage, settings.count);
  const sampler = new KeySampler();
  let idx = 0;
  let correct = 0;
  let wrong = 0;
  let startedAt = 0;
  let finished = false;
  const missByLabel = new Map<string, number>();

  const el = h('section', 'practice place');
  el.innerHTML = `
    <header class="practice-top">
      <h2>${esc(t('place.title', { stage: stageName(lang, stage) }))}</h2>
      <div class="learned">${t('place.learned')}: ${stageChars(lang, layout, stage).map((c) => `<kbd>${esc(c)}</kbd>`).join('')}</div>
      <div class="stats">
        <span><b data-stat="progress">0</b> / ${targets.length}</span>
        <span>${t('common.accuracy')} <b data-stat="acc">100</b>%</span>
      </div>
    </header>
    <div class="target-area"><div class="target-box"><span class="target-now" aria-live="polite"></span></div></div>
  `;
  const kb = renderKeyboard(layout);
  const fingers = renderFingers();
  el.append(kb.el, fingers.el);

  const nowEl = el.querySelector<HTMLElement>('.target-now')!;
  const boxEl = el.querySelector<HTMLElement>('.target-box')!;
  const progEl = el.querySelector<HTMLElement>('[data-stat="progress"]')!;
  const accEl = el.querySelector<HTMLElement>('[data-stat="acc"]')!;

  function show(): void {
    const tg = targets[idx];
    if (!tg) return;
    nowEl.textContent = tg.label;
    boxEl.classList.toggle('needs-shift', Boolean(tg.shift));
    kb.setTarget(tg.code, tg.shift ? shiftCodeFor(tg.code) : null);
    fingers.set(FINGER_OF[tg.code] ?? null);
    progEl.textContent = String(idx);
    accEl.textContent = String(Math.round(accuracyOf(correct, wrong)));
    sampler.mark();
  }

  function finish(): void {
    finished = true;
    const ms = Math.max(1, Date.now() - startedAt);
    const accuracy = accuracyOf(correct, wrong);
    const kpm = kpmOf(correct, ms);
    appendHistory({ lang, mode: 'place', key: stage, count: targets.length, correct, wrong, ms, kpm, accuracy });
    mergeKeyStats(lang, sampler.samples);
    play(settings.sound, 'done');
    kb.setTarget(null);
    fingers.set(null);
    const worst = [...missByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const result = resultCard({
      accuracy,
      kpm,
      ms,
      missed: worst,
      buttons: [
        { label: t('common.retry'), onClick: opts.onRetry },
        ...(stage < 10 ? [{ label: t('result.nextStage'), primary: true, onClick: opts.onNext }] : []),
        { label: t('common.toMenu'), onClick: opts.onExit },
      ],
    });
    el.querySelector('.target-area')!.replaceWith(result);
    progEl.textContent = String(targets.length);
  }

  const off = onKeys((e) => {
    if (finished || e.repeat || !e.code || MODIFIER_CODES.has(e.code)) return;
    const tg = targets[idx];
    const ch = charForEvent(layout, e);
    if (ch === null) return;
    e.preventDefault();
    if (!startedAt) startedAt = Date.now();
    const ok = ch === tg.label;
    kb.flash(e.code, ok);
    play(settings.sound, ok ? 'hit' : 'miss');
    sampler.record(tg.label, ok);
    if (ok) {
      correct++;
      idx++;
      if (idx >= targets.length) finish();
      else show();
    } else {
      wrong++;
      missByLabel.set(tg.label, (missByLabel.get(tg.label) ?? 0) + 1);
      boxEl.classList.remove('shake');
      void boxEl.offsetWidth;
      boxEl.classList.add('shake');
      show();
    }
  }, opts.onExit);

  show();
  return { el, destroy: off };
}
