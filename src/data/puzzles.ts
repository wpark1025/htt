// 낱말맞추기(십자말풀이) 데이터 형식. 한글은 칸마다 음절 하나, 영어는 글자 하나.

export interface PuzzleWord {
  row: number;
  col: number;
  dir: 'across' | 'down';
  answer: string;
  clue: string;
}

export interface Puzzle {
  id: number;
  title: string;
  size: number;
  words: PuzzleWord[];
}

/** 칸 좌표 → 정답 글자. 겹치는 칸의 글자가 다르면 오류. */
export function puzzleCells(p: Puzzle): Map<string, string> {
  const cells = new Map<string, string>();
  for (const w of p.words) {
    const chars = [...w.answer];
    chars.forEach((ch, i) => {
      const r = w.dir === 'down' ? w.row + i : w.row;
      const c = w.dir === 'across' ? w.col + i : w.col;
      const key = `${r},${c}`;
      const prev = cells.get(key);
      if (prev !== undefined && prev !== ch) throw new Error(`puzzle ${p.id}: conflict at ${key} (${prev} vs ${ch})`);
      if (r >= p.size || c >= p.size) throw new Error(`puzzle ${p.id}: out of grid at ${key}`);
      cells.set(key, ch);
    });
  }
  return cells;
}
