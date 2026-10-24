// 자리 연습 구역. 한컴타자 공식 8구역 구성을 따른다.
// 물리 키 기준이라 한글/영어가 같은 구역 정의를 공유한다. 글자는 Layout이 붙인다.

export interface Zone {
  id: number;
  name: { ko: string; en: string };
  /** 이 구역에서 연습하는 물리 키 */
  codes: string[];
  /** Shift 포함 설정이 켜졌을 때 추가로 연습하는 (Shift 글자가 있는) 키 */
  shiftCodes?: string[];
}

const HOME = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
const TOP_LEFT = ['KeyQ', 'KeyW', 'KeyE', 'KeyR'];
const BOTTOM_LEFT = ['KeyZ', 'KeyX', 'KeyC', 'KeyV'];
const MIDDLE = ['KeyT', 'KeyG', 'KeyB', 'KeyY', 'KeyH', 'KeyN'];
const TOP_RIGHT = ['KeyU', 'KeyI', 'KeyO', 'KeyP'];
const BOTTOM_RIGHT = ['KeyM', 'Comma', 'Period', 'Slash'];
const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];

export const ZONES: Zone[] = [
  { id: 1, name: { ko: '기본 자리', en: 'Home row' }, codes: HOME },
  { id: 2, name: { ko: '왼손 윗자리', en: 'Top left' }, codes: TOP_LEFT, shiftCodes: TOP_LEFT },
  { id: 3, name: { ko: '왼손 아랫자리', en: 'Bottom left' }, codes: BOTTOM_LEFT },
  { id: 4, name: { ko: '가운데 자리', en: 'Middle keys' }, codes: MIDDLE, shiftCodes: ['KeyT'] },
  { id: 5, name: { ko: '오른손 윗자리', en: 'Top right' }, codes: TOP_RIGHT, shiftCodes: ['KeyO', 'KeyP'] },
  { id: 6, name: { ko: '오른손 아랫자리', en: 'Bottom right' }, codes: BOTTOM_RIGHT, shiftCodes: ['Comma', 'Period', 'Slash'] },
  {
    id: 7,
    name: { ko: '전체 자리', en: 'All keys' },
    codes: [...HOME, ...TOP_LEFT, ...BOTTOM_LEFT, ...MIDDLE, ...TOP_RIGHT, ...BOTTOM_RIGHT],
    shiftCodes: [...TOP_LEFT, 'KeyT', 'KeyO', 'KeyP'],
  },
  { id: 8, name: { ko: '숫자 자리', en: 'Numbers' }, codes: DIGITS },
];

/** 영어는 모든 글자 키에 대문자가 있다. 한글은 쌍자음/ㅒㅖ 키만 Shift 글자가 있다. */
export function shiftCodesFor(zone: Zone, lang: 'ko' | 'en'): string[] {
  if (lang === 'en') return zone.codes.filter((c) => c.startsWith('Key'));
  return zone.shiftCodes ?? [];
}
