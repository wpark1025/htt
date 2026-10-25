// 산성비. 낱말이 위에서 떨어지고, 바닥에 닿기 전에 쳐서 Space/Enter로 확정하면 사라진다.
// 다섯 번 놓치면 끝. 10개를 잡을 때마다 단계가 올라가며 조금씩 빨라진다.

import { charForEvent, MODIFIER_CODES, type Layout } from '../core/keyboard';
import { appendHistory, type Lang, type Settings } from '../core/settings';
import { sfx } from '../core/sound';
import { createTyper } from '../core/typer';
import type { WordInfo } from '../core/words';
import type { WordLevel } from '../data/levels';
import type { PracticeHandle } from './place-practice';

interface Drop {
  info: WordInfo;
  el: HTMLElement;
  spawnAt: number;
  /** 떨어지는 데 걸리는 시간(ms) */
  fallMs: number;
}

const LIVES = 5;
const PER_STAGE = 10;
/** 속도 설정별 한 낱말이 바닥까지 가는 시간(초) */
const FALL_SECONDS: Record<number, number> = { 1: 12, 2: 9.5, 3: 7.5, 4: 6, 5: 4.5 };

export function renderRainGame(opts: {
  lang: Lang;
  layout: Layout;
  level: WordLevel;
  pool: WordInfo[];
  settings: Settings;
  onExit(): void;
  onRetry(): void;
}): PracticeHandle {
  const { lang, layout, level, pool, settings } = opts;
  const typer = createTyper(lang);
  const drops: Drop[] = [];
  let lives = LIVES;
  let score = 0;
  let caught = 0;
  let missed = 0;
  let wrongSubmits = 0;
  let strokes = 0; // 잡은 낱말의 타수 합
  let stage = 1;
  let startedAt = 0;
  let lastSpawn = 0;
  let over = false;
  let timer: number | null = null;
  let raf: number | null = null;
  let lastWord = '';

  const el = document.createElement('section');
  el.className = 'practice rain';
  el.innerHTML = `
    <header class="practice-top">
      <button class="btn btn-ghost" data-act="exit">← 돌아가기</button>
      <h2>산성비 · 수준 ${level.id} ${level.name[lang]}</h2>
      <div class="stats">
        <span>점수 <b data-stat="score">0</b></span>
        <span>단계 <b data-stat="stage">1</b></span>
        <span class="lives" data-stat="lives"></span>
      </div>
    </header>
    <div class="rain-field"></div>
    <div class="rain-input"><span class="rain-typed"></span><span class="caret"></span></div>
    <p class="muted rain-hint">낱말을 치고 Space 또는 Enter. 틀렸으면 Backspace.</p>
  `;

  const field = el.querySelector<HTMLElement>('.rain-field')!;
  const inputEl = el.querySelector<HTMLElement>('.rain-input')!;
  const typedEl = el.querySelector<HTMLElement>('.rain-typed')!;
  const scoreEl = el.querySelector<HTMLElement>('[data-stat="score"]')!;
  const stageEl = el.querySelector<HTMLElement>('[data-stat="stage"]')!;
  const livesEl = el.querySelector<HTMLElement>('[data-stat="lives"]')!;
  el.querySelector('[data-act="exit"]')!.addEventListener('click', () => opts.onExit());

  const fallMs = () => FALL_SECONDS[settings.rainSpeed] * 1000 * Math.pow(0.93, stage - 1);
  const spawnEvery = () => Math.max(900, fallMs() / 3);

  function drawLives(): void {
    livesEl.textContent = '♥'.repeat(lives) + '♡'.repeat(LIVES - lives);
  }

  function spawn(now: number): void {
    let pick = pool[Math.floor(Math.random() * pool.length)];
    for (let g = 0; g < 10 && (pick.w === lastWord || drops.some((d) => d.info.w === pick.w)); g++) {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
    lastWord = pick.w;
    const w = document.createElement('div');
    w.className = 'rain-word';
    w.textContent = pick.w;
    // 가로 위치: 6칸 중 하나 + 약간의 흔들림. 긴 낱말은 오른쪽으로 덜 간다.
    const col = Math.floor(Math.random() * 6);
    const maxLeft = Math.max(10, 86 - pick.w.length * 3);
    w.style.left = `${Math.min(maxLeft, col * 15 + 3 + Math.random() * 6)}%`;
    w.style.transform = 'translateY(-100%)';
    field.appendChild(w);
    drops.push({ info: pick, el: w, spawnAt: now, fallMs: fallMs() });
    lastSpawn = now;
  }

  function removeDrop(d: Drop, ok: boolean): void {
    drops.splice(drops.indexOf(d), 1);
    d.el.classList.add(ok ? 'pop' : 'splash');
    setTimeout(() => d.el.remove(), 300);
  }

  function tick(): void {
    if (over) return;
    const now = performance.now();
    if (now - lastSpawn >= spawnEvery()) spawn(now);
    const h = field.clientHeight || 400;
    for (const d of [...drops]) {
      const t = (now - d.spawnAt) / d.fallMs;
      if (t >= 1) {
        removeDrop(d, false);
        missed++;
        lives--;
        drawLives();
        if (settings.sound) sfx.miss();
        field.classList.remove('flash-bad');
        void field.offsetWidth;
        field.classList.add('flash-bad');
        if (lives <= 0) {
          finish();
          return;
        }
      } else {
        d.el.style.transform = `translateY(${Math.round(t * h)}px)`;
      }
    }
  }

  function loop(): void {
    tick();
    if (!over) raf = requestAnimationFrame(loop);
  }

  function start(): void {
    startedAt = performance.now();
    drawLives();
    spawn(startedAt);
    if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
    else timer = window.setInterval(tick, 33);
  }

  function stop(): void {
    over = true;
    if (raf !== null) cancelAnimationFrame(raf);
    if (timer !== null) clearInterval(timer);
  }

  function submit(): void {
    const text = typer.text.trim();
    typer.reset();
    typedEl.textContent = '';
    if (!text) return;
    // 같은 낱말이 둘이면 더 아래(먼저 떨어진) 것을 잡는다
    const hit = drops.find((d) => d.info.w === text);
    if (hit) {
      removeDrop(hit, true);
      caught++;
      strokes += hit.info.strokes.length;
      score += hit.info.strokes.length * 10 * stage;
      scoreEl.textContent = String(score);
      if (settings.sound) sfx.hit();
      if (caught % PER_STAGE === 0) {
        stage++;
        stageEl.textContent = String(stage);
      }
    } else {
      wrongSubmits++;
      if (settings.sound) sfx.miss();
      inputEl.classList.remove('shake');
      void inputEl.offsetWidth;
      inputEl.classList.add('shake');
    }
  }

  function finish(): void {
    stop();
    for (const d of drops) d.el.remove();
    drops.length = 0;
    const ms = Math.max(1, performance.now() - startedAt);
    const submits = caught + wrongSubmits;
    const accuracy = submits ? Math.round((caught / submits) * 1000) / 10 : 100;
    const kpm = Math.round((strokes / ms) * 60000);
    appendHistory({
      ts: Date.now(),
      lang,
      mode: 'rain',
      level: level.id,
      count: caught + missed,
      correct: strokes,
      wrong: wrongSubmits,
      ms,
      kpm,
      accuracy,
      score,
    });
    if (settings.sound) sfx.done();

    const result = document.createElement('div');
    result.className = 'result';
    result.innerHTML = `
      <h3>${caught >= 30 ? '대단해요!' : caught >= 10 ? '잘했어요!' : '다시 해 볼까요?'}</h3>
      <div class="result-grid">
        <div><span class="big">${score}</span><span>점수</span></div>
        <div><span class="big">${stage}</span><span>단계</span></div>
        <div><span class="big">${caught}</span><span>잡은 낱말</span></div>
        <div><span class="big">${kpm}</span><span>타/분</span></div>
      </div>
      <p class="muted">놓친 낱말 ${missed}개 · 정확도 ${accuracy}% · ${Math.round(ms / 1000)}초</p>
      <div class="result-actions">
        <button class="btn btn-primary" data-act="retry">다시 하기</button>
        <button class="btn btn-ghost" data-act="exit">처음으로</button>
      </div>
    `;
    result.querySelector('[data-act="retry"]')!.addEventListener('click', () => opts.onRetry());
    result.querySelector('[data-act="exit"]')!.addEventListener('click', () => opts.onExit());
    field.replaceWith(result);
    inputEl.remove();
    el.querySelector('.rain-hint')?.remove();
  }

  function onKey(e: KeyboardEvent): void {
    if (over) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat && e.code !== 'Backspace') return;
    if (!e.code) return;
    if (e.code === 'Escape') {
      opts.onExit();
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      submit();
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
  }

  window.addEventListener('keydown', onKey);
  start();

  return {
    el,
    destroy() {
      stop();
      window.removeEventListener('keydown', onKey);
    },
  };
}
