import { createIndigenousFlags } from './utils';

export const OCEANIA_INDIGENOUS_FLAGS = createIndigenousFlags('Oceania', 'Oceania', [
  {
    id: "ind-maori",
    name: "Māori People (Tino Rangatiratanga)",
    code: "ind-mao",
    continent: "Oceania",
    country: "New Zealand",
    imageUrl: "Tino_Rangatiratanga_Maori_sovereignty_movement_flag.svg",
    aliases: ["Māori", "Maori", "Tino Rangatiratanga", "Maori Sovereignty Flag", "Aotearoa"],
    tags: [],
    status: ""
  },
  {
    id: "ind-aboriginal",
    name: "Australian Aboriginal Flag",
    code: "ind-abo",
    continent: "Oceania",
    country: "Australia",
    imageUrl: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Australian_Aboriginal_Flag.svg&width=320",
    aliases: ["Australian Aboriginal", "Aboriginal Flag", "First Nations Australia", "Harold Thomas"],
    tags: [],
    status: ""
  },
  {
    id: "ind-torres",
    name: "Torres Strait Islander Flag",
    code: "ind-tor",
    continent: "Oceania",
    country: "Australia",
    imageUrl: "https://en.wikipedia.org/wiki/Torres_Strait_Islander_flag#/media/File:Flag_of_the_Torres_Strait_Islanders.svg",
    aliases: ["Torres Strait Islander", "Torres Strait Flag", "Bernard Namok", "Zenadth Kes"],
    tags: [],
    status: ""
  }
]);
