// 설정. 기기 로컬(localStorage)에만 저장한다. 기록·사용자는 store.ts.

export type Lang = 'ko' | 'en';
export type UiLang = 'ko' | 'en';
export type LevelId = 1 | 2 | 3 | 4 | 5;
export type Theme = 'light' | 'dark' | 'retro';

export interface Settings {
  /** 앱(메뉴·안내문) 언어 */
  uiLang: UiLang;
  /** 연습할 자판 */
  lang: Lang;
  /** 낱말 수준 (게임) */
  level: LevelId;
  /** 자리익힘 한 회 횟수 */
  count: 50 | 100 | 200;
  /** 낱말익힘 한 회 낱말 수 */
  wordCount: 10 | 20 | 40;
  showKeyboard: boolean;
  /** 게임 속도 1(느림)~5(빠름) */
  gameSpeed: 1 | 2 | 3 | 4 | 5;
  sound: boolean;
  theme: Theme;
  /** 타자 검정 시간(분) */
  examMinutes: 1 | 3 | 5;
}

export const DEFAULT_SETTINGS: Settings = {
  uiLang: 'ko',
  lang: 'ko',
  level: 1,
  count: 100,
  wordCount: 20,
  showKeyboard: true,
  gameSpeed: 2,
  sound: true,
  theme: 'light',
  examMinutes: 3,
};

const SETTINGS_KEY = 'htt.settings';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return Array.isArray(fallback) ? (v as T) : { ...fallback, ...v };
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 사생활 보호 모드 등에서 실패해도 앱은 동작해야 한다
  }
}

export function loadSettings(): Settings {
  const s = readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  if (![50, 100, 200].includes(s.count)) s.count = 100;
  return s;
}

export function saveSettings(s: Settings): void {
  writeJson(SETTINGS_KEY, s);
}
