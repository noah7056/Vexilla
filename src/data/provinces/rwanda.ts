import { createProvinceFlags } from './utils';

export const RWANDA_PROVINCES = createProvinceFlags('Rwanda', [
  {
    name: 'City of Kigali',
    adminType: 'city',
    code: 'rw-01',
    aliases: ['Kigali', 'Umujyi wa Kigali'],
    tags: [],
    status: ""
  },
  {
    name: 'Eastern Province',
    adminType: 'province',
    code: 'rw-02',
    aliases: ['Est', 'Iburasirazuba'],
    tags: [],
    status: ""
  },
  {
    name: 'Northern Province',
    adminType: 'province',
    code: 'rw-03',
    aliases: ['Nord', 'Amajyaruguru'],
    tags: [],
    status: ""
  },
  {
    name: 'Western Province',
    adminType: 'province',
    code: 'rw-04',
    aliases: ['Ouest', 'Iburengerazuba'],
    tags: [],
    status: ""
  },
  {
    name: 'Southern Province',
    adminType: 'province',
    code: 'rw-05',
    aliases: ['Sud', 'Amajyepfo'],
    tags: [],
    status: ""
  },
  {
    name: 'Kingdom of Rwanda (Historic Mwami Royal Standard)',
    code: 'rw-mwa',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Standard_of_the_Mwami_of_Rwanda.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Republic of Rwanda (Historic 1962–2001 with R)',
    code: 'rw-62',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Rwanda_(1962–2001).svg',
    tags: [],
    status: ""
  },
  {
    name: 'Republic of Rwanda (Historic Jan-Sep 1961)',
    code: 'rw-61',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Rwanda_(January_–_September_1961).svg',
    tags: [],
    status: ""
  }
], 'Africa');
