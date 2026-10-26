// 베네치아 줄거리. 타자기처럼 한 글자씩 나타난다. 사이띄개로 건너뛰고 ESC로 나간다.

import { t } from '../i18n';
import { esc, h, onKeys, type View } from './common';

export function renderStory(opts: { onExit(): void }): View {
  const text = t('venice.story');
  const el = h('section', 'practice story');
  el.innerHTML = `
    <header class="practice-top"><h2>${t('venice.story.title')}</h2></header>
    <div class="sea-field story-field">
      <pre class="story-text"></pre>
      <div class="tower"><div class="tower-input"></div><div class="bricks">${'<div class="brick-row"><i></i><i></i><i></i></div>'.repeat(5)}</div></div>
      <div class="sea"></div>
    </div>
    <p class="muted center hintline">${t('hint.space')} · ${t('hint.esc')}</p>
  `;
  const pre = el.querySelector<HTMLElement>('.story-text')!;
  const chars = [...text];
  let i = 0;
  let timer: number | null = window.setInterval(() => {
    i++;
    pre.innerHTML = esc(chars.slice(0, i).join(''));
    if (i >= chars.length && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }, 45);
  const off = onKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
        i = chars.length;
        pre.innerHTML = esc(text);
      } else opts.onExit();
    }
  }, opts.onExit);
  return {
    el,
    destroy() {
      if (timer !== null) clearInterval(timer);
      off();
    },
  };
}
