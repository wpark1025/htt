// 설정과 기록. 모두 기기 로컬(localStorage)에만 저장한다.

export type Lang = 'ko' | 'en';
export type LevelId = 1 | 2 | 3 | 4 | 5;

export interface Settings {
  lang: Lang;
  /** 낱말 수준 (낱말 연습·게임 공통) */
  level: LevelId;
  /** 자리 연습 한 회 문항 수 */
  count: 20 | 40 | 80 | 120;
  /** 자리 연습에 Shift 글자(쌍자음, 대문자 등) 포함 */
  shift: boolean;
  /** 낱말 연습 한 회 낱말 수 */
  wordCount: 10 | 20 | 40;
  /** 낱말 연습 때 화면 키보드 보이기 */
  showKeyboard: boolean;
  /** 산성비 속도 1(느림)~5(빠름) */
  rainSpeed: 1 | 2 | 3 | 4 | 5;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'ko',
  level: 1,
  count: 40,
  shift: false,
  wordCount: 20,
  showKeyboard: true,
  rainSpeed: 2,
  sound: true,
};

const SETTINGS_KEY = 'htt.settings';
const HISTORY_KEY = 'htt.history';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 사생활 보호 모드 등에서 실패해도 앱은 동작해야 한다
  }
}

export function loadSettings(): Settings {
  return read(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(s: Settings): void {
  write(SETTINGS_KEY, s);
}

export type Mode = 'place' | 'word' | 'rain';

export interface Result {
  ts: number;
  lang: Lang;
  /** 없으면 초기 버전의 자리 연습 기록 */
  mode?: Mode;
  /** 자리 연습 구역 */
  zone?: number;
  /** 낱말 수준 */
  level?: number;
  /** 문항·낱말 수 */
  count: number;
  /** 맞은 타수 */
  correct: number;
  wrong: number;
  ms: number;
  /** 분당 타수 */
  kpm: number;
  accuracy: number;
  /** 게임 점수 */
  score?: number;
}

/** @deprecated Result를 쓴다 */
export type PlaceResult = Result;

export function loadHistory(): Result[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Result[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(r: Result): void {
  const h = loadHistory();
  h.push(r);
  write(HISTORY_KEY, h.slice(-500));
}

const modeOf = (r: Result): Mode => r.mode ?? 'place';

/** 모드별 최고 기록. key는 자리 연습이면 구역 번호, 그 외에는 수준. */
export function bestFor(lang: Lang, mode: Mode, key: number): Result | undefined {
  return loadHistory()
    .filter((r) => r.lang === lang && modeOf(r) === mode && (mode === 'place' ? r.zone === key : r.level === key))
    .sort((a, b) =>
      mode === 'rain' ? (b.score ?? 0) - (a.score ?? 0) : b.accuracy - a.accuracy || b.kpm - a.kpm,
    )[0];
}
