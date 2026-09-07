import { createPirateFlags } from './utils';

export const REGIONAL_PIRATE_FLAGS = createPirateFlags('Corsairs & Regional Fleets', [
  {
    id: "pir-bac",
    name: "Barbary Corsairs (16th Century)",
    image: "16th_Century_Barbary_Corsairs_Flag.svg",
    country: "Mediterranean / North Africa",
    aliases: ["Barbary Corsairs", "Ottoman Corsairs", "Barbary Pirates", "Salé Rovers"],
    tags: [],
    status: "historical",
  },
  {
    id: "pir-bar",
    name: "Hayreddin Barbarossa (Ottoman Corsair)",
    image: "Flag_(Sanjak)_of_Hayreddin_Barbarossa.svg",
    country: "Ottoman Empire / Mediterranean",
    aliases: ["Hayreddin Barbarossa", "Khair ad-Din", "Barbarossa Sanjak", "Kapudan Pasha"],
    tags: [],
    status: "historical",
  },
  {
    id: "pir-rfl",
    name: "Red Flag Fleet (Ching Shih & Cheung Po Tsai)",
    image: "Chinese_Pirate_Flag.svg",
    country: "South China Sea",
    aliases: ["Red Flag Fleet", "Ching Shih", "Cheung Po Tsai", "Zheng Yi Sao", "Guangdong Pirate Fleet"],
    tags: [],
    status: "historical",
  }
]);
