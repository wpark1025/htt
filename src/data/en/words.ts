// English word list. Only the grade (g) is hand-assigned; length and capitals are analyzed automatically.
// 1: basic (objects, animals, food, family, body, colors) 2: everyday vocabulary 3: advanced, abstract, long

import { graded, type WordEntry } from '../words';

export const EN_WORDS: WordEntry[] = [
  ...graded(
    1,
    `cat dog sun run big red hat bus cup egg pig box car bed bee ant bat cow fox hen owl pen map bag fun hot
     ice jam key leg lip man mom dad boy toy top tub van wet yes zoo arm eye ear six ten two one leaf
     apple house water happy green blue pink black white brown bird fish frog duck lion bear tiger horse
     sheep goat mouse snake baby girl book desk chair door window table school teacher friend family mother
     father sister brother ball doll game play jump swim walk talk read sing dance draw eat drink sleep
     smile laugh cry love like want need help look see hear milk bread rice cake candy cookie pizza juice
     banana orange grape lemon melon cherry carrot potato tomato onion corn bean moon star sky cloud rain
     snow wind tree flower grass rock sand sea lake river hill road city farm park shop home room bath
     train plane boat bike truck hand foot head nose mouth hair knee three four five seven eight nine
     today good bad new old long short tall small cold warm fast slow soft hard clean dirty sweet loud
     quiet funny rabbit monkey zebra panda koala whale shark dolphin turtle spider butterfly ladybug
     chicken cheese butter honey sugar salt soup salad noodle yogurt cereal pencil eraser crayon paper
     glue scissors ruler bell clock lamp sofa pillow blanket towel soap brush comb shirt pants dress
     shoes socks coat scarf glove boots jacket umbrella kite drum flute piano robot puzzle block`,
  ),
  ...graded(
    2,
    `morning evening weekend holiday weather season spring summer autumn winter kitchen bedroom garden
     street market library hospital station airport museum restaurant office company doctor nurse farmer
     driver police soldier singer artist writer science history music picture movie letter story question
     answer problem minute second hour month year number color animal plant insect forest desert island
     ocean mountain planet nature energy light sound heavy early late always never often sometimes usually
     because before after between during without through around across along beside behind under above
     inside outside important different difficult beautiful wonderful interesting exciting dangerous
     careful quickly slowly together alone another every other only also still already maybe perhaps
     really certainly travel vacation journey adventure camera computer phone internet keyboard screen
     language English Korean Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February
     March April May June July August September October November December Christmas birthday breakfast
     lunch dinner chocolate sandwich vegetable fruit exercise football baseball basketball swimming
     running tennis guitar violin drawing painting cooking shopping reading writing listening speaking
     remember forget understand explain describe decide prepare practice improve finish continue change
     grow build break repair America Europe Asia Africa Korea Japan China Canada France Spain Italy
     London Paris Seoul Tokyo Busan everyone someone anyone nothing something everything anything
     yesterday tomorrow tonight afternoon midnight noon week century moment future past present
     neighbor customer manager worker student parent child adult cousin uncle aunt nephew niece husband
     wife wedding habit hobby interest humor shout whisper climb crawl push pull carry throw catch
     kick hit hold drop lift turn wait arrive leave return visit invite share borrow lend spend save earn
     cost price cheap expensive free busy ready sure safe strange simple serious strong weak healthy sick`,
  ),
  ...graded(
    3,
    `government environment responsibility knowledge particular experience democracy philosophy
     university literature mathematics technology engineering architecture agriculture economics
     psychology chemistry physics biology geography astronomy electricity temperature atmosphere
     opportunity possibility development achievement imagination creativity concentration independence
     organization communication relationship community society civilization tradition generation
     population information education scientific artificial intelligence algorithm programming database
     security international national original individual professional traditional essential necessary
     significant considerable extraordinary approximately immediately unfortunately nevertheless
     consequently although whether despite therefore however furthermore recommend investigate
     demonstrate establish contribute participate concentrate appreciate recognize emphasize encourage
     accomplish characteristic circumstance consequence hypothesis experiment conclusion evidence
     analysis statistics probability vocabulary pronunciation grammar sentence paragraph dictionary
     encyclopedia manufacture transportation infrastructure sustainable renewable pollution recycling
     conservation biodiversity ecosystem photosynthesis evolution molecule nucleus satellite telescope
     microscope laboratory parliament constitution election candidate citizen justice equality liberty
     economy inflation investment insurance welfare medicine vaccine disease prevention diagnosis
     champion tournament competition observation measurement reasoning criticism innovation heritage
     orchestra conductor composer sculptor exhibition performance theater architect construction
     earthquake flood drought hurricane climate warming carbon neutral semiconductor quantum blockchain
     virtual augmented autonomous software hardware operating encryption backup download notification
     philosopher scientist mathematician historian economist psychologist biologist physicist chemist
     astronomer archaeologist linguist Shakespeare Einstein Newton Darwin Mozart Beethoven Picasso
     Antarctica Australia Brazil Germany Mexico Netherlands Switzerland Portugal Argentina Philippines`,
  ),
];
