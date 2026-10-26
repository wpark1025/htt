import type { Puzzle } from '../puzzles';

export const KO_PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: '동물과 과일',
    size: 7,
    words: [
      { row: 0, col: 0, dir: 'across', answer: '사과나무', clue: '뉴턴이 그 아래에서 사과가 떨어지는 것을 보았다는 나무' },
      { row: 0, col: 0, dir: 'down', answer: '사자', clue: '갈기가 있는 동물의 왕' },
      { row: 0, col: 3, dir: 'down', answer: '무지개', clue: '비 온 뒤 하늘에 뜨는 일곱 색 띠' },
      { row: 1, col: 0, dir: 'across', answer: '자전거', clue: '두 바퀴를 발로 굴려 가는 탈것' },
      { row: 2, col: 3, dir: 'across', answer: '개구리', clue: '올챙이가 자라면 되는 것' },
      { row: 2, col: 5, dir: 'down', answer: '리본', clue: '선물 상자에 묶는 예쁜 띠' },
      { row: 4, col: 0, dir: 'across', answer: '바나나', clue: '노랗고 길쭉한 열대 과일' },
      { row: 4, col: 2, dir: 'down', answer: '나무', clue: '뿌리, 줄기, 잎이 있는 큰 식물' },
      { row: 5, col: 2, dir: 'across', answer: '무당벌레', clue: '빨간 등에 검은 점이 있는 곤충' },
    ],
  },
  {
    id: 2,
    title: '우리 동네',
    size: 7,
    words: [
      { row: 0, col: 0, dir: 'across', answer: '호랑이', clue: '줄무늬가 있는 산의 왕' },
      { row: 0, col: 0, dir: 'down', answer: '호수', clue: '산속에 물이 고여 만든 큰 못' },
      { row: 0, col: 2, dir: 'down', answer: '이야기', clue: '"옛날 옛적에"로 시작하는 것' },
      { row: 1, col: 0, dir: 'across', answer: '수박', clue: '줄무늬 겉에 빨간 속, 여름 과일' },
      { row: 2, col: 2, dir: 'across', answer: '기차', clue: '철길 위를 달리는 긴 탈것' },
      { row: 2, col: 3, dir: 'down', answer: '차도', clue: '자동차가 다니는 길' },
      { row: 3, col: 3, dir: 'across', answer: '도시', clue: '사람과 건물이 많은 곳' },
      { row: 3, col: 4, dir: 'down', answer: '시계', clue: '시간을 알려 주는 물건' },
      { row: 4, col: 4, dir: 'across', answer: '계란', clue: '닭이 낳은 알' },
      { row: 5, col: 0, dir: 'across', answer: '어머니', clue: '엄마를 높여 부르는 말' },
    ],
  },
];
