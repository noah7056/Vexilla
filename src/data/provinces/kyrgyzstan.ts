import { createProvinceFlags } from './utils';

export const KYRGYZSTAN_PROVINCES = createProvinceFlags('Kyrgyzstan', [


  {
    name: 'Bishkek (Capital City)',
    adminType: 'city',
    code: 'kg-gb',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Flag_of_Bishkek.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Osh (City)',
    adminType: 'city',
    code: 'kg-go',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Flag_of_Osh.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Issyk-Kul Region',
    adminType: 'region',
    code: 'kg-y',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Flag_of_Issyk-Kul_Region.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Jalal-Abad Region',
    adminType: 'region',
    code: 'kg-j',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Flag_of_Jalal-Abad_Region.svg',
    tags: [],
    status: ""
  }
], 'Asia');
