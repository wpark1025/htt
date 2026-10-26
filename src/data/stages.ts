// 자리익힘·낱말익힘 10단계. 한메타자교사 3.05의 단계 구성을 따른다.
// 각 단계는 "새로 배우는 글쇠"만 적고, 학습 글쇠는 앞 단계까지 누적한 것이다.

import type { Lang } from '../core/settings';
import type { Layout } from '../core/keyboard';

export interface StageKey {
  code: string;
  shift?: boolean;
}

export interface Stage {
  id: number;
  /** 새로 배우는 글쇠 */
  keys: StageKey[];
}

const k = (codes: string, shift = false): StageKey[] => codes.split(' ').map((code) => ({ code, shift }));

export const KO_STAGES: Stage[] = [
  { id: 1, keys: k('KeyA KeyS KeyD KeyF KeyJ KeyK KeyL Semicolon') }, // ㅁㄴㅇㄹ ㅓㅏㅣ;
  { id: 2, keys: k('KeyQ KeyW KeyE KeyR') }, // ㅂㅈㄷㄱ
  { id: 3, keys: k('KeyT KeyG KeyB KeyY KeyH KeyN') }, // ㅅㅎㅠ ㅛㅗㅜ
  { id: 4, keys: k('KeyU KeyI KeyO KeyP') }, // ㅕㅑㅐㅔ
  { id: 5, keys: k('KeyZ KeyX KeyC KeyV') }, // ㅋㅌㅊㅍ
  { id: 6, keys: k('KeyM Comma Period Slash') }, // ㅡ , . /
  { id: 7, keys: k('KeyQ KeyW KeyE KeyR KeyT', true) }, // ㅃㅉㄸㄲㅆ
  { id: 8, keys: k('KeyO KeyP', true) }, // ㅒㅖ (복합 모음은 낱말에서 자연히 나온다)
  { id: 9, keys: k('Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0') },
  {
    id: 10,
    keys: [
      ...k('Minus Equal BracketLeft BracketRight Backslash Quote Backquote'),
      ...k('Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Slash Semicolon Quote', true),
    ],
  },
];

export const EN_STAGES: Stage[] = [
  { id: 1, keys: k('KeyA KeyS KeyD KeyF KeyJ KeyK KeyL Semicolon') },
  { id: 2, keys: k('KeyQ KeyW KeyE KeyR') },
  { id: 3, keys: k('KeyT KeyG KeyB KeyY KeyH KeyN') },
  { id: 4, keys: k('KeyU KeyI KeyO KeyP') },
  { id: 5, keys: k('KeyZ KeyX KeyC KeyV') },
  { id: 6, keys: k('KeyM Comma Period Slash') },
  {
    id: 7,
    keys: k(
      'KeyA KeyS KeyD KeyF KeyJ KeyK KeyL KeyQ KeyW KeyE KeyR KeyT KeyG KeyB KeyY KeyH KeyN KeyU KeyI KeyO KeyP KeyZ KeyX KeyC KeyV KeyM',
      true,
    ),
  },
  { id: 8, keys: [...k('Quote Minus'), ...k('Slash Semicolon Quote Digit1', true)] }, // ' - ? : " !
  { id: 9, keys: k('Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0') },
  {
    id: 10,
    keys: [
      ...k('Equal BracketLeft BracketRight Backslash Backquote'),
      ...k('Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal BracketLeft BracketRight Backslash Backquote Comma Period', true),
    ],
  },
];

export const STAGES: Record<Lang, Stage[]> = { ko: KO_STAGES, en: EN_STAGES };

export const stageById = (lang: Lang, id: number): Stage => STAGES[lang].find((s) => s.id === id) ?? STAGES[lang][0];

/** 단계의 새 글쇠가 만드는 글자들 */
export function stageChars(lang: Lang, layout: Layout, id: number): string[] {
  return stageById(lang, id)
    .keys.map((sk) => (sk.shift ? layout.keys[sk.code]?.shift : layout.keys[sk.code]?.base))
    .filter((c): c is string => Boolean(c));
}

/** id단계까지 배운 글자 전부 (낱말 거르기에 쓴다). 사이띄개는 항상 포함. */
export function learnedChars(lang: Lang, layout: Layout, id: number): Set<string> {
  const set = new Set<string>([' ']);
  for (const s of STAGES[lang]) {
    if (s.id > id) break;
    for (const c of stageChars(lang, layout, s.id)) set.add(c);
  }
  return set;
}
