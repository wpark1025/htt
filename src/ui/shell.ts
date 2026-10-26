// 앱 틀: 제목줄(시계), 메뉴 막대(펼침 메뉴), 내용 영역, 상태줄. 원작의 화면 구조를 따른다.

import { t, type I18nKey } from '../i18n';
import type { Lang } from '../core/settings';
import { STAGES } from '../data/stages';
import { stageName } from '../i18n';
import { esc, h } from './common';

export interface MenuItem {
  label: string;
  hash: string;
}

export interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

export function buildMenus(lang: Lang): Menu[] {
  const stages = STAGES[lang];
  return [
    {
      id: 'home',
      label: t('menu.home'),
      items: [
        { label: t('menu.user.switch'), hash: '#/users' },
        { label: t('menu.settings'), hash: '#/settings' },
        { label: t('menu.theme'), hash: '#/theme' },
      ],
    },
    {
      id: 'place',
      label: t('menu.place'),
      items: stages.map((s) => ({ label: `${s.id}. ${stageName(lang, s.id)} ${t('stage.drill')}`, hash: `#/place/${s.id}` })),
    },
    {
      id: 'words',
      label: t('menu.words'),
      items: stages.map((s) => ({ label: `${s.id}. ${stageName(lang, s.id)}`, hash: `#/words/${s.id}` })),
    },
    {
      id: 'sentences',
      label: t('menu.sentences'),
      items: [
        { label: t('menu.sent.short'), hash: '#/short' },
        { label: t('menu.sent.long'), hash: '#/long' },
        { label: t('menu.sent.pad'), hash: '#/pad' },
        { label: t('menu.sent.exam'), hash: '#/exam' },
        { label: t('menu.sent.examResults'), hash: '#/exam-results' },
      ],
    },
    {
      id: 'games',
      label: t('menu.games'),
      items: [
        { label: t('menu.game.venice'), hash: '#/venice' },
        { label: t('menu.game.story'), hash: '#/story' },
        { label: t('menu.game.puzzle'), hash: '#/puzzle' },
      ],
    },
    {
      id: 'stats',
      label: t('menu.stats'),
      items: [
        { label: t('menu.stats.progress'), hash: '#/stats/progress' },
        { label: t('menu.stats.speed'), hash: '#/stats/speed' },
        { label: t('menu.stats.accuracy'), hash: '#/stats/accuracy' },
        { label: t('menu.stats.export'), hash: '#/stats/export' },
      ],
    },
    {
      id: 'help',
      label: t('menu.help'),
      items: [
        { label: t('menu.help.about'), hash: '#/help/about' },
        { label: t('menu.help.fingers'), hash: '#/help/fingers' },
        { label: t('menu.help.usage'), hash: '#/help/usage' },
      ],
    },
  ];
}

export interface Shell {
  el: HTMLElement;
  content: HTMLElement;
  setHint(text: string): void;
  setUser(name: string): void;
  setLang(lang: Lang): void;
  /** 메뉴 막대에 키보드 초점을 준다 (홈 화면에서) */
  focusMenu(on: boolean): void;
  rebuild(lang: Lang): void;
  destroy(): void;
}

