import { createProvinceFlags } from './utils';

export const IRELAND_PROVINCES = createProvinceFlags('Ireland', [
  {
    name: 'Leinster',
    code: 'ie-l',
    image: 'Flag_of_Leinster.svg',
    aliases: ['Laighin', 'Láighin', 'Laighin Province'],
    tags: [],
    status: ""
  },
  {
    name: 'Munster',
    code: 'ie-m',
    image: 'Flag_of_Munster.svg',
    aliases: ['Mumhain', 'An Mhumháin', 'Mhumhain Province'],
    tags: [],
    status: ""
  },
  {
    name: 'Connacht',
    code: 'ie-c',
    image: 'Flag_of_Connacht.svg',
    aliases: ['Connachta', 'Connacht Province'],
    tags: [],
    status: ""
  },
  {
    name: 'Ulster',
    code: 'ie-u',
    image: 'Flag_of_Ulster.svg',
    aliases: ['Ulaidh', 'Uladh', 'Ulster Province'],
    tags: [],
    status: ""
  },
  {
    name: 'Four Provinces of Ireland',
    code: 'ie-fp',
    image: 'Four_Provinces_Flag.svg',
    aliases: ['Na Ceithre Cúigí', 'Provinces Flag'],
    tags: [],
    status: ""
  },
  {
    name: 'Carlow',
    code: 'ie-cw',
    image: 'Flag_of_county_Carlow.svg',
    aliases: ['Ceatharlach'],
    tags: [],
    status: ""
  },
  {
    name: 'Cavan',
    code: 'ie-cn',
    image: 'Colours_of_Laois.svg',
    aliases: ['An Cabhán'],
    tags: [],
    status: ""
  },
  {
    name: 'Clare',
    code: 'ie-ce',
    image: 'Flag_of_county_Clare.svg',
    aliases: ['An Clár'],
    tags: [],
    status: ""
  },
  {
    name: 'Cork',
    code: 'ie-co',
    image: 'Flag_of_County_Cork.svg',
    aliases: ['Corcaigh'],
    tags: [],
    status: ""
  },
  {
    name: 'Donegal',
    code: 'ie-dl',
    image: 'Colours_of_Donegal_GAA.svg',
    aliases: ['Dún na nGall'],
    tags: [],
    status: ""
  },
  {
    name: 'Dublin',
    code: 'ie-d',
    image: 'Flag_of_county_Dublin.svg',
    aliases: ['Baile Átha Cliath'],
    tags: [],
    status: ""
  },
  {
    name: 'Galway',
    code: 'ie-g',
    image: 'Colours_of_Galway.svg',
    aliases: ['Gaillimh'],
    tags: [],
    status: ""
  },
  {
    name: 'Kerry',
    code: 'ie-ky',
    image: 'Flag_of_county_Kerry.svg',
    aliases: ['Ciarraí'],
    tags: [],
    status: ""
  },
  {
    name: 'Kildare',
    code: 'ie-ke',
    image: 'Flag_of_county_Kildare.svg',
    aliases: ['Cill Dara'],
    tags: [],
    status: ""
  },
  {
    name: 'Kilkenny',
    code: 'ie-kk',
    image: 'Flag_of_county_Kilkenny.svg',
    aliases: ['Cill Chainnigh'],
    tags: [],
    status: ""
  },
  {
    name: 'Laois',
    code: 'ie-ls',
    image: 'Colours_of_Laois.svg',
    aliases: [],
    tags: [],
    status: ""
  },
  {
    name: 'Leitrim',
    code: 'ie-lm',
    image: 'Flag_of_county_Leitrim.svg',
    aliases: ['Liatroim'],
    tags: [],
    status: ""
  },
  {
    name: 'Limerick',
    code: 'ie-lk',
    image: 'Flag_of_County_Limerick.svg',
    aliases: ['Luimneach'],
    tags: [],
    status: ""
  },
  {
    name: 'Longford',
    code: 'ie-ld',
    image: 'County_colors_of_Longford_and_Wicklow_(1x2_ratio).svg',
    aliases: ['An Longfort'],
    tags: [],
    status: ""
  },
  {
    name: 'Louth',
    code: 'ie-lh',
    image: 'Flag_of_the_counties_of_Cork_and_Louth.svg',
    aliases: ['Lú'],
    tags: [],
    status: ""
  },
  {
    name: 'Mayo',
    code: 'ie-mo',
    image: 'Flag_of_county_Mayo.svg',
    aliases: ['Maigh Eo'],
    tags: [],
    status: ""
  },
  {
    name: 'Meath',
    code: 'ie-mh',
    image: 'Colours_of_Meath_GAA.svg',
    aliases: ['An Mhí'],
    tags: [],
    status: ""
  },
  {
    name: 'Monaghan',
    code: 'ie-mn',
    image: 'Flag_of_county_Monaghan.svg',
    aliases: ['Muineachán'],
    tags: [],
    status: ""
  },
  {
    name: 'Offaly',
    code: 'ie-oy',
    image: 'Flag_of_county_Offaly.svg',
    aliases: ['Uíbh Fhailí'],
    tags: [],
    status: ""
  },
  {
    name: 'Roscommon',
    code: 'ie-rn',
    image: 'Flag_of_county_Roscommon.svg',
    aliases: ['Ros Comáin'],
    tags: [],
    status: ""
  },
  {
    name: 'Sligo',
    code: 'ie-so',
    image: 'Flag_of_county_Sligo.svg',
    aliases: ['Sligeach'],
    tags: [],
    status: ""
  },
  {
    name: 'Tipperary',
    code: 'ie-ta',
    image: 'Flag_of_county_Tipperary.svg',
    aliases: ['Tiobraid Árann'],
    tags: [],
    status: ""
  },
  {
    name: 'Waterford',
    code: 'ie-wd',
    image: 'Flag_of_County_Waterford.svg',
    aliases: ['Port Láirge'],
    tags: [],
    status: ""
  },
  {
    name: 'Westmeath',
    code: 'ie-wh',
    image: 'Colours_of_Galway.svg',
    aliases: ['An Iarmhí'],
    tags: [],
    status: ""
  },
  {
    name: 'Wexford',
    code: 'ie-wx',
    image: 'Flag_of_county_Wexford.svg',
    aliases: ['Loch Garman'],
    tags: [],
    status: ""
  },
  {
    name: 'Wicklow',
    code: 'ie-ww',
    image: 'County_colors_of_Longford_and_Wicklow_(1x2_ratio).svg',
    aliases: ['Cill Mhantáin'],
    tags: [],
    status: ""
  }
], 'Europe');
