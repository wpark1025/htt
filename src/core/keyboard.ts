// 물리 키보드 정의. 모든 입력은 KeyboardEvent.code(물리 위치) 기준이다.
// 언어별 글자 배치는 Layout이 담당하고, 손가락 배정은 언어와 무관하다.

export type Finger = 'LP' | 'LR' | 'LM' | 'LI' | 'RI' | 'RM' | 'RR' | 'RP' | 'TH';

export interface PhysKey {
  code: string;
  finger: Finger;
  /** 키 너비 (기본 1u) */
  w?: number;
  /** 글자 대신 보여줄 이름 (Shift, Enter 등) */
  label?: string;
}

export const FINGER_NAME: Record<Finger, string> = {
  LP: '왼손 소지',
  LR: '왼손 약지',
  LM: '왼손 중지',
  LI: '왼손 검지',
  RI: '오른손 검지',
  RM: '오른손 중지',
  RR: '오른손 약지',
  RP: '오른손 소지',
  TH: '엄지',
};

const k = (code: string, finger: Finger, w?: number, label?: string): PhysKey => ({ code, finger, w, label });

/** ANSI 배열 기준 5줄. 크롬북 키보드도 글자 영역은 동일하다. */
export const ROWS: PhysKey[][] = [
  [
    k('Backquote', 'LP'),
    k('Digit1', 'LP'),
    k('Digit2', 'LR'),
    k('Digit3', 'LM'),
    k('Digit4', 'LI'),
    k('Digit5', 'LI'),
    k('Digit6', 'RI'),
    k('Digit7', 'RI'),
    k('Digit8', 'RM'),
    k('Digit9', 'RR'),
    k('Digit0', 'RP'),
    k('Minus', 'RP'),
    k('Equal', 'RP'),
    k('Backspace', 'RP', 2, '⌫'),
  ],
  [
    k('Tab', 'LP', 1.5, 'Tab'),
    k('KeyQ', 'LP'),
    k('KeyW', 'LR'),
    k('KeyE', 'LM'),
    k('KeyR', 'LI'),
    k('KeyT', 'LI'),
    k('KeyY', 'RI'),
    k('KeyU', 'RI'),
    k('KeyI', 'RM'),
    k('KeyO', 'RR'),
    k('KeyP', 'RP'),
    k('BracketLeft', 'RP'),
    k('BracketRight', 'RP'),
    k('Backslash', 'RP', 1.5),
  ],
  [
    k('CapsLock', 'LP', 1.75, 'Caps'),
    k('KeyA', 'LP'),
    k('KeyS', 'LR'),
    k('KeyD', 'LM'),
    k('KeyF', 'LI'),
    k('KeyG', 'LI'),
    k('KeyH', 'RI'),
    k('KeyJ', 'RI'),
    k('KeyK', 'RM'),
    k('KeyL', 'RR'),
    k('Semicolon', 'RP'),
    k('Quote', 'RP'),
    k('Enter', 'RP', 2.25, 'Enter'),
  ],
  [
    k('ShiftLeft', 'LP', 2.25, 'Shift'),
    k('KeyZ', 'LP'),
    k('KeyX', 'LR'),
    k('KeyC', 'LM'),
    k('KeyV', 'LI'),
    k('KeyB', 'LI'),
    k('KeyN', 'RI'),
    k('KeyM', 'RI'),
    k('Comma', 'RM'),
    k('Period', 'RR'),
    k('Slash', 'RP'),
    k('ShiftRight', 'RP', 2.75, 'Shift'),
  ],
  [k('Space', 'TH', 6.25, '')],
];

export const FINGER_OF: Record<string, Finger> = Object.fromEntries(
  ROWS.flat().map((p) => [p.code, p.finger]),
);

export const isLeftHand = (f: Finger) => f.startsWith('L');

/** 한 키를 누를 때 Shift는 반대 손으로 누른다. */
export function shiftCodeFor(code: string): 'ShiftLeft' | 'ShiftRight' {
  const f = FINGER_OF[code];
  return f && isLeftHand(f) ? 'ShiftRight' : 'ShiftLeft';
}

export interface KeyChars {
  base: string;
  shift?: string;
}

/** 언어별 글자 배치: 물리 키 → 글자 */
export interface Layout {
  id: string;
  name: string;
  keys: Record<string, KeyChars>;
}

/** 글자 → {code, shift} 역방향 찾기 */
export function findKey(layout: Layout, ch: string): { code: string; shift: boolean } | null {
  for (const [code, kc] of Object.entries(layout.keys)) {
    if (kc.base === ch) return { code, shift: false };
    if (kc.shift === ch) return { code, shift: true };
  }
  return null;
}

export const MODIFIER_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
  'Tab',
  'Enter',
  'Backspace',
  'Escape',
  'ContextMenu',
]);
