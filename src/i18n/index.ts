// 아주 작은 i18n. 설정의 uiLang에 따라 사전을 고르고 {name} 꼴의 자리표시자를 채운다.
import { en } from './en';
import { ko, type I18nKey } from './ko';

export type UiLang = 'ko' | 'en';
export type { I18nKey };

const dicts: Record<UiLang, Record<I18nKey, string>> = { ko, en };
let current: UiLang = 'ko';

export function setUiLang(lang: UiLang): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

export function getUiLang(): UiLang {
  return current;
}

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  let s: string = dicts[current][key] ?? dicts.ko[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** 단계 이름 (연습 자판 언어 기준) */
export function stageName(lang: 'ko' | 'en', id: number): string {
  return t(`stage.${lang}.${id}` as I18nKey);
}
