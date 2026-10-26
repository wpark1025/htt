import './style.css';
import type { Layout } from './core/keyboard';
import { loadSettings, saveSettings, type Lang, type LevelId, type Settings } from './core/settings';
import { currentUser, loadUsers } from './core/store';
import { poolFor } from './core/words';
import { EN_LAYOUT } from './data/en/layout';
import { EN_WORDS } from './data/en/words';
import { KO_LAYOUT } from './data/ko/layout';
import { KO_WORDS } from './data/ko/words';
import { STAGES } from './data/stages';
import type { WordEntry } from './data/words';
import { setUiLang, t } from './i18n';
import type { View } from './ui/common';
import { renderHelp, type HelpKind } from './ui/help';
import { renderHome } from './ui/home';
import { renderLongPractice, renderTextChooser, TEXTS } from './ui/long-practice';
import { renderPad } from './ui/pad';
import { renderPlacePractice } from './ui/place-practice';
import { PUZZLES, renderPuzzle, renderPuzzleChooser } from './ui/puzzle';
import { renderSentencePractice } from './ui/sentence-practice';
import { renderSettings } from './ui/settings-view';
import { renderShell, type Shell } from './ui/shell';
import { renderStats, type StatsKind } from './ui/stats';
import { renderStory } from './ui/story';
import { renderOnboarding, renderUsers } from './ui/users';
import { renderVenice, renderVeniceMenu } from './ui/venice';
import { renderWordPractice } from './ui/word-practice';
import { renderExamResults } from './ui/exam-results';

const layouts: Record<Lang, Layout> = { ko: KO_LAYOUT, en: EN_LAYOUT };
const words: Record<Lang, WordEntry[]> = { ko: KO_WORDS, en: EN_WORDS };
const app = document.querySelector<HTMLDivElement>('#app')!;

let settings: Settings = loadSettings();
let active: View | null = null;
let shell: Shell | null = null;

function applyTheme(): void {
  document.documentElement.dataset.theme = settings.theme;
}

function update(patch: Partial<Settings>): void {
  const before = settings;
  settings = { ...settings, ...patch };
  saveSettings(settings);
  if (patch.uiLang && patch.uiLang !== before.uiLang) {
    setUiLang(settings.uiLang);
    shell?.rebuild(settings.lang);
  }
  if (patch.lang && patch.lang !== before.lang) {
    shell?.rebuild(settings.lang);
    shell?.setLang(settings.lang);
  }
  if (patch.theme) applyTheme();
}

function go(hash: string): void {
  if (location.hash === hash) render();
  else location.hash = hash;
}

const home = () => go('#/');
const lang = () => settings.lang;
const layout = () => layouts[settings.lang];
const pool = (level: LevelId) => poolFor(words[lang()], lang(), layout(), level);

function mount(view: View, hint: string, menuFocus = false): void {
  active?.destroy();
  active = view;
  shell!.content.replaceChildren(view.el);
  shell!.setHint(hint);
  shell!.focusMenu(menuFocus);
  window.scrollTo(0, 0);
}

function route(): void {
  const hsh = location.hash || '#/';
  const seg = hsh.replace(/^#\//, '').split('/').filter(Boolean);
  const [a, b] = seg;
  const n = Number(b);
  const L = lang();
  const LY = layout();
  const stageOk = (x: number) => STAGES[L].some((s) => s.id === x);

  if (a === 'place' && stageOk(n)) {
    return mount(
      renderPlacePractice({ stage: n, lang: L, layout: LY, settings, onExit: home, onRetry: render, onNext: () => go(`#/place/${Math.min(10, n + 1)}`) }),
      t('hint.pressKey'),
    );
  }
  if (a === 'words' && stageOk(n)) {
    return mount(
      renderWordPractice({ stage: n, lang: L, layout: LY, settings, onExit: home, onRetry: render, onNext: () => go(`#/words/${Math.min(10, n + 1)}`) }),
      t('hint.typeWords'),
    );
  }
  if (a === 'short') return mount(renderSentencePractice({ lang: L, layout: LY, settings, onExit: home, onRetry: render }), t('hint.typeLine'));
  if (a === 'long' || a === 'exam') {
    const exam = a === 'exam';
    const text = b ? TEXTS[L].find((x) => x.id === b) : undefined;
    if (!text) return mount(renderTextChooser({ lang: L, exam, onPick: (id) => go(`#/${a}/${id}`) }), t('hint.menu'));
    return mount(renderLongPractice({ text, lang: L, layout: LY, settings, exam, onExit: home, onRetry: render }), t('hint.typeLine'));
  }
  if (a === 'exam-results') return mount(renderExamResults({ lang: L, onExit: home }), t('hint.esc'));
  if (a === 'pad') return mount(renderPad({ lang: L, layout: LY, onExit: home }), t('hint.pad'));
  if (a === 'venice') {
    if (b === 'play') {
      return mount(
        renderVenice({ lang: L, layout: LY, level: settings.level, pool: pool(settings.level), settings, onExit: () => go('#/venice'), onRetry: render }),
        t('hint.venice'),
      );
    }
    return mount(
      renderVeniceMenu({ lang: L, level: settings.level, onStart: () => go('#/venice/play'), onLevel: (level) => update({ level }), onExit: home }),
      t('hint.menu'),
    );
  }
  if (a === 'story') return mount(renderStory({ onExit: home }), t('hint.esc'));
  if (a === 'puzzle') {
    const p = PUZZLES[L].find((x) => x.id === n);
    if (!p) return mount(renderPuzzleChooser({ lang: L, onPick: (id) => go(`#/puzzle/${id}`) }), t('hint.menu'));
    return mount(renderPuzzle({ puzzle: p, lang: L, layout: LY, settings, onExit: home, onRetry: render }), t('hint.puzzle'));
  }
  if (a === 'stats') return mount(renderStats({ kind: (b as StatsKind) || 'progress', lang: L, onExit: home }), t('hint.esc'));
  if (a === 'help') return mount(renderHelp({ kind: (b as HelpKind) || 'about', layout: LY, onExit: home }), t('hint.space'));
  if (a === 'settings') return mount(renderSettings({ settings, onChange: update, onExit: home }), t('hint.esc'));
  if (a === 'users') {
    return mount(
      renderUsers({
        onChanged: () => shell!.setUser(currentUser()?.name ?? ''),
        onExit: home,
      }),
      t('hint.esc'),
    );
  }
  if (a === 'theme') {
    const order: Settings['theme'][] = ['light', 'dark', 'retro'];
    update({ theme: order[(order.indexOf(settings.theme) + 1) % order.length] });
    return home();
  }
  mount(renderHome({ settings, user: currentUser()?.name ?? '', onLang: (l) => { update({ lang: l }); render(); }, go }), t('hint.menu'), true);
}

function render(): void {
  if (!loadUsers().users.length) {
    active?.destroy();
    active = renderOnboarding({
      onDone(where) {
        shell!.setUser(currentUser()?.name ?? '');
        if (where === 'game') go('#/venice');
        else if (where === 'place') go('#/place/1');
        else home();
        if (location.hash === '#/' || location.hash === '') render();
      },
    });
    shell!.content.replaceChildren(active.el);
    shell!.setHint(t('hint.space'));
    shell!.focusMenu(false);
    return;
  }
  route();
}

setUiLang(settings.uiLang);
applyTheme();
shell = renderShell({ lang: settings.lang, user: currentUser()?.name ?? '', go });
app.replaceChildren(shell.el);
window.addEventListener('hashchange', render);
render();
