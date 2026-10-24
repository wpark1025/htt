// 두벌식 한글 오토마타. OS IME를 쓰지 않고 자모를 하나씩 받아 글자를 조합한다.

export const CHO = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
export const JUNG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
export const JONG = [...' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ']; // 0번은 받침 없음

const COMPOUND_JUNG: Record<string, string> = {
  'ㅗㅏ': 'ㅘ',
  'ㅗㅐ': 'ㅙ',
  'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ',
  'ㅜㅔ': 'ㅞ',
  'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
};
const COMPOUND_JONG: Record<string, string> = {
  'ㄱㅅ': 'ㄳ',
  'ㄴㅈ': 'ㄵ',
  'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ',
  'ㄹㅁ': 'ㄻ',
  'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ',
  'ㄹㅍ': 'ㄿ',
  'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ',
};
const SPLIT_JUNG: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(COMPOUND_JUNG).map(([k, v]) => [v, [k[0], k[1]] as [string, string]]),
);
const SPLIT_JONG: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(COMPOUND_JONG).map(([k, v]) => [v, [k[0], k[1]] as [string, string]]),
);

export const isCho = (c: string) => CHO.includes(c);
export const isJung = (c: string) => JUNG.includes(c);
export const isJongable = (c: string) => JONG.indexOf(c) > 0;
export const isJamo = (c: string) => isCho(c) || isJung(c);

export function composeSyllable(cho: string, jung: string, jong = ''): string {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const gi = jong ? JONG.indexOf(jong) : 0;
  if (ci < 0 || ji < 0 || gi < 0) throw new Error(`invalid jamo ${cho}${jung}${jong}`);
  return String.fromCharCode(0xac00 + ci * 588 + ji * 28 + gi);
}

export function isSyllable(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3;
}

/** 완성형 글자 → [초성, 중성, 종성('' 가능)] */
export function splitSyllable(ch: string): [string, string, string] {
  const c = ch.charCodeAt(0) - 0xac00;
  return [CHO[Math.floor(c / 588)], JUNG[Math.floor((c % 588) / 28)], JONG[c % 28].trim()];
}

/**
 * 문자열을 두벌식으로 칠 때 눌러야 하는 자모 순서로 분해한다.
 * 복합 모음/복합 받침은 두 번의 키 입력으로 나눈다. 쌍자음은 Shift 한 번이므로 한 글자 유지.
 * 한글이 아닌 글자는 그대로 둔다.
 */
export function toKeystrokes(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    if (isSyllable(ch)) {
      const [cho, jung, jong] = splitSyllable(ch);
      out.push(cho);
      out.push(...(SPLIT_JUNG[jung] ?? [jung]));
      if (jong) out.push(...(SPLIT_JONG[jong] ?? [jong]));
    } else if (SPLIT_JUNG[ch]) {
      out.push(...SPLIT_JUNG[ch]);
    } else if (SPLIT_JONG[ch]) {
      out.push(...SPLIT_JONG[ch]);
    } else {
      out.push(ch);
    }
  }
  return out;
}

export interface AutomatonState {
  cho: string;
  jung: string;
  jong: string;
}

/**
 * 키 하나씩 받아서 문자열을 만드는 오토마타.
 * `committed`는 확정된 글자들, `composing()`은 지금 조합 중인 글자(없으면 '').
 */
export class HangulAutomaton {
  committed = '';
  private s: AutomatonState = { cho: '', jung: '', jong: '' };

  get text(): string {
    return this.committed + this.composing();
  }

  composing(): string {
    const { cho, jung, jong } = this.s;
    if (cho && jung) return composeSyllable(cho, jung, jong);
    return cho || jung || '';
  }

  reset(): void {
    this.committed = '';
    this.s = { cho: '', jung: '', jong: '' };
  }

  private commit(): void {
    this.committed += this.composing();
    this.s = { cho: '', jung: '', jong: '' };
  }

  /** 자모 또는 일반 문자 하나 입력 */
  feed(ch: string): void {
    if (isCho(ch)) this.feedConsonant(ch);
    else if (isJung(ch)) this.feedVowel(ch);
    else {
      this.commit();
      this.committed += ch;
    }
  }

  private feedConsonant(c: string): void {
    const s = this.s;
    if (!s.cho) {
      if (s.jung) this.commit(); // 홀로 선 모음 뒤에 자음
      this.s.cho = c;
      return;
    }
    if (!s.jung) {
      // 자음 뒤에 자음: 앞 자음은 홀로 확정
      this.commit();
      this.s.cho = c;
      return;
    }
    if (!s.jong) {
      if (isJongable(c)) s.jong = c;
      else {
        this.commit();
        this.s.cho = c;
      }
      return;
    }
    const compound = COMPOUND_JONG[s.jong + c];
    if (compound) s.jong = compound;
    else {
      this.commit();
      this.s.cho = c;
    }
  }

  private feedVowel(v: string): void {
    const s = this.s;
    if (!s.cho) {
      if (!s.jung) {
        s.jung = v;
        return;
      }
      const compound = COMPOUND_JUNG[s.jung + v];
      if (compound) s.jung = compound;
      else {
        this.commit();
        this.s.jung = v;
      }
      return;
    }
    if (!s.jung) {
      s.jung = v;
      return;
    }
    if (!s.jong) {
      const compound = COMPOUND_JUNG[s.jung + v];
      if (compound) s.jung = compound;
      else {
        this.commit();
        this.s.jung = v;
      }
      return;
    }
    // 받침이 있는데 모음이 오면 받침(의 마지막 자음)이 다음 글자 초성으로 넘어간다 (도깨비불)
    const split = SPLIT_JONG[s.jong];
    let carry: string;
    if (split) {
      s.jong = split[0];
      carry = split[1];
    } else {
      carry = s.jong;
      s.jong = '';
    }
    this.commit();
    this.s.cho = carry;
    this.s.jung = v;
  }

  backspace(): void {
    const s = this.s;
    if (s.jong) {
      s.jong = SPLIT_JONG[s.jong]?.[0] ?? '';
    } else if (s.jung) {
      s.jung = SPLIT_JUNG[s.jung]?.[0] ?? '';
    } else if (s.cho) {
      s.cho = '';
    } else if (this.committed) {
      this.committed = [...this.committed].slice(0, -1).join('');
    }
  }
}
