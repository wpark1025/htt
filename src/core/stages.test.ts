import { describe, expect, it } from 'vitest';
import { EN_LAYOUT } from '../data/en/layout';
import { EN_PUZZLES } from '../data/en/puzzles';
import { EN_STAGE_WORDS } from '../data/en/stage-words';
import { KO_LAYOUT } from '../data/ko/layout';
import { KO_PUZZLES } from '../data/ko/puzzles';
import { KO_STAGE_WORDS } from '../data/ko/stage-words';
import { puzzleCells } from '../data/puzzles';
import { learnedChars, STAGES, stageChars } from '../data/stages';
import { en } from '../i18n/en';
import { ko } from '../i18n/ko';
import type { Lang } from './settings';
import { groupLines, pickStageWords, stageWordPool, typableWith } from './stage-words';

const layouts = { ko: KO_LAYOUT, en: EN_LAYOUT };
const handwritten = { ko: KO_STAGE_WORDS, en: EN_STAGE_WORDS };

describe('단계 정의', () => {
  for (const lang of ['ko', 'en'] as Lang[]) {
    it(`${lang}: 10단계, 모든 글쇠가 자판에 있음`, () => {
      expect(STAGES[lang].length).toBe(10);
      for (const s of STAGES[lang]) expect(stageChars(lang, layouts[lang], s.id).length, `stage ${s.id}`).toBeGreaterThan(0);
    });
    it(`${lang}: 1단계 학습 글쇠는 기본 자리 8개`, () => {
      const set = learnedChars(lang, layouts[lang], 1);
      expect(set.size).toBe(9); // 8 + 사이띄개
    });
  }
  it('ko 1단계는 ㅁㄴㅇㄹㅓㅏㅣ;', () => {
    expect(stageChars('ko', KO_LAYOUT, 1).join('')).toBe('ㅁㄴㅇㄹㅓㅏㅣ;');
  });
});

describe('단계별 낱말', () => {
  for (const lang of ['ko', 'en'] as Lang[]) {
    for (const s of STAGES[lang]) {
      it(`${lang} ${s.id}단계: 손으로 고른 낱말 대부분이 배운 글쇠로 칠 수 있고 묶음이 넉넉함`, () => {
        const learned = learnedChars(lang, layouts[lang], s.id);
        const list = handwritten[lang][s.id] ?? [];
        const bad = list.filter((w) => !typableWith(w, lang, learned));
        expect(bad.length, `untypable: ${bad.join(', ')}`).toBeLessThanOrEqual(2);
        const { fresh, review } = stageWordPool(lang, layouts[lang], s.id);
        expect(fresh.length + review.length, `pool for stage ${s.id}`).toBeGreaterThanOrEqual(10);
        const picked = pickStageWords(lang, layouts[lang], s.id, 20);
        expect(picked.length).toBe(20);
        for (const w of picked) expect(typableWith(w, lang, learned), w).toBe(true);
      });
    }
  }
  it('groupLines는 글자 수 제한을 지킨다', () => {
    const lines = groupLines(['어머니', '아이', '나라', '나이', '이마', '머리', '미리', '어머나'], 10);
    for (const l of lines) expect([...l].length).toBeLessThanOrEqual(10);
    expect(lines.join(' ').split(' ').length).toBe(8);
  });
});

describe('퍼즐 데이터', () => {
  for (const p of [...KO_PUZZLES, ...EN_PUZZLES]) {
    it(`퍼즐 ${p.title}: 겹치는 칸이 맞고 격자 안에 있음`, () => {
      expect(() => puzzleCells(p)).not.toThrow();
      expect(puzzleCells(p).size).toBeGreaterThan(10);
    });
  }
});

describe('i18n', () => {
  it('ko와 en의 키가 같다', () => {
    const k = Object.keys(ko).sort();
    const e = Object.keys(en).sort();
    expect(e).toEqual(k);
  });
});
