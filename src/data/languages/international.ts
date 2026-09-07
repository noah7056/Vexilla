import { createLanguageFlags } from './utils';

export const INTERNATIONAL_LANGUAGES = createLanguageFlags('International & Macro-Languages', 'Europe', [
  {
    id: "lang-fra",
    name: "French Language / La Francophonie",
    code: "lang-fra",
    continent: "Europe",
    country: "International & Macro-Languages",
    imageUrl: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Flag_of_La_Francophonie.svg&width=320",
    aliases: ["La Francophonie", "OIF", "French", "Français", "Francais", "FR", "FRA"],
    tags: [],
    status: ""
  },
  {
    id: "lang-por",
    name: "Portuguese Language / Lusofonia (CPLP)",
    code: "lang-por",
    continent: "Europe",
    country: "International & Macro-Languages",
    imageUrl: "Flag_CPLP.svg",
    aliases: ["Lusofonia", "CPLP", "Portuguese", "Português", "Portugues", "PT", "POR"],
    tags: [],
    status: ""
  },
  {
    id: "lang-spa",
    name: "Spanish Language / Hispanidad",
    code: "lang-spa",
    continent: "Europe",
    country: "International & Macro-Languages",
    imageUrl: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Flag_of_the_Hispanicity.svg&width=320",
    aliases: ["Hispanidad", "Hispanicity", "Spanish", "Español", "Espanol", "Castellano", "ES", "SPA"],
    tags: [],
    status: ""
  },
  {
    id: "lang-nld",
    name: "Dutch Language / Nederlandse Taalunie",
    code: "lang-nld",
    continent: "Europe",
    country: "International & Macro-Languages",
    imageUrl: "Flag_of_Dutch_language.svg",
    aliases: ["Nederlandse Taalunie", "Dutch Union", "Dutch", "Nederlands", "NL", "NLD"],
    tags: [],
    status: ""
  },
  {
    id: "lang-cel",
    name: "Celtic Languages (Pan-Celtic)",
    code: "lang-cel",
    continent: "Europe",
    country: "International & Macro-Languages",
    imageUrl: "Banniel_Keltia.svg",
    aliases: ["Pan-Celtic", "Celtic", "Keltia", "Six Celtic Nations"],
    tags: [],
    status: ""
  },
  {
    id: "lang-ara",
    name: "Arabic Language / Arab World",
    code: "lang-ara",
    continent: "Africa",
    country: "International & Macro-Languages",
    imageUrl: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Flag_of_the_Arab_League.svg&width=320",
    aliases: ["Arab League", "Arabic", "Al-Arabiyya", "العربية", "AR", "ARA"],
    tags: [],
    status: ""
  },
  {
    id: "lang-trk",
    name: "Turkic Languages / Organization of Turkic States",
    code: "lang-trk",
    continent: "Asia",
    country: "International & Macro-Languages",
    imageUrl: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Flag_of_the_Organization_of_Turkic_States.svg&width=320",
    aliases: ["Organization of Turkic States", "Turkic Council", "Turkic", "Türk", "Turk", "TR"],
    tags: [],
    status: ""
  },
  {
    id: "lang-ful",
    name: "Finno-Ugric-speaking Peoples",
    code: "lang-ful",
    continent: "Europe",
    country: "International & Macro-Languages",
    imageUrl: "Proposed_Finno-Ugric_flag.svg",
    aliases: ["Finno-Ugric", "Uralic Languages", "Finno-Ugrian"],
    tags: [],
    status: ""
  }
]);
