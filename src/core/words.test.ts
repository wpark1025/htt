import { describe, expect, it } from 'vitest';
import { EN_LAYOUT } from '../data/en/layout';
import { EN_WORDS } from '../data/en/words';
import { KO_LAYOUT } from '../data/ko/layout';
import { KO_WORDS } from '../data/ko/words';
import { LEVELS } from '../data/levels';
import type { Lang, LevelId } from './settings';
import { analyze, naturalLevel, pickWords, poolFor } from './words';

const data = {
  ko: { words: KO_WORDS, layout: KO_LAYOUT },
  en: { words: EN_WORDS, layout: EN_LAYOUT },
} as const;

describe('낱말 데이터', () => {
  for (const lang of ['ko', 'en'] as Lang[]) {
    const { words, layout } = data[lang];

    it(`${lang}: 중복 없음`, () => {
      const seen = new Map<string, number>();
      for (const e of words) seen.set(e.w, (seen.get(e.w) ?? 0) + 1);
      const dups = [...seen].filter(([, n]) => n > 1).map(([w]) => w);
      expect(dups).toEqual([]);
    });

    it(`${lang}: 모든 글자를 이 자판으로 칠 수 있음`, () => {
      const bad = words.filter((e) => analyze(e, lang, layout).strokes.some((s) => !hasKey(layout, s)));
      expect(bad.map((e) => e.w)).toEqual([]);
    });

    it(`${lang}: 수준마다 낱말이 충분함`, () => {
      for (const l of LEVELS) {
        const pool = poolFor(words, lang, layout, l.id);
        expect(pool.length, `level ${l.id}`).toBeGreaterThanOrEqual(20);
      }
    });

    it(`${lang}: 수준 1 묶음은 짧고 Shift 없음`, () => {
      for (const w of poolFor(words, lang, layout, 1)) {
        expect(w.shift).toBe(false);
        expect(w.len).toBeLessThanOrEqual(LEVELS[0].maxLen[lang]);
        if (lang === 'ko') expect(w.batchim).toBe(false);
      }
    });
  }

  it('자연 수준 예시', () => {
    const nat = (w: string) => naturalLevel(analyze({ w, g: 1 }, 'ko', KO_LAYOUT), 'ko');
    expect(nat('나무')).toBe(1);
    expect(nat('학교')).toBe(2);
    expect(nat('딸기')).toBe(3);
    expect(nat('아이스크림')).toBe(4);
    const natEn = (w: string) => naturalLevel(analyze({ w, g: 1 }, 'en', EN_LAYOUT), 'en');
    expect(natEn('cat')).toBe(1);
    expect(natEn('apple')).toBe(2);
    expect(natEn('Korea')).toBe(3);
  });

  it('pickWords는 요청한 개수를 채우고 연속 중복이 없음', () => {
    const pool = poolFor(KO_WORDS, 'ko', KO_LAYOUT, 1 as LevelId).slice(0, 5);
    const picked = pickWords(pool, 23);
    expect(picked.length).toBe(23);
    for (let i = 1; i < picked.length; i++) expect(picked[i].w).not.toBe(picked[i - 1].w);
  });
});

function hasKey(layout: { keys: Record<string, { base: string; shift?: string }> }, ch: string): boolean {
  return Object.values(layout.keys).some((k) => k.base === ch || k.shift === ch);
}
