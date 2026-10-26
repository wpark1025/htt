// Proverbs for short-sentence practice. Traditional sayings, no copyright.
export const EN_SENTENCES: string[] = `
A friend in need is a friend indeed.
A journey of a thousand miles begins with a single step.
A picture is worth a thousand words.
A rolling stone gathers no moss.
A stitch in time saves nine.
A watched pot never boils.
Actions speak louder than words.
All that glitters is not gold.
All good things must come to an end.
An apple a day keeps the doctor away.
Absence makes the heart grow fonder.
Beauty is in the eye of the beholder.
Better late than never.
Better safe than sorry.
Birds of a feather flock together.
Blood is thicker than water.
Curiosity killed the cat.
Do not count your chickens before they hatch.
Do not put all your eggs in one basket.
Don't judge a book by its cover.
Early to bed and early to rise makes a man healthy, wealthy and wise.
Easy come, easy go.
Every cloud has a silver lining.
Fortune favors the bold.
Haste makes waste.
Honesty is the best policy.
If at first you don't succeed, try, try again.
It takes two to tango.
Knowledge is power.
Laughter is the best medicine.
Look before you leap.
Many hands make light work.
Necessity is the mother of invention.
No pain, no gain.
Out of sight, out of mind.
Practice makes perfect.
Rome was not built in a day.
Slow and steady wins the race.
Spare the rod and spoil the child.
Still waters run deep.
Strike while the iron is hot.
The early bird catches the worm.
The grass is always greener on the other side.
The pen is mightier than the sword.
There is no place like home.
Time is money.
Too many cooks spoil the broth.
Two heads are better than one.
Two wrongs don't make a right.
When in Rome, do as the Romans do.
Where there is a will, there is a way.
You can't have your cake and eat it too.
You reap what you sow.
Where there is smoke, there is fire.
The apple does not fall far from the tree.
Make hay while the sun shines.
Let sleeping dogs lie.
Good things come to those who wait.
Every dog has its day.
Once bitten, twice shy.
One good turn deserves another.
Opportunity seldom knocks twice.
Practice what you preach.
Seeing is believing.
The best things in life are free.
The squeaky wheel gets the grease.
There is no such thing as a free lunch.
Variety is the spice of life.
Well begun is half done.
What goes around comes around.
When the cat is away, the mice will play.
You can lead a horse to water, but you can't make it drink.
A chain is only as strong as its weakest link.
Half a loaf is better than none.
Hope for the best, prepare for the worst.
It is never too late to learn.
Little strokes fell great oaks.
Money does not grow on trees.
Nothing ventured, nothing gained.
Old habits die hard.
`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);
