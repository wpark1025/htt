// 낱말 난도 분석과 수준별 묶음 만들기.

import { LEVELS, type WordLevel } from '../data/levels';
import type { WordEntry } from '../data/words';
import { isSyllable, splitSyllable, toKeystrokes } from './hangul';
import { findKey, type Layout } from './keyboard';
import type { Lang, LevelId } from './settings';

export interface WordInfo {
  w: string;
  grade: number;
  /** 글자 수 (한글은 음절, 영어는 알파벳) */
  len: number;
  batchim: boolean;
  shift: boolean;
  /** 눌러야 하는 키 순서 */
  strokes: string[];
}

/** 낱말을 칠 때 눌러야 하는 키 순서 (언어 공통) */
export function strokesOf(word: string, lang: Lang): string[] {
  return lang === 'ko' ? toKeystrokes(word) : [...word];
}

export function analyze(entry: WordEntry, lang: Lang, layout: Layout): WordInfo {
  const chars = [...entry.w];
  const strokes = strokesOf(entry.w, lang);
  return {
    w: entry.w,
    grade: entry.g,
    len: chars.length,
    batchim: lang === 'ko' && chars.some((c) => isSyllable(c) && splitSyllable(c)[2] !== ''),
    shift: strokes.some((s) => findKey(layout, s)?.shift === true),
    strokes,
  };
}

function fits(info: WordInfo, level: WordLevel, lang: Lang): boolean {
  return (
    info.len <= level.maxLen[lang] &&
    (level.batchim || !info.batchim) &&
    (level.shift || !info.shift) &&
    info.grade <= level.grade
  );
}

/** 이 낱말이 처음 등장하는 수준 */
export function naturalLevel(info: WordInfo, lang: Lang): LevelId {
  return (LEVELS.find((l) => fits(info, l, lang))?.id ?? 5) as LevelId;
}

const MIN_POOL = 20;

/** 수준에 맞는 낱말 묶음. 바로 아래 수준 낱말도 섞여서 너무 갑자기 어려워지지 않게 한다. */
export function poolFor(words: WordEntry[], lang: Lang, layout: Layout, level: LevelId): WordInfo[] {
  const infos = words.map((e) => ({ info: analyze(e, lang, layout), nat: 0 as number }));
  for (const x of infos) x.nat = naturalLevel(x.info, lang);
  const lo = Math.max(1, level - 1);
  let pool = infos.filter((x) => x.nat >= lo && x.nat <= level);
  if (pool.length < MIN_POOL) pool = infos.filter((x) => x.nat <= level);
  return pool.map((x) => x.info);
}

/** 묶음에서 n개를 뽑는다. 겹치지 않게, 묶음이 작으면 다 쓴 뒤 다시 섞어서 이어간다. */
export function pickWords(pool: WordInfo[], n: number): WordInfo[] {
  const out: WordInfo[] = [];
  while (out.length < n && pool.length) {
    const deck = [...pool];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    // 이어 붙일 때 같은 낱말이 연속으로 나오지 않게
    if (out.length && deck.length > 1 && deck[0].w === out[out.length - 1].w) deck.push(deck.shift()!);
    out.push(...deck.slice(0, n - out.length));
  }
  return out;
}
