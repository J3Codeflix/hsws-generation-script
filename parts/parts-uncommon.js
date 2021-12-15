module.exports = [
  {
    name: 'background/Background',
    count: 10,
    offset: {x: 0, y: 0},
    attrNames:['grey','indigo','lavender','pink','pistachio','purple','teal','turquoise','yellow'],
    required: true,
  },
  {
    name: 'fur/Fur',
    count: 9,
    offset: {x:  -1600, y: 0},
    attrNames:['black','brown','dark brown','dark grey','grey','white','bowie','white tiger'],
    required: true,
  },
  {
    name: 'eyes/Eyes',
    count: 15,
    offset: {x: -1600, y: 0},
    attrNames:['angry','bored 1','bored 2','closed','sad','skeptical','surprised','tired','wink','hypnotized bored 1','hypnotized bored 2',
    'hypnotized surprised','stoned bored 1','stoned bored 2'],
    required: true,
  },
  {
    name: 'mouth/Mouth',
    count: 20,
    offset: {x: -1600, y: 0},
    attrNames:['poker','awe','bite','bored','bummed','cringe','cringe tongue out','open smirk','rage','smile','smirk','tongue out',
    'whistle','purple cringe','purple cringe tongue out','purple open smirk','purple rage','purple smirk','purple tongue out',],
    required: true,
  },
  {
    name: 'earaccessory/ear',
    count: 1,
    offset: {x: -1600, y: 0},
    attrNames:[''],
    required: false,
  },
  {
    name: 'headwear/Head',
    count: 1,
    offset: {x: -1600, y: 0},
    attrNames:[''],
    required: false,
  },
  {
    name: 'outfit/Outfit',
    count: 41,
    offset: {x: -1600, y: 0},
    attrNames:['','black infinity jacket','black marble suit','blurred t-shirt','distressed sweater','harness t-shirt','kiss mark vest','leather jacket','painted jacket',
    'pink suit','preppy sweater','red jacket','white infinity jacket','bag necklace','bulletproof vest','checkered shirt','fragile tape','g ensemble','honorary sash',
    'green hsws tee','nude hsws tee','patched shirt','patched shirt 2','plaid-vest ensemble','puffer vest','shirt on shirt','teddy sling','transparent jacket ensemble',
    'vest and jacket','wall street','wbc belt','black acid knit sweater','black acid sleeveless shirt','blue-orange shirt ','red acid knit sweater','red acid shirt',
    'yellow printed knit sweater','wolverine','telephone leather jacker','goose dress','hangered suit',],
    required: false,
  },
]