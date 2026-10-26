// 사용자, 연습 기록, 글쇠별 통계. 모두 localStorage, 사용자별로 나눠 저장한다.

import { readJson, writeJson, type Lang } from './settings';

export type Mode = 'place' | 'word' | 'short' | 'long' | 'exam' | 'venice' | 'puzzle';

export interface Result {
  ts: number;
  user: string;
  lang: Lang;
  mode: Mode;
  /** 자리/낱말 단계, 게임 수준, 퍼즐 번호 */
  key?: number;
  /** 긴 글·검정 제목 */
  title?: string;
  /** 문항·낱말 수 */
  count: number;
  /** 맞은 타수 */
  correct: number;
  wrong: number;
  ms: number;
  /** 분당 타수 */
  kpm: number;
  accuracy: number;
  /** 게임 점수, 검정 유효타 */
  score?: number;
  /** 게임 단계 */
  stage?: number;
}

export interface Profile {
  name: string;
  createdAt: number;
  /** 글쇠 익숙 정도: 처음/조금 */
  skill?: 'new' | 'some';
}

interface UsersState {
  users: Profile[];
  current: string;
}

const USERS_KEY = 'htt.users';
const HISTORY_KEY = 'htt.history';
const KEYSTATS_KEY = 'htt.keystats';

/* ---------- 사용자 ---------- */

export function loadUsers(): UsersState {
  return readJson<UsersState>(USERS_KEY, { users: [], current: '' });
}

export function currentUser(): Profile | null {
  const s = loadUsers();
  return s.users.find((u) => u.name === s.current) ?? null;
}

export function addUser(name: string, skill?: Profile['skill']): Profile {
  const s = loadUsers();
  let p = s.users.find((u) => u.name === name);
  if (!p) {
    p = { name, createdAt: Date.now(), skill };
    s.users.push(p);
  }
  s.current = name;
  writeJson(USERS_KEY, s);
  return p;
}

export function switchUser(name: string): void {
  const s = loadUsers();
  if (s.users.some((u) => u.name === name)) {
    s.current = name;
    writeJson(USERS_KEY, s);
  }
}

export function deleteUser(name: string): void {
  const s = loadUsers();
  s.users = s.users.filter((u) => u.name !== name);
  if (s.current === name) s.current = s.users[0]?.name ?? '';
  writeJson(USERS_KEY, s);
  writeJson(
    HISTORY_KEY,
    loadAllHistory().filter((r) => r.user !== name),
  );
  const ks = readJson<Record<string, unknown>>(KEYSTATS_KEY, {});
  delete ks[name];
  writeJson(KEYSTATS_KEY, ks);
}

/* ---------- 기록 ---------- */

function loadAllHistory(): Result[] {
  return readJson<Result[]>(HISTORY_KEY, []);
}

export function loadHistory(user = currentUser()?.name ?? ''): Result[] {
  return loadAllHistory().filter((r) => r.user === user);
}

export function appendHistory(r: Omit<Result, 'user' | 'ts'> & { ts?: number }): Result {
  const full: Result = { ...r, ts: r.ts ?? Date.now(), user: currentUser()?.name ?? '' };
  const h = loadAllHistory();
  h.push(full);
  writeJson(HISTORY_KEY, h.slice(-2000));
  return full;
}

/** 최고 기록. 게임·검정은 점수, 그 외는 정확도 → 속도 순. */
export function bestFor(lang: Lang, mode: Mode, key?: number): Result | undefined {
  return loadHistory()
    .filter((r) => r.lang === lang && r.mode === mode && (key === undefined || r.key === key))
    .sort((a, b) =>
      mode === 'venice' || mode === 'exam'
        ? (b.score ?? 0) - (a.score ?? 0)
        : b.accuracy - a.accuracy || b.kpm - a.kpm,
    )[0];
}

/** 자리익힘에서 마지막으로 끝낸 단계 (0이면 없음) */
export function lastStageDone(lang: Lang, mode: 'place' | 'word'): number {
  return loadHistory()
    .filter((r) => r.lang === lang && r.mode === mode && r.accuracy >= 80)
    .reduce((m, r) => Math.max(m, r.key ?? 0), 0);
}

/* ---------- 글쇠별 통계 ---------- */

export interface KeyStat {
  /** 눌린 횟수 */
  n: number;
  /** 맞은 횟수 */
  ok: number;
  /** 맞았을 때 누르기까지 걸린 시간 합 (ms) */
  ms: number;
}

type KeyStats = Record<string, Record<Lang, Record<string, KeyStat>>>;

export function loadKeyStats(lang: Lang, user = currentUser()?.name ?? ''): Record<string, KeyStat> {
  const all = readJson<KeyStats>(KEYSTATS_KEY, {});
  return all[user]?.[lang] ?? {};
}

/** 한 회 연습이 끝났을 때 누적한다. samples: 기대 글자 → {n, ok, ms} */
export function mergeKeyStats(lang: Lang, samples: Record<string, KeyStat>): void {
  const user = currentUser()?.name ?? '';
  const all = readJson<KeyStats>(KEYSTATS_KEY, {});
  const byUser = (all[user] ??= { ko: {}, en: {} });
  const byLang = (byUser[lang] ??= {});
  for (const [ch, s] of Object.entries(samples)) {
    const cur = (byLang[ch] ??= { n: 0, ok: 0, ms: 0 });
    cur.n += s.n;
    cur.ok += s.ok;
    cur.ms += s.ms;
  }
  writeJson(KEYSTATS_KEY, all);
}

/** 연습 중 글쇠별 표본을 모으는 도우미 */
export class KeySampler {
  readonly samples: Record<string, KeyStat> = {};
  private last = 0;

  /** 새 목표가 보이기 시작한 순간 */
  mark(): void {
    this.last = performance.now();
  }

  record(expected: string, ok: boolean): void {
    const s = (this.samples[expected] ??= { n: 0, ok: 0, ms: 0 });
    s.n++;
    if (ok) {
      s.ok++;
      const dt = performance.now() - this.last;
      if (dt > 0 && dt < 5000) s.ms += dt;
    }
  }
}

/** 전체 내보내기 (파일로 보내기) */
export function exportAll(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      users: loadUsers(),
      history: loadAllHistory(),
      keystats: readJson(KEYSTATS_KEY, {}),
    },
    null,
    2,
  );
}
