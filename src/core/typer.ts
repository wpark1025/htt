// 언어별 입력 버퍼. 한글은 오토마타로 조합하고, 그 외 언어는 글자를 그대로 쌓는다.

import { HangulAutomaton } from './hangul';
import type { Lang } from './settings';

export interface Typer {
  readonly text: string;
  feed(ch: string): void;
  backspace(): void;
  reset(): void;
}

class PlainTyper implements Typer {
  text = '';
  feed(ch: string): void {
    this.text += ch;
  }
  backspace(): void {
    this.text = [...this.text].slice(0, -1).join('');
  }
  reset(): void {
    this.text = '';
  }
}

export function createTyper(lang: Lang): Typer {
  return lang === 'ko' ? new HangulAutomaton() : new PlainTyper();
}
