import { createIndigenousFlags } from './utils';

export const CANADA_INDIGENOUS_FLAGS = createIndigenousFlags('Canada', 'North America', [
  {
    id: "ind-nunavut",
    name: "Inuit / Nunavut",
    code: "ind-nun",
    continent: "North America",
    country: "Canada",
    imageUrl: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Flag_of_Nunavut.svg&width=320",
    aliases: ["Nunavut", "Inuit", "Inuit Nunangat", "Nunavut Territory", "Inuktitut"],
    tags: [],
    status: ""
  },
  {
    id: "ind-metis",
    name: "Métis People",
    code: "ind-met",
    continent: "North America",
    country: "Canada",
    imageUrl: "Metis_Blue.svg",
    aliases: ["Métis", "Metis", "Métis Nation", "Metis Blue Flag", "Infinity Flag"],
    tags: [],
    status: ""
  }
]);
