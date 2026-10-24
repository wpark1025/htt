import './style.css';
import type { Layout } from './core/keyboard';
import { loadSettings, saveSettings, type Lang, type Settings } from './core/settings';
import { EN_LAYOUT } from './data/en/layout';
import { KO_LAYOUT } from './data/ko/layout';
import { ZONES } from './data/zones';
import { renderHome } from './ui/home';
import { renderPlacePractice, type PracticeHandle } from './ui/place-practice';

const layouts: Record<Lang, Layout> = { ko: KO_LAYOUT, en: EN_LAYOUT };
const app = document.querySelector<HTMLDivElement>('#app')!;

let settings: Settings = loadSettings();
let active: PracticeHandle | null = null;

type Route = { name: 'home' } | { name: 'place'; lang: Lang; zone: number };

function parseRoute(): Route {
  const m = location.hash.match(/^#\/place\/(ko|en)\/(\d+)$/);
  if (m) {
    const zone = Number(m[2]);
    if (ZONES.some((z) => z.id === zone)) return { name: 'place', lang: m[1] as Lang, zone };
  }
  return { name: 'home' };
}

function go(hash: string): void {
  if (location.hash === hash) render();
  else location.hash = hash;
}

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
        onChange(patch) {
          settings = { ...settings, ...patch };
          saveSettings(settings);
          render();
        },
        onStart(zone) {
          go(`#/place/${settings.lang}/${zone}`);
        },
      }),
    );
    return;
  }

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
  app.appendChild(active.el);
}

window.addEventListener('hashchange', render);
render();
