// 베네치아. 바다 위 돌탑에서 떨어지는 낱말을 쳐 낸다. 놓칠 때마다 물이 차오르고 다섯 번이면 탑이 잠긴다.

import { charForEvent, MODIFIER_CODES, type Layout } from '../core/keyboard';
import type { Lang, LevelId, Settings } from '../core/settings';
import { appendHistory, loadHistory } from '../core/store';
import { createTyper } from '../core/typer';
import type { WordInfo } from '../core/words';
import { t } from '../i18n';
import { choiceList, dialog, esc, fmtDate, h, onKeys, play, type View } from './common';

interface Drop {
  info: WordInfo;
  el: HTMLElement;
  spawnAt: number;
  fallMs: number;
}

const LIVES = 5;
const PER_STAGE = 10;
const FALL_SECONDS: Record<number, number> = { 1: 13, 2: 10, 3: 8, 4: 6.5, 5: 5 };

/** 시작 대화상자: 게임 시작 / 점수판 / 단계 조정 */
export function renderVeniceMenu(opts: {
  lang: Lang;
  level: LevelId;
  onStart(): void;
  onLevel(level: LevelId): void;
  onExit(): void;
}): View {
  const el = h('section', 'venice-menu');
  let sub: View | null = null;
  let kind: 'main' | 'sub' = 'main';
  const show = (view: View, k: 'main' | 'sub' = 'sub') => {
    sub?.destroy();
    sub = view;
    kind = k;
    el.replaceChildren(view.el);
  };
  const main = (): View => {
    const list = choiceList(
      [
        { label: t('venice.start'), value: 'start' },
        { label: t('venice.scores'), value: 'scores' },
        { label: `${t('venice.levelAdjust')} (${t('common.level')} ${opts.level})`, value: 'level' },
      ],
      (v) => {
        if (v === 'start') opts.onStart();
        else if (v === 'scores') show(scores());
        else show(levels());
      },
    );
    const body = h('div');
    body.appendChild(h('p', 'center', t('venice.intro')));
    body.appendChild(list.el);
    return { el: dialog(t('venice.title'), body), destroy: list.destroy };
  };
  const levels = (): View => {
    const list = choiceList(
      [1, 2, 3, 4, 5].map((n) => ({ label: `${t('venice.stageN', { n })} · ${t(`level.${n}` as 'level.1')}`, value: String(n) })),
      (v) => {
        opts.onLevel(Number(v) as LevelId);
        show(main(), 'main');
      },
      opts.level - 1,
    );
    return { el: dialog(t('venice.levelAdjust'), list.el), destroy: list.destroy };
  };
  const scores = (): View => {
    const rows = loadHistory()
      .filter((r) => r.mode === 'venice' && r.lang === opts.lang)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);
    const table = h(
      'table',
      'board',
      `<thead><tr><th>${t('common.rank')}</th><th>${t('common.name')}</th><th>${t('common.level')}</th><th>${t('common.stage')}</th><th>${t('common.score')}</th><th>${t('common.date')}</th></tr></thead>
       <tbody>${Array.from({ length: 10 }, (_, i) => {
         const r = rows[i];
         return `<tr><td>${i + 1}</td><td>${r ? esc(r.user) : ''}</td><td>${r ? r.key : ''}</td><td>${r ? r.stage : ''}</td><td>${r ? r.score : ''}</td><td>${r ? fmtDate(r.ts) : ''}</td></tr>`;
       }).join('')}</tbody>`,
    );
    const body = h('div');
    body.appendChild(table);
    const btn = h('button', 'btn center', t('common.back'));
    btn.addEventListener('click', () => show(main(), 'main'));
    body.appendChild(btn);
    const off = onKeys((e) => {
      if (e.code === 'Enter' || e.code === 'Space') show(main(), 'main');
    });
    return { el: dialog(t('venice.board'), body), destroy: off };
  };
  show(main(), 'main');
  const off = onKeys(() => {}, () => (kind === 'main' ? opts.onExit() : show(main(), 'main')));
  return {
    el,
    destroy() {
      off();
      sub?.destroy();
    },
  };
}

