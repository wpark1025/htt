// 설정과 기록. 모두 기기 로컬(localStorage)에만 저장한다.

export type Lang = 'ko' | 'en';

export interface Settings {
  lang: Lang;
  /** 자리 연습 한 회 문항 수 */
  count: 20 | 40 | 80 | 120;
  /** Shift 글자(쌍자음, 대문자 등) 포함 */
  shift: boolean;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'ko',
  count: 40,
  shift: false,
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

export interface PlaceResult {
  ts: number;
  lang: Lang;
  zone: number;
  count: number;
  correct: number;
  wrong: number;
  ms: number;
  /** 분당 타수 */
  kpm: number;
  accuracy: number;
}

export function loadHistory(): PlaceResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as PlaceResult[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(r: PlaceResult): void {
  const h = loadHistory();
  h.push(r);
  write(HISTORY_KEY, h.slice(-500));
}

export function bestFor(lang: Lang, zone: number): PlaceResult | undefined {
  return loadHistory()
    .filter((r) => r.lang === lang && r.zone === zone)
    .sort((a, b) => b.accuracy - a.accuracy || b.kpm - a.kpm)[0];
}
