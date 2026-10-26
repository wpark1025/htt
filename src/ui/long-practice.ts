// 장문 연습과 타자 검정. 긴 글을 고르고 한 줄씩 받아쓴다. 검정은 제한 시간과 감점이 있다.

import { MODIFIER_CODES, type Layout } from '../core/keyboard';
import type { Lang, Settings } from '../core/settings';
import { appendHistory, KeySampler, mergeKeyStats } from '../core/store';
import { EN_TEXTS } from '../data/en/texts';
import { KO_TEXTS } from '../data/ko/texts';
import { textChars, type LongText } from '../data/texts';
import { t } from '../i18n';
import { accuracyOf, choiceList, confirmLeave, dialog, esc, fmtSec, h, kpmOf, onKeys, play, resultCard, type View } from './common';
import { lineTyper, type LineTyper } from './line-typer';

export const TEXTS: Record<Lang, LongText[]> = { ko: KO_TEXTS, en: EN_TEXTS };
export const EXAM_PENALTY = 5;

/** 등급: 분당 유효 타수 기준 */
export function examGrade(kpm: number): 1 | 2 | 3 | 4 | 0 {
  if (kpm >= 400) return 1;
  if (kpm >= 300) return 2;
  if (kpm >= 200) return 3;
  if (kpm >= 120) return 4;
  return 0;
}

/** 글 고르기 화면 */
export function renderTextChooser(opts: { lang: Lang; exam: boolean; onPick(id: string): void }): View {
  const list = choiceList(
    TEXTS[opts.lang].map((x) => ({ label: `${x.title} · ${x.author}`, sub: `${textChars(x)} ${t('long.chars')}`, value: x.id })),
    opts.onPick,
  );
  const body = h('div');
  body.appendChild(h('p', 'muted center', esc(opts.exam ? t('exam.chooseHint') : t('long.chooseHint'))));
  body.appendChild(list.el);
  const el = h('section', 'chooser');
  el.appendChild(dialog(opts.exam ? t('exam.title') : t('long.choose'), body));
  return { el, destroy: list.destroy };
}

export function renderLongPractice(opts: {
  text: LongText;
  lang: Lang;
  layout: Layout;
  settings: Settings;
  exam: boolean;
  onExit(): void;
  onRetry(): void;
}): View {
  const { text, lang, layout, settings, exam } = opts;
  const sampler = new KeySampler();
  const limitMs = exam ? settings.examMinutes * 60000 : 0;
  let li = 0;
  let correct = 0;
  let wrong = 0;
  let startedAt = 0;
  let finished = false;
  let started = !exam;
  let leaving: View | null = null;
  let timer: number | null = null;

  const el = h('section', `practice long ${exam ? 'exam' : ''}`);
  el.innerHTML = `
    <header class="practice-top">
      <h2>${esc(exam ? t('exam.title') : t('long.title'))} · ${esc(text.title)} <small class="muted">${esc(text.author)}</small></h2>
      <div class="stats">
        ${exam ? `<span>${t('exam.remaining')} <b data-stat="time">${fmtSec(limitMs)}</b></span>` : ''}
        <span><b data-stat="progress">0</b> / ${text.lines.length}</span>
        <span>${t('common.accuracy')} <b data-stat="acc">100</b>%</span>
      </div>
    </header>
    <div class="work page"></div>
  `;
  const page = el.querySelector<HTMLElement>('.page')!;
  const progEl = el.querySelector<HTMLElement>('[data-stat="progress"]')!;
  const accEl = el.querySelector<HTMLElement>('[data-stat="acc"]')!;
  const timeEl = el.querySelector<HTMLElement>('[data-stat="time"]');

  const typers: LineTyper[] = text.lines.map((line) =>
    lineTyper({
      text: line,
      lang,
      layout,
      onStroke(expected, ok) {
        sampler.record(expected, ok);
        sampler.mark();
        if (ok) correct++;
        else wrong++;
        play(settings.sound, ok ? 'hit' : 'miss');
        accEl.textContent = String(Math.round(accuracyOf(correct, wrong)));
      },
    }),
  );
  typers.forEach((tp) => page.appendChild(tp.el));

  function activate(): void {
    typers.forEach((tp, i) => tp.setActive(i === li));
    progEl.textContent = String(li);
    typers[li]?.el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    sampler.mark();
  }

  function finish(): void {
    if (finished) return;
    finished = true;
    if (timer !== null) clearInterval(timer);
    const ms = Math.max(1, Math.min(limitMs || Infinity, Date.now() - startedAt));
    const accuracy = accuracyOf(correct, wrong);
    const net = exam ? Math.max(0, correct - EXAM_PENALTY * wrong) : correct;
    const kpm = kpmOf(net, ms);
    appendHistory({
      lang,
      mode: exam ? 'exam' : 'long',
      title: text.title,
      count: text.lines.length,
      correct,
      wrong,
      ms,
      kpm,
      accuracy,
      score: exam ? net : undefined,
    });
    mergeKeyStats(lang, sampler.samples);
    play(settings.sound, 'done');
    const grade = examGrade(kpm);
    const extra = exam
      ? [
          { big: String(correct + wrong), label: t('exam.total') },
          { big: String(correct), label: t('exam.correct') },
          { big: String(wrong), label: t('exam.wrong') },
          { big: String(net), label: t('exam.net') },
          { big: grade ? t(`exam.grade.${grade}`) : t('exam.grade.none'), label: t('exam.grade') },
        ]
      : undefined;
    const card = resultCard({
      accuracy,
      kpm,
      ms,
      extra,
      buttons: [
        { label: t('common.retry'), primary: true, onClick: opts.onRetry },
        { label: t('common.toMenu'), onClick: opts.onExit },
      ],
    });
    el.appendChild(h('div', 'overlay')).appendChild(card);
  }

  function startExam(): void {
    started = true;
    startedAt = Date.now();
    timer = window.setInterval(() => {
      const left = limitMs - (Date.now() - startedAt);
      if (timeEl) timeEl.textContent = fmtSec(left);
      if (left <= 0) finish();
    }, 250);
    activate();
  }

  const off = onKeys(
    (e) => {
      if (finished || leaving) return;
      if (!started) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          intro.remove();
          startExam();
        }
        return;
      }
      const tp = typers[li];
      if (!tp) return;
      if (e.code === 'Enter') {
        e.preventDefault();
        if (!tp.done) wrong += tp.remaining;
        li++;
        if (li >= typers.length) finish();
        else activate();
        return;
      }
      if (MODIFIER_CODES.has(e.code) && e.code !== 'Backspace') return;
      if (!startedAt) startedAt = Date.now();
      if (tp.handle(e)) {
        e.preventDefault();
        if (tp.done) {
          li++;
          if (li >= typers.length) finish();
          else activate();
        }
      }
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

  const intro = h('div', 'overlay');
  if (exam) {
    intro.appendChild(dialog('', h('p', 'center', esc(t('exam.intro', { min: settings.examMinutes, penalty: EXAM_PENALTY })) + `<br><small class="muted">${t('hint.space')}</small>`), 'dialog-small'));
    el.appendChild(intro);
  } else activate();

  return {
    el,
    destroy() {
      off();
      if (timer !== null) clearInterval(timer);
      leaving?.destroy();
    },
  };
}
