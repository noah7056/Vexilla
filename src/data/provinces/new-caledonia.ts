import { createProvinceFlags } from './utils';

export const NEW_CALEDONIA_PROVINCES = createProvinceFlags('New Caledonia', [


  {
    name: 'South Province (Province Sud)',
    adminType: 'province',
    code: 'nc-sud',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Bandera_Province_Sud.svg',
    tags: [],
    status: ""
  },
  {
    name: 'North Province (Province Nord)',
    adminType: 'province',
    code: 'nc-nor',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Drapeau_Province_Nord_Nouvelle_Cal%C3%A9donie.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Loyalty Islands Province (Îles Loyauté)',
    adminType: 'province',
    code: 'nc-loy',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Iles-Loyaut%C3%A9_drapeau.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Kanaky (FLNKS Flag)',
    code: 'nc-kan',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Flag_of_FLNKS.svg',
    tags: [],
    status: ""
  }
], 'Oceania');
