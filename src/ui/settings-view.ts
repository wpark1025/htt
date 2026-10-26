// 환경 설정 화면. 바꾸면 바로 저장된다.

import type { Settings } from '../core/settings';
import { t, type I18nKey } from '../i18n';
import { esc, h, onKeys, type View } from './common';

export function renderSettings(opts: { settings: Settings; onChange(patch: Partial<Settings>): void; onExit(): void }): View {
  const s = opts.settings;
  const el = h('section', 'practice settings');
  const sel = (key: keyof Settings, options: { v: string | number; label: string }[]) =>
    `<label class="row"><span>${esc(t(`settings.${key}` as I18nKey))}</span><select data-key="${key}">${options
      .map((o) => `<option value="${o.v}" ${String(s[key]) === String(o.v) ? 'selected' : ''}>${esc(o.label)}</option>`)
      .join('')}</select></label>`;
  const chk = (key: keyof Settings) =>
    `<label class="row"><span>${esc(t(`settings.${key}` as I18nKey))}</span><input type="checkbox" data-key="${key}" ${s[key] ? 'checked' : ''}></label>`;
  el.innerHTML = `
    <header class="practice-top"><h2>${t('settings.title')}</h2></header>
    <div class="work form">
      ${sel('uiLang', [
        { v: 'ko', label: '한국어' },
        { v: 'en', label: 'English' },
      ])}
      ${sel('lang', [
        { v: 'ko', label: t('common.lang.ko') },
        { v: 'en', label: t('common.lang.en') },
      ])}
      ${sel('count', [50, 100, 200].map((v) => ({ v, label: String(v) })))}
      ${sel('wordCount', [10, 20, 40].map((v) => ({ v, label: String(v) })))}
      ${chk('showKeyboard')}
      ${sel('level', [1, 2, 3, 4, 5].map((v) => ({ v, label: `${v}. ${t(`level.${v}` as I18nKey)}` })))}
      ${sel('gameSpeed', [1, 2, 3, 4, 5].map((v) => ({ v, label: t(`speed.${v}` as I18nKey) })))}
      ${sel('examMinutes', [1, 3, 5].map((v) => ({ v, label: `${v} ${t('common.minutes')}` })))}
      ${chk('sound')}
      ${sel('theme', ['light', 'dark', 'retro'].map((v) => ({ v, label: t(`settings.theme.${v}` as I18nKey) })))}
      <p class="muted" data-msg></p>
    </div>
  `;
  const msg = el.querySelector<HTMLElement>('[data-msg]')!;
  el.querySelectorAll<HTMLSelectElement | HTMLInputElement>('[data-key]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.key as keyof Settings;
      const raw = input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : input.value;
      const value = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
      opts.onChange({ [key]: value } as Partial<Settings>);
      msg.textContent = t('settings.saved');
    });
  });
  const off = onKeys(() => {}, opts.onExit);
  return { el, destroy: off };
}
