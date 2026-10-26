// 사용자 바꾸기 / 지우기 / 추가. 처음 시작(인사말 → 이름 → 익숙 정도 → 시작할 곳)도 여기.

import { addUser, deleteUser, loadUsers, switchUser } from '../core/store';
import { t } from '../i18n';
import { dialog, esc, h, onKeys, type View } from './common';

export function renderUsers(opts: { onChanged(): void; onExit(): void }): View {
  const el = h('section', 'practice users');
  const render = () => {
    const state = loadUsers();
    el.innerHTML = `
      <header class="practice-top"><h2>${t('users.title')}</h2></header>
      <div class="work">
        <ul class="user-list">${
          state.users.length
            ? state.users
                .map(
                  (u) => `<li class="${u.name === state.current ? 'on' : ''}">
                    <span>${esc(u.name)} ${u.name === state.current ? `<small class="muted">(${t('users.current')})</small>` : ''}</span>
                    <span class="actions"><button class="btn" data-switch="${esc(u.name)}">${t('users.switch')}</button><button class="btn btn-ghost" data-del="${esc(u.name)}">${t('users.delete')}</button></span>
                  </li>`,
                )
                .join('')
            : `<li class="muted">${t('users.empty')}</li>`
        }</ul>
        <form class="add-user"><input type="text" maxlength="20" placeholder="${t('users.new')}" required><button class="btn btn-primary" type="submit">${t('users.add')}</button></form>
      </div>`;
    el.querySelectorAll<HTMLButtonElement>('[data-switch]').forEach((b) =>
      b.addEventListener('click', () => {
        switchUser(b.dataset.switch!);
        opts.onChanged();
        render();
      }),
    );
    el.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
      b.addEventListener('click', () => {
        if (confirm(t('users.deleteConfirm', { name: b.dataset.del! }))) {
          deleteUser(b.dataset.del!);
          opts.onChanged();
          render();
        }
      }),
    );
    el.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = el.querySelector<HTMLInputElement>('input')!;
      const name = input.value.trim();
      if (!name) return;
      addUser(name);
      opts.onChanged();
      render();
    });
  };
  render();
  const off = onKeys(() => {}, opts.onExit);
  return { el, destroy: off };
}

/** 처음 시작: 이름만 묻는다. 끝나면 onDone. */
export function renderOnboarding(opts: { onDone(): void }): View {
  const el = h('section', 'onboarding');
  const body = h('div', 'center');
  body.innerHTML = `<p>${esc(t('onboard.askName'))}</p><form class="name-form"><input type="text" maxlength="20" placeholder="${esc(t('onboard.nameHolder'))}" autofocus required></form><p class="muted">${esc(t('onboard.note'))}</p>`;
  const form = body.querySelector('form')!;
  const input = body.querySelector<HTMLInputElement>('input')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    addUser(name);
    opts.onDone();
  });
  setTimeout(() => input.focus(), 0);
  const overlay = h('div', 'overlay');
  overlay.appendChild(dialog(t('app.title'), body));
  el.appendChild(overlay);
  return { el, destroy() {} };
}
