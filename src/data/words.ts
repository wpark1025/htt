import type { Grade } from './levels';

export interface WordEntry {
  w: string;
  /** 어휘 등급: 1 기초(아이도 아는 사물·가족·음식), 2 일상 일반, 3 전문·추상·긴 낱말 */
  g: Grade;
}

/** 공백으로 나눈 낱말 목록에 등급을 붙인다 */
export function graded(g: Grade, list: string): WordEntry[] {
  return list
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ w, g }));
}
