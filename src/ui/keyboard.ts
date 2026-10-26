import { FINGER_NAME, ROWS, type Finger, type Layout } from '../core/keyboard';

export interface KeyboardView {
  el: HTMLElement;
  /** 다음에 눌러야 할 키를 표시한다. shift가 true면 반대 손 Shift도 함께 표시. */
  setTarget(code: string | null, shiftCode?: string | null): void;
  /** 눌린 키에 맞음/틀림 반짝임 */
  flash(code: string, ok: boolean): void;
}

export function renderKeyboard(layout: Layout): KeyboardView {
  const el = document.createElement('div');
  el.className = 'kbd';
  const keyEls = new Map<string, HTMLElement>();

  for (const row of ROWS) {
    const r = document.createElement('div');
    r.className = 'kbd-row';
    for (const pk of row) {
      const k = document.createElement('div');
      k.className = `key finger-${pk.finger}`;
      k.dataset.code = pk.code;
      if (pk.w) k.style.flexGrow = String(pk.w);
      const chars = layout.keys[pk.code];
      if (pk.label !== undefined) {
        k.classList.add('key-fn');
        k.textContent = pk.label;
      } else if (chars) {
        const base = document.createElement('span');
        base.className = 'key-base';
        base.textContent = chars.base;
        k.appendChild(base);
        if (chars.shift && chars.shift.toLowerCase() !== chars.base) {
          const sh = document.createElement('span');
          sh.className = 'key-shift';
          sh.textContent = chars.shift;
          k.appendChild(sh);
        }
      }
      keyEls.set(pk.code, k);
      r.appendChild(k);
    }
    el.appendChild(r);
  }

  let current: HTMLElement[] = [];

  return {
    el,
    setTarget(code, shiftCode) {
      for (const c of current) c.classList.remove('target');
      current = [];
      if (code) {
        const k = keyEls.get(code);
        if (k) current.push(k);
      }
      if (shiftCode) {
        const s = keyEls.get(shiftCode);
        if (s) current.push(s);
      }
      for (const c of current) c.classList.add('target');
    },
    flash(code, ok) {
      const k = keyEls.get(code);
      if (!k) return;
      const cls = ok ? 'hit' : 'miss';
      k.classList.remove('hit', 'miss');
      // 강제 리플로우로 애니메이션 재시작
      void k.offsetWidth;
      k.classList.add(cls);
      setTimeout(() => k.classList.remove(cls), 220);
    },
  };
}

export function renderFingerLegend(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'legend';
  const order: Finger[] = ['LP', 'LR', 'LM', 'LI', 'TH', 'RI', 'RM', 'RR', 'RP'];
  for (const f of order) {
    const item = document.createElement('span');
    item.className = `legend-item finger-${f}`;
    item.textContent = FINGER_NAME[f];
    el.appendChild(item);
  }
  return el;
}

/** 손가락 표시: 자판 아래 삼각형 8개. 칠 손가락이 채워진다 (원작의 ▲). */
export interface FingerView {
  el: HTMLElement;
  set(finger: Finger | null): void;
}

export function renderFingers(): FingerView {
  const el = document.createElement('div');
  el.className = 'fingers';
  const order: Finger[] = ['LP', 'LR', 'LM', 'LI', 'TH', 'RI', 'RM', 'RR', 'RP'];
  const els = new Map<Finger, HTMLElement>();
  for (const f of order) {
    const d = document.createElement('div');
    d.className = `finger finger-${f}`;
    d.title = FINGER_NAME[f];
    els.set(f, d);
    el.appendChild(d);
  }
  return {
    el,
    set(finger) {
      for (const [f, d] of els) d.classList.toggle('on', f === finger);
    },
  };
}
