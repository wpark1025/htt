import './style.css';
import type { Layout } from './core/keyboard';
import { loadSettings, saveSettings, type Lang, type LevelId, type Settings } from './core/settings';
import { pickWords, poolFor } from './core/words';
import { EN_LAYOUT } from './data/en/layout';
import { EN_WORDS } from './data/en/words';
import { KO_LAYOUT } from './data/ko/layout';
import { KO_WORDS } from './data/ko/words';
import { LEVELS, levelById } from './data/levels';
import type { WordEntry } from './data/words';
import { ZONES } from './data/zones';
import { renderHome } from './ui/home';
import { renderPlacePractice, type PracticeHandle } from './ui/place-practice';
import { renderRainGame } from './ui/rain-game';
import { renderWordPractice } from './ui/word-practice';

const layouts: Record<Lang, Layout> = { ko: KO_LAYOUT, en: EN_LAYOUT };
const words: Record<Lang, WordEntry[]> = { ko: KO_WORDS, en: EN_WORDS };
const app = document.querySelector<HTMLDivElement>('#app')!;

let settings: Settings = loadSettings();
let active: PracticeHandle | null = null;

type Route =
  | { name: 'home' }
  | { name: 'place'; lang: Lang; zone: number }
  | { name: 'word'; lang: Lang; level: LevelId }
  | { name: 'rain'; lang: Lang; level: LevelId };

function parseRoute(): Route {
  const m = location.hash.match(/^#\/(place|word|rain)\/(ko|en)\/(\d+)$/);
  if (!m) return { name: 'home' };
  const lang = m[2] as Lang;
  const n = Number(m[3]);
  if (m[1] === 'place') {
    if (ZONES.some((z) => z.id === n)) return { name: 'place', lang, zone: n };
  } else if (LEVELS.some((l) => l.id === n)) {
    return { name: m[1] as 'word' | 'rain', lang, level: n as LevelId };
  }
  return { name: 'home' };
}

function go(hash: string): void {
  if (location.hash === hash) render();
  else location.hash = hash;
}

const pool = (lang: Lang, level: LevelId) => poolFor(words[lang], lang, layouts[lang], level);

function render(): void {
  active?.destroy();
  active = null;
  app.replaceChildren();

  const route = parseRoute();
  if (route.name === 'home') {
    app.appendChild(
      renderHome({
        settings,
        layouts,
        pool: pool(settings.lang, settings.level),
        onChange(patch) {
          settings = { ...settings, ...patch };
          saveSettings(settings);
          render();
        },
        onStart(target) {
          if (target === 'word') go(`#/word/${settings.lang}/${settings.level}`);
          else if (target === 'rain') go(`#/rain/${settings.lang}/${settings.level}`);
          else go(`#/place/${settings.lang}/${target.zone}`);
        },
      }),
    );
    return;
  }

  if (route.name === 'place') {
    const zone = ZONES.find((z) => z.id === route.zone)!;
    const nextZone = ZONES.find((z) => z.id === route.zone + 1);
    active = renderPlacePractice({
      zone,
      lang: route.lang,
      layout: layouts[route.lang],
      settings,
      onExit: () => go('#/'),
      onRetry: () => render(),
      onNext: () => (nextZone ? go(`#/place/${route.lang}/${nextZone.id}`) : go('#/')),
    });
  } else if (route.name === 'word') {
    const level = levelById(route.level);
    active = renderWordPractice({
      lang: route.lang,
      layout: layouts[route.lang],
      level,
      words: pickWords(pool(route.lang, route.level), settings.wordCount),
      settings,
      onExit: () => go('#/'),
      onRetry: () => render(),
      onNext: () => {
        const next = Math.min(5, route.level + 1) as LevelId;
        settings = { ...settings, level: next };
        saveSettings(settings);
        go(`#/word/${route.lang}/${next}`);
      },
    });
  } else {
    active = renderRainGame({
      lang: route.lang,
      layout: layouts[route.lang],
      level: levelById(route.level),
      pool: pool(route.lang, route.level),
      settings,
      onExit: () => go('#/'),
      onRetry: () => render(),
    });
  }
  app.appendChild(active.el);
}

window.addEventListener('hashchange', render);
render();
