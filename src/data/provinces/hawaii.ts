import { createProvinceFlags } from './utils';

export const HAWAII_PROVINCES = createProvinceFlags('Hawaii', [


  {
    name: 'Hawaii County (Big Island)',
    code: 'us-hi-haw',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Hawai%27i_County%2C_Hawaii.png',
    tags: [],
    status: ""
  },
  {
    name: 'City and County of Honolulu (Oahu)',
    code: 'us-hi-hon',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Flag_of_Honolulu%2C_Hawaii.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Maui County',
    code: 'us-hi-mau',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Flag_of_Maui_County%2C_Hawaii.svg',
    tags: [],
    status: ""
  },
  {
    name: 'Kauai County',
    code: 'us-hi-kau',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_Kaua%27i_County%2C_Hawaii.png',
    tags: [],
    status: ""
  }
], 'Oceania');
