import { createIndigenousFlags } from './utils';

export const LATIN_AMERICA_INDIGENOUS_FLAGS = createIndigenousFlags('Latin America', 'South America', [
  {
    id: "ind-rapanui",
    name: "Rapa Nui (Easter Island)",
    code: "ind-rap",
    continent: "South America",
    country: "Chile",
    imageUrl: "Flag_of_Rapa_Nui,_Chile.svg",
    aliases: ["Rapa Nui", "Easter Island", "Isla de Pascua", "Te Pito o Te Henua", "Rapa Nui Flag"],
    tags: [],
    status: ""
  },
  {
    id: "ind-mapuche",
    name: "Mapuche (Wenufoye)",
    code: "ind-map",
    continent: "South America",
    country: "Chile",
    imageUrl: "Flag_of_the_Mapuches_(1992).svg",
    aliases: ["Mapuche", "Wenufoye", "Mapuche People", "Araucanian Flag", "Wallmapu"],
    tags: [],
    status: ""
  },
  {
    id: "ind-wiphala",
    name: "Wiphala (Andean Indigenous Peoples)",
    code: "ind-wip",
    continent: "South America",
    country: "Bolivia / Peru",
    imageUrl: "Banner_of_the_Qulla_Suyu_(1979).svg",
    aliases: ["Wiphala", "Qullasuyu", "Qulla Suyu", "Aymara", "Quechua", "Andean Flag"],
    tags: [],
    status: ""
  }
]);
