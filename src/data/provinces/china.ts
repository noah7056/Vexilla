import { createProvinceFlags } from './utils';

export const CHINA_PROVINCES = createProvinceFlags('China', [


  {
    name: 'Hong Kong (SAR)',
    code: 'hk',
    image: 'Flag_of_Hong_Kong.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Macau (SAR)',
    code: 'mo',
    image: 'Flag_of_Macau.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Tibet',
    code: 'cn-tb',
    image: 'Flag_of_Tibet.svg',
    tags: [],
    status: ""
  },
], 'Asia');
