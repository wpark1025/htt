import type { Layout } from '../core/keyboard';
import { bestFor, type Lang, type Settings } from '../core/settings';
import type { WordInfo } from '../core/words';
import { LEVELS, levelById } from '../data/levels';
import { ZONES } from '../data/zones';

export function renderHome(opts: {
  settings: Settings;
  layouts: Record<Lang, Layout>;
  /** 현재 언어·수준의 낱말 묶음 (보기용) */
  pool: WordInfo[];
  onChange(patch: Partial<Settings>): void;
  onStart(target: 'word' | 'rain' | { zone: number }): void;
}): HTMLElement {
  const { settings, layouts, pool } = opts;
  const lang = settings.lang;
  const layout = layouts[lang];
  const level = levelById(settings.level);

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
      <label class="opt">낱말 수준
        <select data-opt="level">
          ${LEVELS.map((l) => `<option value="${l.id}" ${settings.level === l.id ? 'selected' : ''}>${l.id}. ${l.name[lang]}</option>`).join('')}
        </select>
      </label>
      <label class="opt"><input type="checkbox" data-opt="sound" ${settings.sound ? 'checked' : ''}> 소리</label>
    </div>

    <div class="sec-head">
      <h2 class="section-title">자리 연습</h2>
      <div class="sec-opts">
        <label class="opt">문항
          <select data-opt="count">
            ${[20, 40, 80, 120].map((n) => `<option value="${n}" ${settings.count === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        <label class="opt"><input type="checkbox" data-opt="shift" ${settings.shift ? 'checked' : ''}> ${lang === 'ko' ? 'Shift (쌍자음·ㅒㅖ)' : 'Shift (대문자)'}</label>
      </div>
    </div>
    <div class="zones"></div>

    <div class="sec-head">
      <h2 class="section-title">낱말 연습</h2>
      <div class="sec-opts">
        <label class="opt">낱말 수
          <select data-opt="wordCount">
            ${[10, 20, 40].map((n) => `<option value="${n}" ${settings.wordCount === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        <label class="opt"><input type="checkbox" data-opt="showKeyboard" ${settings.showKeyboard ? 'checked' : ''}> 화면 키보드</label>
      </div>
    </div>
    <div class="cards">
      <button class="big-card" data-start="word">
        <span class="big-card-title">수준 ${level.id} · ${level.name[lang]}</span>
        <span class="muted">${level.desc[lang]} · 낱말 ${pool.length}개 중 ${settings.wordCount}개</span>
        <span class="zone-keys word-sample"></span>
        <span class="zone-best" data-best="word"></span>
      </button>
    </div>

    <div class="sec-head">
      <h2 class="section-title">미니게임</h2>
      <div class="sec-opts">
        <label class="opt">속도
          <select data-opt="rainSpeed">
            ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${settings.rainSpeed === n ? 'selected' : ''}>${['', '아주 느림', '느림', '보통', '빠름', '아주 빠름'][n]}</option>`).join('')}
          </select>
        </label>
      </div>
    </div>
    <div class="cards">
      <button class="big-card rain-card" data-start="rain">
        <span class="big-card-title">산성비 ☔</span>
        <span class="muted">떨어지는 낱말을 바닥에 닿기 전에 쳐요. 수준 ${level.id} 낱말, 다섯 번 놓치면 끝.</span>
        <span class="zone-best" data-best="rain"></span>
      </button>
    </div>

    <p class="muted foot">기록은 이 기기에만 저장돼요. 서버로 보내지 않아요.</p>
  `;

  const zonesEl = el.querySelector('.zones')!;
  for (const z of ZONES) {
    const keys = z.codes.map((c) => layout.keys[c]?.base ?? '').filter(Boolean);
    const best = bestFor(lang, 'place', z.id);
    const card = document.createElement('button');
    card.className = 'zone-card';
    card.innerHTML = `
      <span class="zone-num">${z.id}</span>
      <span class="zone-name">${z.name[lang]}</span>
      <span class="zone-keys">${keys.map((k) => `<kbd>${k}</kbd>`).join('')}</span>
      <span class="zone-best">${best ? `최고 ${best.accuracy}% · ${best.kpm}타/분` : '아직 기록 없음'}</span>
    `;
    card.addEventListener('click', () => opts.onStart({ zone: z.id }));
    zonesEl.appendChild(card);
  }

  // 낱말 보기: 묶음에서 몇 개만
  const sample = [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
  el.querySelector('.word-sample')!.innerHTML = sample.map((w) => `<kbd>${w.w}</kbd>`).join('');
  const bestWord = bestFor(lang, 'word', level.id);
  el.querySelector('[data-best="word"]')!.textContent = bestWord
    ? `최고 ${bestWord.accuracy}% · ${bestWord.kpm}타/분`
    : '아직 기록 없음';
  const bestRain = bestFor(lang, 'rain', level.id);
  el.querySelector('[data-best="rain"]')!.textContent = bestRain
    ? `최고 ${bestRain.score}점 · ${bestRain.kpm}타/분`
    : '아직 기록 없음';

  el.querySelectorAll<HTMLButtonElement>('[data-start]').forEach((b) =>
    b.addEventListener('click', () => opts.onStart(b.dataset.start as 'word' | 'rain')),
  );
  el.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => opts.onChange({ lang: b.dataset.lang as Lang })),
  );

  const num = <K extends keyof Settings>(key: K) =>
    el.querySelector<HTMLSelectElement>(`[data-opt="${key}"]`)!.addEventListener('change', (e) =>
      opts.onChange({ [key]: Number((e.target as HTMLSelectElement).value) } as Partial<Settings>),
    );
  const bool = <K extends keyof Settings>(key: K) =>
    el.querySelector<HTMLInputElement>(`[data-opt="${key}"]`)!.addEventListener('change', (e) =>
      opts.onChange({ [key]: (e.target as HTMLInputElement).checked } as Partial<Settings>),
    );
  num('level');
  num('count');
  num('wordCount');
  num('rainSpeed');
  bool('sound');
  bool('shift');
  bool('showKeyboard');

  return el;
}