export function renderShell(opts: { lang: Lang; user: string; go(hash: string): void }): Shell {
  const el = h('div', 'shell');
  el.innerHTML = `
    <header class="titlebar">
      <span class="titlebar-left"></span>
      <h1>${t('app.title')}</h1>
      <span class="clock" aria-hidden="true"><span class="clock-face"></span></span>
    </header>
    <nav class="menubar" role="menubar"></nav>
    <main class="content"></main>
    <footer class="statusbar"><span class="hint"></span><span class="status-right"><span class="status-lang"></span><span class="status-user"></span></span></footer>
  `;
  const nav = el.querySelector<HTMLElement>('.menubar')!;
  const content = el.querySelector<HTMLElement>('.content')!;
  const hint = el.querySelector<HTMLElement>('.hint')!;
  const userEl = el.querySelector<HTMLElement>('.status-user')!;
  const langEl = el.querySelector<HTMLElement>('.status-lang')!;
  const clockFace = el.querySelector<HTMLElement>('.clock-face')!;

  let menus: Menu[] = [];
  let open = -1; // 열린 메뉴
  let sel = 0; // 열린 메뉴의 선택 항목
  let focused = false;

  function paint(): void {
    nav.querySelectorAll<HTMLElement>('.menu').forEach((m, i) => {
      m.classList.toggle('open', i === open);
      m.querySelectorAll<HTMLElement>('.menu-item').forEach((it, j) => it.classList.toggle('on', i === open && j === sel));
    });
  }

  function build(lang: Lang): void {
    menus = buildMenus(lang);
    nav.innerHTML = '';
    menus.forEach((m, i) => {
      const wrap = h('div', 'menu');
      const btn = h('button', 'menu-btn', esc(m.label));
      btn.setAttribute('role', 'menuitem');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        open = open === i ? -1 : i;
        sel = 0;
        paint();
      });
      btn.addEventListener('mouseenter', () => {
        if (open >= 0 && open !== i) {
          open = i;
          sel = 0;
          paint();
        }
      });
      const list = h('div', 'menu-list');
      m.items.forEach((it) => {
        const a = h('a', 'menu-item', esc(it.label));
        a.setAttribute('href', it.hash);
        a.addEventListener('click', (e) => {
          e.preventDefault();
          open = -1;
          paint();
          opts.go(it.hash);
        });
        list.appendChild(a);
      });
      wrap.append(btn, list);
      nav.appendChild(wrap);
    });
    paint();
  }

  function onKey(e: KeyboardEvent): void {
    if (!focused || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (open < 0) {
      if (e.code === 'ArrowDown' || e.code === 'Enter' || e.code === 'F10') {
        open = 0;
        sel = 0;
      } else if (e.code === 'ArrowLeft') open = menus.length - 1;
      else if (e.code === 'ArrowRight') open = 0;
      else return;
      e.preventDefault();
      paint();
      return;
    }
    const m = menus[open];
    if (e.code === 'ArrowRight') open = (open + 1) % menus.length;
    else if (e.code === 'ArrowLeft') open = (open - 1 + menus.length) % menus.length;
    else if (e.code === 'ArrowDown') sel = (sel + 1) % m.items.length;
    else if (e.code === 'ArrowUp') sel = (sel - 1 + m.items.length) % m.items.length;
    else if (e.code === 'Enter' || e.code === 'Space') {
      const it = m.items[sel];
      open = -1;
      paint();
      e.preventDefault();
      opts.go(it.hash);
      return;
    } else if (e.code === 'Escape') open = -1;
    else return;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') sel = 0;
    e.preventDefault();
    paint();
  }
  const onDocClick = () => {
    if (open >= 0) {
      open = -1;
      paint();
    }
  };
  window.addEventListener('keydown', onKey);
  document.addEventListener('click', onDocClick);

  // 시계: 원작의 노란 아날로그 시계
  clockFace.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/><line class="hh" x1="20" y1="20" x2="20" y2="10"/><line class="mh" x1="20" y1="20" x2="20" y2="6"/></svg>`;
  const hh = clockFace.querySelector<SVGLineElement>('.hh')!;
  const mh = clockFace.querySelector<SVGLineElement>('.mh')!;
  const tick = () => {
    const d = new Date();
    hh.setAttribute('transform', `rotate(${(d.getHours() % 12) * 30 + d.getMinutes() * 0.5} 20 20)`);
    mh.setAttribute('transform', `rotate(${d.getMinutes() * 6} 20 20)`);
  };
  tick();
  const timer = window.setInterval(tick, 30000);

  build(opts.lang);
  userEl.textContent = opts.user;
  langEl.textContent = t(`common.lang.${opts.lang}` as I18nKey);

  return {
    el,
    content,
    setHint: (text) => (hint.textContent = text),
    setUser: (name) => (userEl.textContent = name),
    setLang(lang) {
      langEl.textContent = t(`common.lang.${lang}` as I18nKey);
    },
    focusMenu(on) {
      focused = on;
      if (!on) {
        open = -1;
        paint();
      }
    },
    rebuild: build,
    destroy() {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDocClick);
      clearInterval(timer);
    },
  };
}
