import type { Layout } from '../core/keyboard';
import { bestFor, type Lang, type Settings } from '../core/settings';
import { ZONES } from '../data/zones';

export function renderHome(opts: {
  settings: Settings;
  layouts: Record<Lang, Layout>;
  onChange(patch: Partial<Settings>): void;
  onStart(zone: number): void;
}): HTMLElement {
  const { settings, layouts } = opts;
  const lang = settings.lang;
  const layout = layouts[lang];

  const el = document.createElement('section');
  el.className = 'home';
  el.innerHTML = `
    <header class="hero">
      <h1>HTT 타자연습</h1>
      <p class="muted">키보드를 보지 않고 치는 연습. 한글과 영어, 수준은 설정으로.</p>
    </header>

    <div class="toolbar">
      <div class="seg" role="group" aria-label="언어">
        <button class="seg-btn ${lang === 'ko' ? 'on' : ''}" data-lang="ko">한글</button>
        <button class="seg-btn ${lang === 'en' ? 'on' : ''}" data-lang="en">English</button>
      </div>
      <label class="opt">문항
        <select data-opt="count">
          ${[20, 40, 80, 120].map((n) => `<option value="${n}" ${settings.count === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </label>
      <label class="opt"><input type="checkbox" data-opt="shift" ${settings.shift ? 'checked' : ''}> ${lang === 'ko' ? 'Shift (쌍자음·ㅒㅖ)' : 'Shift (대문자)'}</label>
      <label class="opt"><input type="checkbox" data-opt="sound" ${settings.sound ? 'checked' : ''}> 소리</label>
    </div>

    <h2 class="section-title">자리 연습</h2>
    <div class="zones"></div>

    <p class="muted foot">기록은 이 기기에만 저장돼요. 서버로 보내지 않아요.</p>
  `;

  const zonesEl = el.querySelector('.zones')!;
  for (const z of ZONES) {
    const keys = z.codes.map((c) => layout.keys[c]?.base ?? '').filter(Boolean);
    const best = bestFor(lang, z.id);
    const card = document.createElement('button');
    card.className = 'zone-card';
    card.innerHTML = `
      <span class="zone-num">${z.id}</span>
      <span class="zone-name">${z.name[lang]}</span>
      <span class="zone-keys">${keys.map((k) => `<kbd>${k}</kbd>`).join('')}</span>
      <span class="zone-best">${best ? `최고 ${best.accuracy}% · ${best.kpm}타/분` : '아직 기록 없음'}</span>
    `;
    card.addEventListener('click', () => opts.onStart(z.id));
    zonesEl.appendChild(card);
  }

  el.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => opts.onChange({ lang: b.dataset.lang as Lang })),
  );
  el.querySelector<HTMLSelectElement>('[data-opt="count"]')!.addEventListener('change', (e) =>
    opts.onChange({ count: Number((e.target as HTMLSelectElement).value) as Settings['count'] }),
  );
  el.querySelector<HTMLInputElement>('[data-opt="shift"]')!.addEventListener('change', (e) =>
    opts.onChange({ shift: (e.target as HTMLInputElement).checked }),
  );
  el.querySelector<HTMLInputElement>('[data-opt="sound"]')!.addEventListener('change', (e) =>
    opts.onChange({ sound: (e.target as HTMLInputElement).checked }),
  );

  return el;
}
