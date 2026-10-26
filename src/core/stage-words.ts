// 단계별 낱말 묶음: 손으로 고른 단계 낱말 + 일반 낱말 목록 중 배운 글쇠로만 칠 수 있는 것.

import { EN_STAGE_WORDS } from '../data/en/stage-words';
import { EN_WORDS } from '../data/en/words';
import { KO_STAGE_WORDS } from '../data/ko/stage-words';
import { KO_WORDS } from '../data/ko/words';
import { learnedChars } from '../data/stages';
import type { Layout } from './keyboard';
import type { Lang } from './settings';
import { strokesOf } from './words';

const STAGE_WORDS: Record<Lang, Record<number, string[]>> = { ko: KO_STAGE_WORDS, en: EN_STAGE_WORDS };
const GENERAL: Record<Lang, string[]> = { ko: KO_WORDS.map((e) => e.w), en: EN_WORDS.map((e) => e.w) };

export function typableWith(word: string, lang: Lang, learned: Set<string>): boolean {
  return strokesOf(word, lang).every((s) => learned.has(s));
}

/** 이 단계에서 새로 칠 수 있게 된 낱말(앞에)과 전에 배운 낱말(뒤에) */
export function stageWordPool(lang: Lang, layout: Layout, stage: number): { fresh: string[]; review: string[] } {
  const learned = learnedChars(lang, layout, stage);
  const before = stage > 1 ? learnedChars(lang, layout, stage - 1) : new Set<string>();
  const ok = (w: string) => typableWith(w, lang, learned);
  const seen = new Set<string>();
  const fresh: string[] = [];
  const review: string[] = [];
  const consider = (w: string) => {
    if (seen.has(w) || !ok(w)) return;
    seen.add(w);
    (stage === 1 || !typableWith(w, lang, before) ? fresh : review).push(w);
  };
  for (const [id, ws] of Object.entries(STAGE_WORDS[lang])) if (Number(id) <= stage) ws.forEach(consider);
  GENERAL[lang].forEach(consider);
  return { fresh, review };
}

function shuffle<T>(a: T[]): T[] {
  const d = [...a];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/** n개 뽑기: 새 낱말 2/3, 복습 1/3. 모자라면 섞어서 채운다. */
export function pickStageWords(lang: Lang, layout: Layout, stage: number, n: number): string[] {
  const { fresh, review } = stageWordPool(lang, layout, stage);
  const want = review.length ? Math.ceil((n * 2) / 3) : n;
  const out = [...shuffle(fresh).slice(0, want), ...shuffle(review).slice(0, n - Math.min(want, fresh.length))];
  const all = [...fresh, ...review];
  while (out.length < n && all.length) {
    const pick = all[Math.floor(Math.random() * all.length)];
    if (pick !== out[out.length - 1]) out.push(pick);
  }
  return shuffle(out).slice(0, n);
}

/** 낱말을 한 줄에 maxChars 글자 안쪽으로 묶는다 */
export function groupLines(words: string[], maxChars = 28): string[] {
  const lines: string[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const w of words) {
    const wl = [...w].length;
    if (cur.length && len + 1 + wl > maxChars) {
      lines.push(cur.join(' '));
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += (cur.length > 1 ? 1 : 0) + wl;
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}