export function renderVenice(opts: {
  lang: Lang;
  layout: Layout;
  level: LevelId;
  pool: WordInfo[];
  settings: Settings;
  onExit(): void;
  onRetry(): void;
}): View {
  const { lang, layout, level, pool, settings } = opts;
  const typer = createTyper(lang);
  const drops: Drop[] = [];
  let lives = LIVES;
  let score = 0;
  let caught = 0;
  let missed = 0;
  let wrongSubmits = 0;
  let strokes = 0;
  let stage = 1;
  let startedAt = 0;
  let lastSpawn = 0;
  let over = false;
  let paused = true;
  let raf: number | null = null;
  let timer: number | null = null;
  let lastWord = '';

  const el = h('section', 'practice venice');
  el.innerHTML = `
    <header class="practice-top">
      <h2>${t('venice.title')}</h2>
      <div class="stats">
        <span>${t('common.stage')} <b data-stat="stage">1</b></span>
        <span>${t('common.score')} <b data-stat="score">0</b></span>
        <span class="lives" data-stat="lives"></span>
      </div>
    </header>
    <div class="sea-field">
      <div class="sky"></div>
      <div class="tower">
        <div class="tower-input"><span class="tower-typed"></span><span class="caret"></span></div>
        <div class="bricks">${'<div class="brick-row"><i></i><i></i><i></i></div>'.repeat(LIVES)}</div>
      </div>
      <div class="sea"></div>
      <div class="banner"></div>
    </div>
    <p class="muted center hintline">${t('hint.venice')}</p>
  `;
  const field = el.querySelector<HTMLElement>('.sea-field')!;
  const sky = el.querySelector<HTMLElement>('.sky')!;
  const sea = el.querySelector<HTMLElement>('.sea')!;
  const banner = el.querySelector<HTMLElement>('.banner')!;
  const typedEl = el.querySelector<HTMLElement>('.tower-typed')!;
  const inputEl = el.querySelector<HTMLElement>('.tower-input')!;
  const scoreEl = el.querySelector<HTMLElement>('[data-stat="score"]')!;
  const stageEl = el.querySelector<HTMLElement>('[data-stat="stage"]')!;
  const livesEl = el.querySelector<HTMLElement>('[data-stat="lives"]')!;

  const fallMs = () => FALL_SECONDS[settings.gameSpeed] * 1000 * Math.pow(0.93, stage - 1);
  const spawnEvery = () => Math.max(900, fallMs() / 3);

  function paintLives(): void {
    livesEl.textContent = '♥'.repeat(lives) + '♡'.repeat(LIVES - lives);
    // 물이 차오른다: 놓친 수만큼 벽돌 줄이 잠긴다
    sea.style.height = `${10 + (LIVES - lives) * 8}%`;
  }

  function showBanner(text: string, ms: number, then?: () => void): void {
    banner.textContent = text;
    banner.classList.add('on');
    paused = true;
    setTimeout(() => {
      banner.classList.remove('on');
      paused = false;
      lastSpawn = performance.now() - spawnEvery();
      for (const d of drops) d.spawnAt += ms;
      then?.();
    }, ms);
  }

  function spawn(now: number): void {
    let pick = pool[Math.floor(Math.random() * pool.length)];
    for (let g = 0; g < 10 && (pick.w === lastWord || drops.some((d) => d.info.w === pick.w)); g++) pick = pool[Math.floor(Math.random() * pool.length)];
    lastWord = pick.w;
    const w = h('div', 'drop', esc(pick.w));
    const col = Math.floor(Math.random() * 6);
    w.style.left = `${Math.min(Math.max(8, 86 - pick.w.length * 3), col * 15 + 3 + Math.random() * 6)}%`;
    w.style.transform = 'translateY(-100%)';
    sky.appendChild(w);
    drops.push({ info: pick, el: w, spawnAt: now, fallMs: fallMs() });
    lastSpawn = now;
  }

  function removeDrop(d: Drop, ok: boolean): void {
    drops.splice(drops.indexOf(d), 1);
    d.el.classList.add(ok ? 'pop' : 'splash');
    setTimeout(() => d.el.remove(), 350);
  }

  function tick(): void {
    if (over || paused) return;
    const now = performance.now();
    if (now - lastSpawn >= spawnEvery()) spawn(now);
    const hgt = sky.clientHeight || 360;
    for (const d of [...drops]) {
      const p = (now - d.spawnAt) / d.fallMs;
      if (p >= 1) {
        removeDrop(d, false);
        missed++;
        lives--;
        paintLives();
        play(settings.sound, 'miss');
        field.classList.remove('flash-bad');
        void field.offsetWidth;
        field.classList.add('flash-bad');
        if (lives <= 0) {
          finish();
          return;
        }
      } else d.el.style.transform = `translateY(${Math.round(p * hgt)}px)`;
    }
  }

  function loop(): void {
    tick();
    if (!over) raf = requestAnimationFrame(loop);
  }

  function submit(): void {
    const text = typer.text.trim();
    typer.reset();
    typedEl.textContent = '';
    if (!text) return;
    const hit = drops.find((d) => d.info.w === text);
    if (hit) {
      removeDrop(hit, true);
      caught++;
      strokes += hit.info.strokes.length;
      score += hit.info.strokes.length * 10 * stage;
      scoreEl.textContent = String(score);
      play(settings.sound, 'hit');
      if (caught % PER_STAGE === 0) {
        stage++;
        stageEl.textContent = String(stage);
        showBanner(t('venice.stageN', { n: stage }), 1200);
      }
    } else {
      wrongSubmits++;
      play(settings.sound, 'miss');
      inputEl.classList.remove('shake');
      void inputEl.offsetWidth;
      inputEl.classList.add('shake');
    }
  }

  function finish(): void {
    over = true;
    if (raf !== null) cancelAnimationFrame(raf);
    if (timer !== null) clearInterval(timer);
    for (const d of drops) d.el.remove();
    drops.length = 0;
    const ms = Math.max(1, performance.now() - startedAt);
    const submits = caught + wrongSubmits;
    const accuracy = submits ? Math.round((caught / submits) * 1000) / 10 : 100;
    const kpm = Math.round((strokes / ms) * 60000);
    appendHistory({ lang, mode: 'venice', key: level, count: caught + missed, correct: strokes, wrong: wrongSubmits, ms, kpm, accuracy, score, stage });
    play(settings.sound, 'done');
    field.classList.add('sunk');
    const body = h(
      'div',
      '',
      `<p class="center">${t('venice.sunk')}</p>
       <div class="result-grid">
         <div><span class="big">${score}</span><span>${t('common.score')}</span></div>
         <div><span class="big">${stage}</span><span>${t('common.stage')}</span></div>
         <div><span class="big">${caught}</span><span>${t('venice.caught')}</span></div>
         <div><span class="big">${missed}</span><span>${t('venice.missed')}</span></div>
       </div>`,
    );
    const list = choiceList(
      [
        { label: t('common.retry'), value: 'retry' },
        { label: t('common.toMenu'), value: 'menu' },
      ],
      (v) => (v === 'retry' ? opts.onRetry() : opts.onExit()),
    );
    body.appendChild(list.el);
    el.appendChild(h('div', 'overlay')).appendChild(dialog(t('venice.title'), body));
    endList = list;
  }
  let endList: View | null = null;

  const off = onKeys((e) => {
    if (over) return;
    if (e.repeat && e.code !== 'Backspace') return;
    if (!e.code) return;
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      if (!paused) submit();
      return;
    }
    if (e.code === 'Backspace') {
      e.preventDefault();
      typer.backspace();
      typedEl.textContent = typer.text;
      return;
    }
    if (MODIFIER_CODES.has(e.code)) return;
    const ch = charForEvent(layout, e);
    if (ch === null) return;
    e.preventDefault();
    typer.feed(ch);
    typedEl.textContent = typer.text;
  }, opts.onExit);

  startedAt = performance.now();
  paintLives();
  showBanner(t('venice.stageN', { n: 1 }), 1200, () => spawn(performance.now()));
  if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
  else timer = window.setInterval(tick, 33);

  return {
    el,
    destroy() {
      over = true;
      if (raf !== null) cancelAnimationFrame(raf);
      if (timer !== null) clearInterval(timer);
      off();
      endList?.destroy();
    },
  };
}
