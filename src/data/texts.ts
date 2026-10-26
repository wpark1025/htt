export interface LongText {
  id: string;
  title: string;
  author: string;
  /** 한 줄씩 친다 */
  lines: string[];
}

export const textChars = (t: LongText): number => t.lines.reduce((n, l) => n + [...l].length, 0);
