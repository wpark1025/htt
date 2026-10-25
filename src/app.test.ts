// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { toKeystrokes } from './core/hangul';
import { findKey } from './core/keyboard';
import { KO_LAYOUT } from './data/ko/layout';

function press(code: string, shiftKey = false): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, shiftKey, bubbles: true, cancelable: true }));
}

function typeKo(text: string): void {
  for (const s of toKeystrokes(text)) {
    const k = findKey(KO_LAYOUT, s)!;
    press(k.code, k.shift);
  }
}

function $(sel: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
}

function goto(hash: string): void {
  location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('app smoke test', () => {
  beforeAll(async () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = '#/';
    await import('./main');
  });

  it('renders home with 8 zones, word practice and a game', () => {
    expect(document.querySelectorAll('.zone-card').length).toBe(8);
    expect($('.hero h1').textContent).toContain('HTT');
    expect($('[data-start="word"]')).toBeTruthy();
    expect($('[data-start="rain"]')).toBeTruthy();
    expect(document.querySelectorAll('[data-opt="level"] option').length).toBe(5);
  });

  it('starts zone 1 practice and scores keys', () => {
    const first = document.querySelector<HTMLButtonElement>('.zone-card')!;
    first.click();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(location.hash).toBe('#/place/ko/1');
    expect(document.querySelectorAll('.kbd .key').length).toBeGreaterThan(50);

    const target = $('.target-now').textContent!.trim();
    const key = findKey(KO_LAYOUT, target)!;
    expect(key).toBeTruthy();
    expect($('.key.target').dataset.code).toBe(key.code);

    // 틀린 키
    press(key.code === 'KeyA' ? 'KeyS' : 'KeyA');
    expect($('[data-stat="progress"]').textContent).toBe('0');
    expect(Number($('[data-stat="acc"]').textContent)).toBeLessThan(100);

    // 맞는 키
    press(key.code, key.shift);
    expect($('[data-stat="progress"]').textContent).toBe('1');
  });

  it('finishes a round and shows a result', () => {
    for (let i = 0; i < 200 && !document.querySelector('.result'); i++) {
      const target = $('.target-now').textContent!.trim();
      const key = findKey(KO_LAYOUT, target)!;
      press(key.code, key.shift);
    }
    expect($('.result')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('htt.history')!).length).toBe(1);
  });

  it('switches to English layout', () => {
    goto('#/');
    document.querySelector<HTMLButtonElement>('[data-lang="en"]')!.click();
    expect($('.zone-card .zone-keys').textContent).toContain('a');
    document.querySelector<HTMLButtonElement>('.zone-card')!.click();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(location.hash).toBe('#/place/en/1');
    expect(/^[a-z;]$/.test($('.target-now').textContent!.trim())).toBe(true);
  });

  it('word practice: types level-1 Korean words key by key', () => {
    goto('#/');
    document.querySelector<HTMLButtonElement>('[data-lang="ko"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-start="word"]')!.click();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(location.hash).toBe('#/word/ko/1');
    expect($('.word-target').textContent!.length).toBeGreaterThan(0);
    expect($('.key.target')).toBeTruthy();

    // 틀린 키: 진행 안 됨
    const first = $('.word-target').textContent!;
    const firstKey = findKey(KO_LAYOUT, toKeystrokes(first)[0])!;
    press(firstKey.code === 'KeyA' ? 'KeyS' : 'KeyA');
    expect($('.word-target').textContent).toBe(first);
    expect(Number($('[data-stat="acc"]').textContent)).toBeLessThan(100);

    // 첫 낱말 완성 → 다음 낱말
    typeKo(first);
    expect($('[data-stat="progress"]').textContent).toBe('1');

    for (let i = 0; i < 40 && !document.querySelector('.result'); i++) {
      typeKo($('.word-target').textContent!);
    }
    expect($('.result')).toBeTruthy();
    const history = JSON.parse(localStorage.getItem('htt.history')!) as { mode?: string; level?: number }[];
    expect(history.at(-1)).toMatchObject({ mode: 'word', level: 1 });
  });

  it('rain game: catches a falling word with Enter and loses on Escape-free exit', () => {
    goto('#/rain/ko/1');
    const word = $('.rain-word').textContent!;
    expect(word.length).toBeGreaterThan(0);
    typeKo(word);
    expect($('.rain-typed').textContent).toBe(word);
    press('Enter');
    expect(Number($('[data-stat="score"]').textContent)).toBeGreaterThan(0);
    expect($('.rain-typed').textContent).toBe('');

    // 틀린 낱말 제출은 점수 변화 없음
    const before = $('[data-stat="score"]').textContent;
    typeKo('가');
    press('Space');
    expect($('[data-stat="score"]').textContent).toBe(before);

    goto('#/');
    expect(document.querySelector('.rain-field')).toBeNull();
  });
});
