import type { Puzzle } from '../puzzles';

export const EN_PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'Nature',
    size: 7,
    words: [
      { row: 0, col: 0, dir: 'across', answer: 'APPLE', clue: 'A red or green fruit that keeps the doctor away' },
      { row: 0, col: 0, dir: 'down', answer: 'ANT', clue: 'A tiny insect that works hard all summer' },
      { row: 0, col: 4, dir: 'down', answer: 'EGG', clue: 'A hen lays it' },
      { row: 2, col: 0, dir: 'across', answer: 'THING', clue: 'Any object at all' },
      { row: 2, col: 2, dir: 'down', answer: 'ICE', clue: 'Frozen water' },
      { row: 4, col: 0, dir: 'across', answer: 'TREES', clue: 'Tall plants with trunks and leaves' },
      { row: 4, col: 4, dir: 'down', answer: 'SUN', clue: 'The star that lights our day' },
      { row: 6, col: 1, dir: 'across', answer: 'RAIN', clue: 'Water falling from clouds' },
    ],
  },
  {
    id: 2,
    title: 'Around the house',
    size: 7,
    words: [
      { row: 0, col: 0, dir: 'across', answer: 'HOUSE', clue: 'The building a family lives in' },
      { row: 0, col: 0, dir: 'down', answer: 'HAT', clue: 'You wear it on your head' },
      { row: 0, col: 4, dir: 'down', answer: 'EAR', clue: 'You hear with it' },
      { row: 2, col: 0, dir: 'across', answer: 'TIGER', clue: 'A big striped cat' },
      { row: 2, col: 2, dir: 'down', answer: 'GUM', clue: 'You chew it but do not swallow it' },
      { row: 4, col: 0, dir: 'across', answer: 'LEMON', clue: 'A sour yellow fruit' },
      { row: 4, col: 4, dir: 'down', answer: 'NET', clue: 'Fishermen catch fish with it' },
      { row: 6, col: 1, dir: 'across', answer: 'BOAT', clue: 'It floats and carries people on water' },
    ],
  },
];
