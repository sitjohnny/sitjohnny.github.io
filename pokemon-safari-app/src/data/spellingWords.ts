import type { SpellingFactKey } from '@/game/education/questionTypes'

export type SpellingTier = 'early' | 'challenge'
export type SpellingWord = {
  word: string
  tier: SpellingTier
  imageUrl: string
  photographer: string
  pexelsUrl: string
  factKey: SpellingFactKey
}

export const spellingWords = [
  {
    word: 'apple',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Mareefe',
    pexelsUrl: 'https://www.pexels.com/photo/102104/',
    factKey: 'spell:apple',
  },
  {
    word: 'banana',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/10112876/pexels-photo-10112876.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Engin Akyurt',
    pexelsUrl: 'https://www.pexels.com/photo/10112876/',
    factKey: 'spell:banana',
  },
  {
    word: 'grape',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/708777/',
    factKey: 'spell:grape',
  },
  {
    word: 'lemon',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1414110/pexels-photo-1414110.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1414110/',
    factKey: 'spell:lemon',
  },
  {
    word: 'orange',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/7214898/pexels-photo-7214898.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Hanna Pad',
    pexelsUrl: 'https://www.pexels.com/photo/7214898/',
    factKey: 'spell:orange',
  },
  {
    word: 'peach',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1028598/pexels-photo-1028598.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1028598/',
    factKey: 'spell:peach',
  },
  {
    word: 'melon',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1313261/pexels-photo-1313261.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1313261/',
    factKey: 'spell:melon',
  },
  {
    word: 'bread',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/209206/',
    factKey: 'spell:bread',
  },
  {
    word: 'pizza',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/5993864/pexels-photo-5993864.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Vlad Chetan',
    pexelsUrl: 'https://www.pexels.com/photo/5993864/',
    factKey: 'spell:pizza',
  },
  {
    word: 'cookie',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/230325/',
    factKey: 'spell:cookie',
  },
  {
    word: 'tiger',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/145939/pexels-photo-145939.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/145939/',
    factKey: 'spell:tiger',
  },
  {
    word: 'lion',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/2220336/pexels-photo-2220336.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/2220336/',
    factKey: 'spell:lion',
  },
  {
    word: 'zebra',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/750539/pexels-photo-750539.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/750539/',
    factKey: 'spell:zebra',
  },
  {
    word: 'horse',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1996333/',
    factKey: 'spell:horse',
  },
  {
    word: 'sheep',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/288621/pexels-photo-288621.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/288621/',
    factKey: 'spell:sheep',
  },
  {
    word: 'frog',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/16848028/pexels-photo-16848028.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Steven Paton',
    pexelsUrl: 'https://www.pexels.com/photo/16848028/',
    factKey: 'spell:frog',
  },
  {
    word: 'duck',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/37514234/pexels-photo-37514234.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Denis Mustafaev',
    pexelsUrl: 'https://www.pexels.com/photo/37514234/',
    factKey: 'spell:duck',
  },
  {
    word: 'swan',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/416179/',
    factKey: 'spell:swan',
  },
  {
    word: 'fish',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/128756/pexels-photo-128756.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/128756/',
    factKey: 'spell:fish',
  },
  {
    word: 'bird',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1661179/',
    factKey: 'spell:bird',
  },
  {
    word: 'cloud',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Eberhard Grossgasteiger',
    pexelsUrl: 'https://www.pexels.com/photo/531756/',
    factKey: 'spell:cloud',
  },
  {
    word: 'moon',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/414612/',
    factKey: 'spell:moon',
  },
  {
    word: 'star',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/110854/',
    factKey: 'spell:star',
  },
  {
    word: 'rain',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/110874/pexels-photo-110874.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/110874/',
    factKey: 'spell:rain',
  },
  {
    word: 'snow',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/688660/pexels-photo-688660.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/688660/',
    factKey: 'spell:snow',
  },
  {
    word: 'tree',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1179229/',
    factKey: 'spell:tree',
  },
  {
    word: 'leaf',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/807598/pexels-photo-807598.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/807598/',
    factKey: 'spell:leaf',
  },
  {
    word: 'flower',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/931162/pexels-photo-931162.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Lukas',
    pexelsUrl: 'https://www.pexels.com/photo/931162/',
    factKey: 'spell:flower',
  },
  {
    word: 'grass',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/413195/pexels-photo-413195.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/413195/',
    factKey: 'spell:grass',
  },
  {
    word: 'book',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/46274/',
    factKey: 'spell:book',
  },
  {
    word: 'clock',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/359989/pexels-photo-359989.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/359989/',
    factKey: 'spell:clock',
  },
  {
    word: 'chair',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/116910/pexels-photo-116910.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/116910/',
    factKey: 'spell:chair',
  },
  {
    word: 'table',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/209205/pexels-photo-209205.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/209205/',
    factKey: 'spell:table',
  },
  {
    word: 'brush',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Anna Shvets',
    pexelsUrl: 'https://www.pexels.com/photo/3993449/',
    factKey: 'spell:brush',
  },
  {
    word: 'ball',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/274506/',
    factKey: 'spell:ball',
  },
  {
    word: 'boat',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1001682/',
    factKey: 'spell:boat',
  },
  {
    word: 'train',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1595391/',
    factKey: 'spell:train',
  },
  {
    word: 'bike',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/100582/',
    factKey: 'spell:bike',
  },
  {
    word: 'hat',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/984619/pexels-photo-984619.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/984619/',
    factKey: 'spell:hat',
  },
  {
    word: 'shoe',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/267320/',
    factKey: 'spell:shoe',
  },
  {
    word: 'cup',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/302899/',
    factKey: 'spell:cup',
  },
  {
    word: 'sock',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/45055/pexels-photo-45055.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/45055/',
    factKey: 'spell:sock',
  },
  {
    word: 'cake',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1126359/',
    factKey: 'spell:cake',
  },
  {
    word: 'cat',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/416160/',
    factKey: 'spell:cat',
  },
  {
    word: 'dog',
    tier: 'early',
    imageUrl:
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1108099/',
    factKey: 'spell:dog',
  },
  {
    word: 'elephant',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/18204365/pexels-photo-18204365.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Garreth Brown',
    pexelsUrl: 'https://www.pexels.com/photo/18204365/',
    factKey: 'spell:elephant',
  },
  {
    word: 'giraffe',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/1319515/pexels-photo-1319515.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1319515/',
    factKey: 'spell:giraffe',
  },
  {
    word: 'penguin',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/86405/penguin-funny-blue-water-86405.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/86405/',
    factKey: 'spell:penguin',
  },
  {
    word: 'dolphin',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/753619/pexels-photo-753619.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/753619/',
    factKey: 'spell:dolphin',
  },
  {
    word: 'butterfly',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/326055/',
    factKey: 'spell:butterfly',
  },
  {
    word: 'sandwich',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1603901/',
    factKey: 'spell:sandwich',
  },
  {
    word: 'rainbow',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/56745/pexels-photo-56745.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Francesco Ungaro',
    pexelsUrl: 'https://www.pexels.com/photo/56745/',
    factKey: 'spell:rainbow',
  },
  {
    word: 'mountain',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/417173/',
    factKey: 'spell:mountain',
  },
  {
    word: 'backpack',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/2905237/pexels-photo-2905237.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'cottonbro studio',
    pexelsUrl: 'https://www.pexels.com/photo/2905237/',
    factKey: 'spell:backpack',
  },
  {
    word: 'pancake',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/376464/',
    factKey: 'spell:pancake',
  },
  {
    word: 'feather',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/462118/',
    factKey: 'spell:feather',
  },
  {
    word: 'octopus',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/128321/pexels-photo-128321.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/128321/',
    factKey: 'spell:octopus',
  },
  {
    word: 'pineapple',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/1071878/pexels-photo-1071878.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1071878/',
    factKey: 'spell:pineapple',
  },
  {
    word: 'strawberry',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/951212/pexels-photo-951212.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/951212/',
    factKey: 'spell:strawberry',
  },
  {
    word: 'kangaroo',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/1319519/pexels-photo-1319519.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1319519/',
    factKey: 'spell:kangaroo',
  },
  {
    word: 'avocado',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/557659/',
    factKey: 'spell:avocado',
  },
  {
    word: 'dinosaur',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/8014628/pexels-photo-8014628.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Cup of Couple',
    pexelsUrl: 'https://www.pexels.com/photo/8014628/',
    factKey: 'spell:dinosaur',
  },
  {
    word: 'envelope',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/209115/pexels-photo-209115.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/209115/',
    factKey: 'spell:envelope',
  },
  {
    word: 'mushroom',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/691114/pexels-photo-691114.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/691114/',
    factKey: 'spell:mushroom',
  },
  {
    word: 'sunflower',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/112015/pexels-photo-112015.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/112015/',
    factKey: 'spell:sunflower',
  },
  {
    word: 'waterfall',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/210186/',
    factKey: 'spell:waterfall',
  },
  {
    word: 'helicopter',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/325401/pexels-photo-325401.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/325401/',
    factKey: 'spell:helicopter',
  },
  {
    word: 'carrot',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/143133/',
    factKey: 'spell:carrot',
  },
  {
    word: 'pumpkin',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/1028599/pexels-photo-1028599.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/1028599/',
    factKey: 'spell:pumpkin',
  },
  {
    word: 'turtle',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/847393/pexels-photo-847393.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/847393/',
    factKey: 'spell:turtle',
  },
  {
    word: 'camel',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/2295744/',
    factKey: 'spell:camel',
  },
  {
    word: 'bridge',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/814499/pexels-photo-814499.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Matteo Catanese',
    pexelsUrl: 'https://www.pexels.com/photo/814499/',
    factKey: 'spell:bridge',
  },
  {
    word: 'guitar',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/165971/pexels-photo-165971.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Pixabay',
    pexelsUrl: 'https://www.pexels.com/photo/165971/',
    factKey: 'spell:guitar',
  },
  {
    word: 'pillow',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/15758184/pexels-photo-15758184.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'Marek Hrnčiarik',
    pexelsUrl: 'https://www.pexels.com/photo/15758184/',
    factKey: 'spell:pillow',
  },
  {
    word: 'sweater',
    tier: 'challenge',
    imageUrl:
      'https://images.pexels.com/photos/14377376/pexels-photo-14377376.jpeg?auto=compress&cs=tinysrgb&w=600',
    photographer: 'A.V. Phina',
    pexelsUrl: 'https://www.pexels.com/photo/14377376/',
    factKey: 'spell:sweater',
  },
] as const satisfies readonly SpellingWord[]

export function allSpellingFactKeys(): SpellingFactKey[] {
  return spellingWords.map((w) => w.factKey)
}

export function spellingWordByFactKey(key: string): SpellingWord | undefined {
  return spellingWords.find((w) => w.factKey === key)
}

export function spellingWordsByTier(tier: SpellingTier): SpellingWord[] {
  return spellingWords.filter((w) => w.tier === tier)
}
