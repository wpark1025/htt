// Words for word drills per stage. Each must be typable with the keys learned up to that stage (tests check).
// 1 asdf jkl;  2 +qwer  3 +tgbyhn  4 +uiop  5 +zxcv  6 +m,./  7 +capitals  8 +'-?:"!

export const EN_STAGE_WORDS: Record<number, string[]> = {
  1: [
    'as', 'ask', 'sad', 'lad', 'dad', 'fad', 'all', 'fall', 'lass', 'add', 'salad', 'flask', 'alas',
    'adds', 'falls', 'asks', 'lads', 'fads', 'dads', 'salads', 'flasks', 'a sad lad', 'ask dad', 'all fall',
    'ads', 'lass;', 'add all', 'fall;', 'a lad', 'sad dads',
  ],
  2: [
    'read', 'red', 'were', 'wear', 'dear', 'fear', 'ear', 'war', 'saw', 'draw', 'desk', 'wake', 'lake',
    'fake', 'week', 'seed', 'feed', 'deer', 'sea', 'seal', 'real', 'wall', 'jaw', 'raw', 'dress', 'aware',
    'leaf', 'safe', 'free', 'easel', 'sled', 'sale', 'rake', 'weed', 'elder', 'reader', 'squad', 'quake',
    'wafer', 'sewer', 'fewer', 'a red leaf', 'we read', 'draw a deer',
  ],
  3: [
    'the', 'that', 'this', 'then', 'they', 'bat', 'hat', 'bath', 'ten', 'net', 'bag', 'tag', 'hang',
    'sang', 'thank', 'thanks', 'bank', 'tank', 'get', 'beg', 'yes', 'yet', 'bet', 'ball', 'tall', 'hand',
    'land', 'band', 'stand', 'sand', 'bread', 'great', 'green', 'tree', 'three', 'sheet', 'nest', 'hands',
    'needs', 'tenth', 'strange', 'garden', 'bank teller', 'the best', 'a tall tree',
  ],
  4: [
    'you', 'your', 'our', 'out', 'into', 'up', 'top', 'pot', 'hot', 'dot', 'lot', 'not', 'got', 'put',
    'pull', 'push', 'open', 'house', 'tiger', 'lion', 'horse', 'bird', 'fish', 'sun', 'rain', 'tooth',
    'spoon', 'plate', 'apple', 'orange', 'potato', 'onion', 'water', 'paper', 'pupil', 'point', 'about',
    'night', 'light', 'right', 'fruit', 'juice', 'glass', 'hall', 'half', 'dash', 'flash', 'slash',
  ],
  5: [
    'cat', 'cow', 'box', 'fox', 'zoo', 'cake', 'cup', 'car', 'ice', 'cold', 'cool', 'next', 'exit', 'very',
    'have', 'give', 'love', 'live', 'seven', 'eleven', 'voice', 'zero', 'size', 'lazy', 'crazy', 'puzzle',
    'cycle', 'cover', 'cloud', 'clock', 'black', 'back', 'pack', 'luck', 'rock', 'duck', 'chick', 'zebra',
    'extra', 'exact', 'violet', 'carrot', 'cherry', 'cookie',
  ],
  6: [
    'mom', 'mum', 'home', 'time', 'name', 'game', 'same', 'come', 'some', 'summer', 'milk', 'moon',
    'mouse', 'monkey', 'yes.', 'no.', 'one, two', 'a.m.', 'p.m.', 'and/or', 'i.e.', 'e.g.', 'etc.',
    'dream', 'smile', 'climb', 'number', 'camera', 'lemon', 'melon', 'tomato', 'family', 'animal',
    'mother', 'morning', 'memory', 'museum', 'music', 'simple', 'come home.', 'milk, eggs, jam',
  ],
  7: [
    'Korea', 'Seoul', 'Busan', 'America', 'London', 'Paris', 'Monday', 'Friday', 'Sunday', 'May', 'June',
    'Alice', 'Peter', 'Wendy', 'Tom', 'Anna', 'English', 'Hangul', 'Mr Kim', 'Dr Lee', 'OK', 'USA', 'UK',
    'New York', 'Tokyo', 'Hello', 'Good morning.', 'Happy Birthday', 'Jeju Island',
  ],
  8: [
    "I'm", "don't", "can't", "it's", "let's", "you're", "we're", 'Hello!', 'Why?', 'What?', 'Really?',
    'well-known', 'ice-cream', 'Note: yes', 'Time: 9', '"Hi"', '"Bye"', 'Wow!', 'Oh no!', 'Who?',
    "o'clock", 'twenty-one', 'How are you?', 'Fine, thanks!', 'Dear Tom:',
  ],
  9: ['1', '12', '123', '2024', '365', '100', '7', '88', '1004', '5050', '2468', '13579', 'room 101', '7 days'],
  10: ['1+1=2', '50%', '#1', 'a@b', '(a)', '[b]', 'c\\d', '2*3=6', '$10', '^2', '&', '~', '`', 'a_b', '{x}', '<y>', 'p|q'],
};
