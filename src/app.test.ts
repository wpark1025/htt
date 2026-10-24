// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { findKey } from './core/keyboard';
import { KO_LAYOUT } from './data/ko/layout';

function press(code: string, shiftKey = false): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, shiftKey, bubbles: true, cancelable: true }));
}

function $(sel: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
}

describe('app smoke test', () => {
  beforeAll(async () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = '#/';
    await import('./main');
  });

  it('renders home with 8 zones', () => {
    expect(document.querySelectorAll('.zone-card').length).toBe(8);
    expect($('.hero h1').textContent).toContain('HTT');
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
    location.hash = '#/';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    document.querySelector<HTMLButtonElement>('[data-lang="en"]')!.click();
    expect($('.zone-card .zone-keys').textContent).toContain('a');
    document.querySelector<HTMLButtonElement>('.zone-card')!.click();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(location.hash).toBe('#/place/en/1');
    expect(/^[a-z;]$/.test($('.target-now').textContent!.trim())).toBe(true);
  });
});
