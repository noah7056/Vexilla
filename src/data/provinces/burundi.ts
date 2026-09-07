import { createProvinceFlags } from './utils';

export const BURUNDI_PROVINCES = createProvinceFlags('Burundi', [
  {
    name: 'Gitega Province',
    code: 'bi-gip',
    imageUrl: 'https://static.wikia.nocookie.net/vexillology/images/b/bf/Flag_of_Gitega_Province.svg/revision/latest?cb=20240915235325',
    tags: ["blue", "white", "diagonal", "black", "shield"],
    status: "proposed"
  },
  {
    name: 'Bujumbura (City Flag)',
    code: 'bi-buj',
    imageUrl: 'https://static.wikia.nocookie.net/vexillology/images/5/53/Flag_of_Bujumbura.svg/revision/latest/scale-to-width-down/1000?cb=20231208094720',
    tags: ["stripes", "horizontal", "green", "white", "red", "chevron", "star"],
    status: "proposed"
  },
  {
    name: 'Gitega (City Flag)',
    code: 'bi-git',
    imageUrl: 'https://static.wikia.nocookie.net/vexillology/images/c/cb/Flag_of_Gitega.svg/revision/latest?cb=20220702044100',
    tags: ["white", "red", "green", "stars", "circle"],
    status: "proposed"
  }
], "Africa");
