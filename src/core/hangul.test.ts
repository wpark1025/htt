import { describe, expect, it } from 'vitest';
import { HangulAutomaton, toKeystrokes } from './hangul';

function type(seq: string): string {
  const a = new HangulAutomaton();
  for (const ch of seq) a.feed(ch);
  return a.text;
}

describe('HangulAutomaton', () => {
  it('composes basic syllables', () => {
    expect(type('ㄱㅏ')).toBe('가');
    expect(type('ㅇㅓㅁㅓㄴㅣ')).toBe('어머니');
  });

  it('handles 받침 and 도깨비불', () => {
    expect(type('ㄷㅏㄹ')).toBe('달');
    expect(type('ㄷㅏㄹㄱ')).toBe('닭');
    expect(type('ㄷㅏㄹㄱㅣ')).toBe('달기');
    expect(type('ㅇㅏㄴㄴㅕㅇ')).toBe('안녕');
  });

  it('handles compound vowels', () => {
    expect(type('ㄱㅗㅏ')).toBe('과');
    expect(type('ㅅㅏㄱㅗㅏ')).toBe('사과');
    expect(type('ㅇㅜㅣ')).toBe('위');
  });

  it('keeps standalone jamo', () => {
    expect(type('ㄱㄱ')).toBe('ㄱㄱ');
    expect(type('ㅏㄱ')).toBe('ㅏㄱ');
    expect(type('ㅏㅏ')).toBe('ㅏㅏ');
  });

  it('does not use ㄸㅃㅉ as 받침', () => {
    expect(type('ㄱㅏㄸ')).toBe('가ㄸ');
  });

  it('passes through non-hangul', () => {
    expect(type('ㄱㅏ a')).toBe('가 a');
  });

  it('backspaces within a syllable', () => {
    const a = new HangulAutomaton();
    for (const ch of 'ㄷㅏㄹㄱ') a.feed(ch);
    a.backspace();
    expect(a.text).toBe('달');
    a.backspace();
    expect(a.text).toBe('다');
    a.backspace();
    expect(a.text).toBe('ㄷ');
    a.backspace();
    expect(a.text).toBe('');
  });
});

describe('toKeystrokes', () => {
  it('splits syllables into 2-set key presses', () => {
    expect(toKeystrokes('사과')).toEqual(['ㅅ', 'ㅏ', 'ㄱ', 'ㅗ', 'ㅏ']);
    expect(toKeystrokes('닭')).toEqual(['ㄷ', 'ㅏ', 'ㄹ', 'ㄱ']);
    expect(toKeystrokes('빵')).toEqual(['ㅃ', 'ㅏ', 'ㅇ']);
    expect(toKeystrokes('a 가')).toEqual(['a', ' ', 'ㄱ', 'ㅏ']);
  });

  it('round-trips through the automaton', () => {
    for (const w of ['어머니', '닭갈비', '괜찮아요', '뷁', '꿈', '의사']) {
      const a = new HangulAutomaton();
      for (const ch of toKeystrokes(w)) a.feed(ch);
      expect(a.text).toBe(w);
    }
  });
});
