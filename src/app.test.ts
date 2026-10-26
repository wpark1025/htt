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
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('app', () => {
  beforeAll(async () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = '#/';
    await import('./main');
  });

  it('처음엔 이름만 묻고 바로 홈', () => {
    expect($('.name-form input')).toBeTruthy();
    const input = $('.name-form input') as HTMLInputElement;
    input.value = '테스트';
    $('.name-form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect($('.status-user').textContent).toBe('테스트');
    expect(document.querySelectorAll('.menubar .menu').length).toBe(7);
    expect($('.home')).toBeTruthy();
  });

  it('메뉴 막대를 키보드로 다닌다', () => {
    press('ArrowDown');
    expect(document.querySelector('.menu.open')).toBeTruthy();
    press('ArrowRight');
    press('Enter'); // 자리익힘 1단계
    expect(location.hash).toBe('#/place/1');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  it('자리익힘: 틀린 키는 진행 안 되고 맞는 키는 진행', () => {
    const target = $('.target-now').textContent!.trim();
    const key = findKey(KO_LAYOUT, target)!;
    expect($('.key.target').dataset.code).toBe(key.code);
    expect($('.fingers .finger.on')).toBeTruthy();
    press(key.code === 'KeyA' ? 'KeyS' : 'KeyA');
    expect($('[data-stat="progress"]').textContent).toBe('0');
    press(key.code, key.shift);
    expect($('[data-stat="progress"]').textContent).toBe('1');
    for (let i = 0; i < 300 && !document.querySelector('.result'); i++) {
      const k = findKey(KO_LAYOUT, $('.target-now').textContent!.trim())!;
      press(k.code, k.shift);
    }
    expect($('.result')).toBeTruthy();
    const h = JSON.parse(localStorage.getItem('htt.history')!);
    expect(h.at(-1)).toMatchObject({ mode: 'place', key: 1, user: '테스트' });
  });

  it('낱말익힘: 배운 글쇠로만 된 낱말 줄을 받아쓴다', async () => {
    goto('#/words/1');
    const line = $('.line.active .line-target').textContent!.replace(/ /g, ' ');
    expect(line.length).toBeGreaterThan(0);
    for (const s of toKeystrokes(line)) expect('ㅁㄴㅇㄹㅓㅏㅣ; '.includes(s), s).toBe(true);
    // 틀린 키 → 화살표
    const first = findKey(KO_LAYOUT, toKeystrokes(line)[0])!;
    press(first.code === 'KeyA' ? 'KeyS' : 'KeyA');
    expect(document.querySelector('.line-target .ch.err')).toBeTruthy();
    press('Backspace');
    typeKo(line);
    await wait(300);
    for (let i = 0; i < 20 && !document.querySelector('.result'); i++) {
      const l = $('.line.active .line-target').textContent!.replace(/ /g, ' ');
      typeKo(l);
      await wait(300);
    }
    expect($('.result')).toBeTruthy();
  });

  it('단문 연습: ESC 두 번이면 메뉴로, Enter로 넘어가고 결과가 남는다', () => {
    goto('#/short');
    press('Escape');
    expect(document.querySelector('.overlay')).toBeTruthy();
    press('Escape');
    expect(location.hash).toBe('#/');
    goto('#/short');
    for (let i = 0; i < 10; i++) {
      const line = $('.line.active .line-target').textContent!.replace(/ /g, ' ');
      typeKo(line);
      press('Enter');
    }
    expect($('.result')).toBeTruthy();
  });

  it('타자 검정: 글 고르기 → 안내 → 결과에 유효 타와 등급', () => {
    goto('#/exam');
    press('Enter');
    expect(location.hash).toMatch(/^#\/exam\/\w+/);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect($('.dialog p').textContent).toContain('3');
    press('Space');
    const lines = document.querySelectorAll('.page .line').length;
    for (let i = 0; i < lines; i++) {
      const l = $('.line.active .line-target').textContent!.replace(/ /g, ' ');
      typeKo(l);
    }
    expect($('.result')).toBeTruthy();
    expect($('.result').textContent).toContain('유효 타');
    goto('#/exam-results');
    expect(document.querySelectorAll('table.board tbody tr').length).toBe(1);
  });

  it('베네치아: 낱말을 치고 Enter로 잡는다', async () => {
    goto('#/venice');
    press('Enter');
    expect(location.hash).toBe('#/venice/play');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await wait(1400); // 단계 배너
    const word = $('.drop').textContent!;
    typeKo(word);
    press('Enter');
    expect(Number($('[data-stat="score"]').textContent)).toBeGreaterThan(0);
  });

  it('낱말맞추기: 정답을 채우면 풀린다', () => {
    goto('#/puzzle/1');
    expect($('[data-clue="across"]').textContent!.length).toBeGreaterThan(3);
    // 가로 1: 사과나무
    typeKo('사과나무');
    press('ArrowDown');
    // 세로 1: 사자 → (1,0) 자
    press('ArrowLeft');
    press('ArrowLeft');
    press('ArrowLeft');
    press('ArrowLeft');
    typeKo('자');
    press('Enter');
    expect(document.querySelectorAll('.cell.ok').length).toBe(5); // 사과나무 + 사자 (사 공유)
  });

  it('앱 언어를 영어로 바꾸면 메뉴가 영어', () => {
    goto('#/settings');
    const sel = $('[data-key="uiLang"]') as HTMLSelectElement;
    sel.value = 'en';
    sel.dispatchEvent(new Event('change'));
    expect($('.menubar').textContent).toContain('Key Drills');
    const lang = $('[data-key="lang"]') as HTMLSelectElement;
    lang.value = 'en';
    lang.dispatchEvent(new Event('change'));
    goto('#/place/1');
    expect(/^[a-z;]$/.test($('.target-now').textContent!.trim())).toBe(true);
  });
});
