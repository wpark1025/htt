// 자리 연습 화면. 구역의 키를 무작위로 보여주고 물리 키 입력을 채점한다.

import { MODIFIER_CODES, shiftCodeFor, type Layout } from '../core/keyboard';
import { appendHistory, type Lang, type Settings } from '../core/settings';
import { sfx } from '../core/sound';
import { shiftCodesFor, type Zone } from '../data/zones';
import { renderFingerLegend, renderKeyboard } from './keyboard';

interface Target {
  code: string;
  shift: boolean;
  label: string;
}

function buildTargets(zone: Zone, lang: Lang, layout: Layout, settings: Settings): Target[] {
  const pool: Target[] = [];
  for (const code of zone.codes) {
    const chars = layout.keys[code];
    if (!chars) continue;
    pool.push({ code, shift: false, label: chars.base });
  }
  if (settings.shift) {
    for (const code of shiftCodesFor(zone, lang)) {
      const chars = layout.keys[code];
      if (chars?.shift) pool.push({ code, shift: true, label: chars.shift });
    }
  }
  const out: Target[] = [];
  let last: Target | null = null;
  for (let i = 0; i < settings.count; i++) {
    let pick: Target;
    let guard = 0;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
    } while (pool.length > 1 && pick === last && guard++ < 10);
    out.push(pick);
    last = pick;
  }
  return out;
}

export interface PracticeHandle {
  el: HTMLElement;
  destroy(): void;
}

export function renderPlacePractice(opts: {
  zone: Zone;
  lang: Lang;
  layout: Layout;
  settings: Settings;
  onExit(): void;
  onNext(): void;
  onRetry(): void;
}): PracticeHandle {
  const { zone, lang, layout, settings } = opts;
  const targets = buildTargets(zone, lang, layout, settings);
  let idx = 0;
  let correct = 0;
  let wrong = 0;
  let startedAt = 0;
  let finished = false;
  const missByLabel = new Map<string, number>();

  const el = document.createElement('section');
  el.className = 'practice';
  el.innerHTML = `
    <header class="practice-top">
      <button class="btn btn-ghost" data-act="exit">← 돌아가기</button>
      <h2>${zone.id}. ${zone.name[lang]}</h2>
      <div class="stats">
        <span><b data-stat="progress">0</b> / ${targets.length}</span>
        <span>정확도 <b data-stat="acc">100</b>%</span>
      </div>
    </header>
    <div class="target-area">
      <div class="target-now" aria-live="polite"></div>
      <div class="target-next"></div>
    </div>
  `;

  const kb = renderKeyboard(layout);
  el.appendChild(kb.el);
  el.appendChild(renderFingerLegend());

  const nowEl = el.querySelector<HTMLElement>('.target-now')!;
  const nextEl = el.querySelector<HTMLElement>('.target-next')!;
  const progEl = el.querySelector<HTMLElement>('[data-stat="progress"]')!;
  const accEl = el.querySelector<HTMLElement>('[data-stat="acc"]')!;

  el.querySelector('[data-act="exit"]')!.addEventListener('click', () => opts.onExit());

  function show(): void {
    const t = targets[idx];
    if (!t) return;
    nowEl.textContent = t.label;
    nowEl.classList.toggle('needs-shift', t.shift);
    nextEl.innerHTML = targets
      .slice(idx + 1, idx + 9)
      .map((n) => `<span>${n.label}</span>`)
      .join('');
    kb.setTarget(t.code, t.shift ? shiftCodeFor(t.code) : null);
    progEl.textContent = String(idx);
    const total = correct + wrong;
    accEl.textContent = total ? String(Math.round((correct / total) * 100)) : '100';
  }

  function finish(): void {
    finished = true;
    const ms = Math.max(1, Date.now() - startedAt);
    const total = correct + wrong;
    const accuracy = total ? Math.round((correct / total) * 1000) / 10 : 100;
    const kpm = Math.round((correct / ms) * 60000);
    appendHistory({ ts: Date.now(), lang, zone: zone.id, count: targets.length, correct, wrong, ms, kpm, accuracy });
    if (settings.sound) sfx.done();
    kb.setTarget(null);

    const worst = [...missByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const result = document.createElement('div');
    result.className = 'result';
    result.innerHTML = `
      <h3>${accuracy >= 95 ? '아주 잘했어요!' : accuracy >= 80 ? '잘했어요!' : '조금 더 연습해요'}</h3>
      <div class="result-grid">
        <div><span class="big">${accuracy}%</span><span>정확도</span></div>
        <div><span class="big">${kpm}</span><span>타/분</span></div>
        <div><span class="big">${Math.round(ms / 1000)}초</span><span>걸린 시간</span></div>
      </div>
      ${
        worst.length
          ? `<p class="muted">자주 틀린 글자: ${worst.map(([l, n]) => `<b>${l}</b> ${n}번`).join(', ')}</p>`
          : '<p class="muted">한 번도 틀리지 않았어요.</p>'
      }
      <div class="result-actions">
        <button class="btn" data-act="retry">다시 하기</button>
        <button class="btn btn-primary" data-act="next">다음 자리 →</button>
        <button class="btn btn-ghost" data-act="exit">처음으로</button>
      </div>
    `;
    result.querySelector('[data-act="retry"]')!.addEventListener('click', () => opts.onRetry());
    result.querySelector('[data-act="next"]')!.addEventListener('click', () => opts.onNext());
    result.querySelector('[data-act="exit"]')!.addEventListener('click', () => opts.onExit());
    el.querySelector('.target-area')!.replaceWith(result);
    progEl.textContent = String(targets.length);
  }

  function onKey(e: KeyboardEvent): void {
    if (finished) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;
    if (!e.code || MODIFIER_CODES.has(e.code)) return;
    if (e.code === 'Escape') {
      opts.onExit();
      return;
    }
    e.preventDefault();
    if (!startedAt) startedAt = Date.now();

    const t = targets[idx];
    const chars = layout.keys[t.code];
    // 이 키에 Shift 글자가 없으면 Shift 여부는 따지지 않는다 (입문자 배려)
    const shiftMatters = Boolean(chars?.shift);
    const ok = e.code === t.code && (!shiftMatters || e.shiftKey === t.shift);

    kb.flash(e.code, ok);
    if (settings.sound) (ok ? sfx.hit : sfx.miss)();

    if (ok) {
      correct++;
      idx++;
      if (idx >= targets.length) finish();
      else show();
    } else {
      wrong++;
      missByLabel.set(t.label, (missByLabel.get(t.label) ?? 0) + 1);
      nowEl.classList.remove('shake');
      void nowEl.offsetWidth;
      nowEl.classList.add('shake');
      show();
    }
  }

  window.addEventListener('keydown', onKey);
  show();

  return {
    el,
    destroy() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
