// 낱말 수준 정의. 낱말마다 어휘 등급(g)이 붙어 있고, 글자 수·받침·Shift는 자동으로 분석한다.
// 수준 N의 낱말 묶음은 "자연 수준"이 N-1~N인 낱말들이다 (src/core/words.ts).

import type { Lang, LevelId } from '../core/settings';

export type Grade = 1 | 2 | 3;

export interface WordLevel {
  id: LevelId;
  name: Record<Lang, string>;
  desc: Record<Lang, string>;
  /** 최대 길이: 한글은 글자 수, 영어는 알파벳 수 */
  maxLen: Record<Lang, number>;
  /** 받침 허용 (한글) */
  batchim: boolean;
  /** Shift 글자 허용 (쌍자음·ㅒㅖ, 대문자) */
  shift: boolean;
  /** 허용 어휘 등급 상한 */
  grade: Grade;
}

export const LEVELS: WordLevel[] = [
  {
    id: 1,
    name: { ko: '아주 쉬움', en: 'Very easy' },
    desc: { ko: '받침 없는 두 글자', en: 'Up to 3 letters' },
    maxLen: { ko: 2, en: 3 },
    batchim: false,
    shift: false,
    grade: 1,
  },
  {
    id: 2,
    name: { ko: '쉬움', en: 'Easy' },
    desc: { ko: '받침 있는 세 글자까지', en: 'Up to 5 letters' },
    maxLen: { ko: 3, en: 5 },
    batchim: true,
    shift: false,
    grade: 1,
  },
  {
    id: 3,
    name: { ko: '보통', en: 'Normal' },
    desc: { ko: 'Shift 글자, 네 글자까지', en: 'Capitals, up to 7 letters' },
    maxLen: { ko: 4, en: 7 },
    batchim: true,
    shift: true,
    grade: 2,
  },
  {
    id: 4,
    name: { ko: '어려움', en: 'Hard' },
    desc: { ko: '다섯 글자, 넓은 어휘', en: 'Up to 10 letters, wider vocabulary' },
    maxLen: { ko: 5, en: 10 },
    batchim: true,
    shift: true,
    grade: 3,
  },
  {
    id: 5,
    name: { ko: '전부', en: 'Everything' },
    desc: { ko: '긴 낱말과 전문 어휘', en: 'Long and advanced words' },
    maxLen: { ko: 99, en: 99 },
    batchim: true,
    shift: true,
    grade: 3,
  },
];

export const levelById = (id: number): WordLevel => LEVELS.find((l) => l.id === id) ?? LEVELS[0];
