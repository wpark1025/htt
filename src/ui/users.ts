// 사용자 바꾸기 / 지우기 / 추가. 처음 시작(인사말 → 이름 → 익숙 정도 → 시작할 곳)도 여기.

import { addUser, deleteUser, loadUsers, switchUser } from '../core/store';
import { t } from '../i18n';
import { choiceList, dialog, esc, h, onKeys, type View } from './common';

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

/** 처음 시작 흐름. 끝나면 onDone(where)로 어디서 시작할지 알려준다. */
export function renderOnboarding(opts: { onDone(where: 'game' | 'menu' | 'place'): void }): View {
  const el = h('section', 'onboarding');
  let sub: View | null = null;
  const show = (v: View) => {
    sub?.destroy();
    sub = v;
    const overlay = h('div', 'overlay');
    overlay.appendChild(v.el);
    el.replaceChildren(overlay);
  };

  const greet = (): View => {
    const body = h('div', 'prose');
    body.innerHTML = t('onboard.greet')
      .split('\n\n')
      .map((p) => `<p>${esc(p)}</p>`)
      .join('');
    body.appendChild(h('p', 'muted center', t('hint.space')));
    const off = onKeys((e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        show(askName());
      }
    });
    return { el: dialog(t('onboard.greetTitle'), body), destroy: off };
  };

  const askName = (): View => {
    const body = h('div', 'center');
    body.innerHTML = `<p>${t('onboard.askName')}</p><form class="name-form"><input type="text" maxlength="20" placeholder="${t('onboard.nameHolder')}" autofocus required></form>`;
    const form = body.querySelector('form')!;
    const input = body.querySelector<HTMLInputElement>('input')!;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      addUser(name);
      show(askSkill(name));
    });
    setTimeout(() => input.focus(), 0);
    return { el: dialog(t('common.name'), body), destroy() {} };
  };

  const askSkill = (name: string): View => {
    const list = choiceList(
      [
        { label: t('onboard.skillNew'), value: 'new' },
        { label: t('onboard.skillSome'), value: 'some' },
      ],
      (v) => {
        addUser(name, v as 'new' | 'some');
        show(askWhere());
      },
    );
    const body = h('div');
    body.appendChild(h('p', 'center', t('onboard.skillQ')));
    body.appendChild(list.el);
    return { el: dialog(t('onboard.skillTitle'), body), destroy: list.destroy };
  };

  const askWhere = (): View => {
    const list = choiceList(
      [
        { label: t('onboard.wherePlace'), value: 'place' },
        { label: t('onboard.whereGame'), value: 'game' },
        { label: t('onboard.whereMenu'), value: 'menu' },
      ],
      (v) => opts.onDone(v as 'game' | 'menu' | 'place'),
    );
    const body = h('div');
    body.appendChild(h('p', 'center', t('onboard.whereQ')));
    body.appendChild(list.el);
    return { el: dialog(t('onboard.whereTitle'), body), destroy: list.destroy };
  };

  show(greet());
  return {
    el,
    destroy() {
      sub?.destroy();
    },
  };
}
