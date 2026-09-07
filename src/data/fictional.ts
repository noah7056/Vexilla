import { Flag, FlagStatus } from '../types';

export const FICTIONAL_UNIVERSES: string[] = [
  "Ace Combat",
  "Age of Empires",
  "Anime & Manga",
  "Arma",
  "Avatar: The Last Airbender",
  "Literature & Cinema",
  "Comic Books & Graphic Novels",
  "Disney & Pixar",
  "Dune",
  "Fallout",
  "Far Cry",
  "Floptropica",
  "Futurama & Simpsons",
  "Game of Thrones",
  "Hearts of Iron",
  "Marvel & DC Comics",
  "Memes & Internet Culture",
  "Nineteen Eighty-Four",
  "Star Trek",
  "Star Wars",
  "The Expanse",
  "The Fire Rises",
  "The Lord of the Rings",
  "The Witcher",
  "The Wheel of Time",
  "Tin Tin",
  "Total War",
  "TV Shows Misc.",
  "Videogames Misc.",
  "YouTube Misc."
];

export const FICTIONAL_MEDIA_TYPES: string[] = [
  "Anime & Manga",
  "Comic Books & Graphic Novels",
  "Literature & Cinema",
  "Memes & Internet Culture",
  "TV Shows Misc.",
  "Videogames Misc.",
  "YouTube Misc."
];

export const FICTIONAL_FRANCHISES: string[] = FICTIONAL_UNIVERSES.filter(
  u => !FICTIONAL_MEDIA_TYPES.includes(u)
);

export type FictionalFlagInput = {
  name: string;
  code?: string;
  id?: string;
  imageUrl?: string;
  image?: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus | '';
};

export function createFictionalFlags(
  universe: string,
  flags: FictionalFlagInput[],
  defaultStatus: FlagStatus = 'fictional'
): Flag[] {
  return flags.map(f => {
    let finalImageUrl = f.imageUrl || f.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http')) {
      finalImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${finalImageUrl}`;
    }

    const rawId = f.id || (f.code ? `fic-${f.code}` : `fic-${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    const finalId = rawId.startsWith('fic-') ? rawId : `fic-${rawId}`;
    const finalCode = f.code || f.id || rawId.replace(/^fic-/, '');

    let finalAliases: string[] | undefined = undefined;
    if (f.aliases) {
      if (Array.isArray(f.aliases)) {
        finalAliases = f.aliases.map((a) => String(a).trim()).filter(Boolean);
      } else if (typeof f.aliases === 'string' && (f.aliases as string).trim()) {
        finalAliases = [f.aliases.trim()];
      }
    }

    let finalTags: string[] = [];
    if (f.tags) {
      if (Array.isArray(f.tags)) {
        finalTags = Array.from(new Set(f.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)));
      } else if (typeof f.tags === 'string' && (f.tags as string).trim()) {
        finalTags = [f.tags.trim().toLowerCase()];
      }
    }

    const status = (f.status || defaultStatus) as FlagStatus;

    return {
      id: finalId,
      name: f.name,
      code: finalCode,
      continent: 'Fictional Universes',
      category: 'Fictional',
      country: universe,
      imageUrl: finalImageUrl,
      status,
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags
    };
  });
}

export const FICTIONAL_FLAGS: Flag[] = [
  ...createFictionalFlags("Ace Combat", [
    {
      name: "Federal Republic of Erusea",
      code: "ac-eru",
      image: "Flag_of_the_Federal_Republic_of_Erusea.svg",
      aliases: ["Erusea", "Federal Republic of Erusea", "FRE", "Kingdom of Erusea", "Strangereal", "Ace Combat 04", "Ace Combat 7"],
      tags: ["orange", "white", "coat of arms", "stars"],
    status: "fictional"
    },
    {
      name: "Osean Federation (Ace Combat)",
      code: "ac-ose",
      image: "Flag_of_the_Osean_Federation.svg",
      aliases: ["Osea", "Osean Federation", "OF", "OMDF", "Strangereal", "Ace Combat 5"],
      tags: ["blue", "circle", "stars", "white", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Principality of Belka",
      code: "ac-bel",
      image: "Flag_of_the_Principality_of_Belka.svg",
      aliases: ["Belka", "Principality of Belka", "PB", "Belkan Air Force", "Strangereal", "Ace Combat Zero"],
      tags: ["stripes", "horizontal", "black", "white", "yellow", "tricolor"],
    status: "fictional"
    },
    {
      name: "Republic of Emmeria",
      code: "ac-emm",
      image: "Flag_of_the_Republic_of_Emmeria.svg",
      aliases: ["Emmeria", "Republic of Emmeria", "RE", "Strangereal", "Ace Combat 6", "Gracemeria"],
      tags: ["vertical", "stripes", "blue", "white", "star"],
    status: "fictional"
    },
    {
      name: "Republic of San Salvacion",
      code: "ac-ss",
      image: "Flag_of_San_Salvacion.svg",
      aliases: ["San Salvacion", "Republic of San Salvacion", "RSS", "Strangereal", "Ace Combat 04"],
      tags: ["white", "blue", "red", "canton", "triangle"],
    status: "fictional"
    },
    {
      name: "Republic of Ustio",
      code: "ac-ust",
      image: "Flag_of_the_Republic_of_Ustio.svg",
      aliases: ["Ustio", "Republic of Ustio", "Galm Team", "Valais Air Base", "Strangereal", "Ace Combat Zero"],
      tags: ["chevron", "triangle", "black", "white", "red"],
    status: "fictional"
    },
    {
      name: "Union of Yuktobanian Republics",
      code: "ac-yuk",
      image: "Flag_of_Yuktobania.svg",
      aliases: ["Yuktobania", "UYR", "Union of Yuktobanian Republics", "Strangereal", "Ace Combat 5"],
      tags: ["red", "yellow", "gold", "vertical", "raindeer"],
    status: "fictional"
    },
    {
      name: "Independent State Allied Forces",
      code: "ac-saf",
      image: "Flag_of_the_Independent_State_Allied_Forces.svg",
      aliases: ["ISAF", "Independent State Allied Forces", "Mobius 1", "Strangereal", "Ace Combat 04"],
      tags: ["blue", "arrow", "white", "triangle", "text", "name"],
    status: "fictional"
    },
    {
      name: "Federal Republic of Aurelia",
      code: "ac-fra",
      image: "Flag_of_the_Federal_Republic_of_Aurelia.svg",
      aliases: ["Aurelia", "Federal Republic of Aurelia", "Gryphus 1", "Strangereal", "Ace Combat X"],
      tags: ["stripes", "horizontal", "blue", "white",  "snowflake", "snow"],
    status: "fictional"
    },
    {
      name: "Democratic Republic of Leasath",
      code: "ac-drl",
      image: "Flag_of_the_Democratic_Republic_of_Leasath.svg",
      aliases: ["Leasath", "Democratic Republic of Leasath", "Diego Gaspar Navarro", "Strangereal", "Ace Combat X"],
      tags: ["red", "green", "stripes", "horizontal"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Age of Empires", [
    {
      name: "Tokugawa Shogunate (Age of Empires 3)",
      code: "aoe-ts",
      image: "Bandera_shogunato_tokugawa.png",
      aliases: ["Tokugawa", "Tokugawa Shogunate", "Edo Period", "Japan AoE3", "Mitsuba Aoi"],
      tags: ["coat of arms", "leaf", "circle", "black", "yellow"],
    status: "fictional"
    },
    {
      name: "Inca (Age of Empires 3)",
      code: "aoe-in",
      image: "Flag_Inca_AoE3.svg",
      aliases: ["Inca Empire", "Tawantinsuyu", "Inca AoE3", "Incan Banner"],
      tags: ["checkerboard", "white", "red", "yellow", "brown"],
    status: "fictional"
    },
    {
      name: "Hausa People (Age of Empires 3)",
      code: "aoe-hp",
      image: "Flag_of_the_Hausa_people_AoE3DE.svg",
      aliases: ["Hausa", "Hausa Kingdom", "Dagin Arewa", "Hausa AoE3"],
      tags: ["knot", "green", "white"],
    status: "fictional"
    },
    {
      name: "Ethiopia (Age of Empires 3)",
      code: "aoe-et",
      image: "Flag_of_Ethiopia_AOE3.svg",
      aliases: ["Ethiopian Empire", "Abyssinia", "Ethiopia AoE3", "Solomonic Dynasty"],
      tags: ["red", "green", "yellow", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Netherlands (Age of Empires 3)",
      code: "aoe-nd",
      image: "Flag_of_the_Netherlands_(Age_of_Empires_III).svg",
      aliases: ["Dutch Republic", "United Provinces", "Netherlands AoE3", "Prinsenvlag"],
      tags: ["orange", "white", "blue", "tricolor", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Aztecs (Age of Empires 3)",
      code: "aoe-az",
      image: "Logo_der_Azteken_AoE_III.svg",
      aliases: ["Aztec Empire", "Mexica", "Aztecs AoE3", "Tenochtitlan"],
      tags: ["sun", "gold", "yellow", "orange", "red", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Iroquois (Age of Empires 3)",
      code: "aoe-ir",
      image: "Logo_der_Irokesen_AoE_III.svg",
      aliases: ["Haudenosaunee", "Six Nations", "Iroquois AoE3", "Five Nations"],
      tags: ["circle", "white", "purple", "vertical", "triangle", "stripes"],
    status: "fictional"
    },
    {
      name: "Mongol Empire (Age of Empires 4)",
      code: "aoe-me",
      image: "Flag_of_the_Mongol_Empire_AoE4.svg",
      aliases: ["Mongol Empire", "Mongolia AoE4", "Genghis Khan", "Golden Horde"],
      tags: ["blue", "yellow", "circle", "gold", "moon", "fire"],
    status: "fictional"
    },
    {
      name: "Chinese Flag (Age of Empires 4)",
      code: "aoe-zh",
      image: "AoE4_Chinese_Flag.svg",
      aliases: ["Imperial China", "Ming Dynasty", "Song Dynasty", "China AoE4"],
      tags: ["knot", "red", "orange", "yellow"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Anime & Manga", [
    {
      name: "Chinese Federation (Code Geass)",
      code: "cg-chn",
      image: "Flag_of_Chinese_Federation.svg",
      aliases: ["Chinese Federation", "Code Geass China", "Forbidden City", "High Eunuchs", "Shen Hu"],
      tags: ["red", "star", "sun", "yellow", "white", "gold", "dots", "circle"],
    status: "fictional"
    },
    {
      name: "Germa 66 (Kingdom of Germa)",
      code: "op-g66",
      image: "Germa_66_flag.svg",
      aliases: ["Germa 66", "Kingdom of Germa", "Vinsmoke Family", "Sanji", "One Piece Germa"],
      tags: ["black", "white", "text", "number", "cross"],
    status: "fictional"
    },
    {
      name: "State of Amestris",
      code: "fma-ame",
      image: "Flag_of_Amestris.png",
      aliases: ["Amestris", "Fullmetal Alchemist", "State Military", "Fuhrer Bradley", "FMA"],
      tags: ["dragon", "green", "white"],
    status: "fictional"
    },
    {
      name: "World Government (One Piece)",
      code: "op-wg",
      image: "World_Government_flag.svg",
      aliases: ["World Government", "Gorosei", "Five Elders", "Imu", "One Piece WG"],
      tags: ["circle", "cross", "white", "blue"],
    status: "fictional"
    },
    {
      name: "World Marines (One Piece)",
      code: "op-wm",
      image: "One_Piece_Marines_flag.svg",
      aliases: ["Marines", "Marine Corps", "One Piece Marines", "Navy", "Seagull Flag"],
      tags: ["text", "name", "moon", "white", "blue"],
    status: "fictional"
    },
    {
      name: "Flower Hill (The Squirrel and The Hedgehog)",
      code: "sah-flh",
      image: "https://static.wikia.nocookie.net/vexillology/images/9/97/Flag_of_Flower_hill.png/revision/latest/scale-to-width-down/1000?cb=20241006091252",
      aliases: ["Flower Hill", "Squirrel and Hedgehog", "Geumsaegi", "North Korean Cartoon"],
      tags: ["flower", "green", "pink", "leaf"],
    status: "fictional"
    },
    {
      name: "Britannia (Strike Witches)",
      code: "sw-br",
      image: "Flag_of_Britannia_(Strike_Witches).svg",
      aliases: ["Britannia", "Strike Witches Britannia", "Lynette Bishop"],
      tags: ["blue", "red", "white", "cross", "green", "saltire"],
    status: "fictional"
    },
    {
      name: "Dacia (Strike Witches)",
      code: "sw-da",
      image: "Flag_of_Dacia_(Strike_Witches).svg",
      aliases: ["Dacia", "Strike Witches Dacia", "Karlsland neighbor"],
      tags: ["tricolor", "stripes", "vertical", "blue", "yellow", "red"],
    status: "fictional"
    },
    {
      name: "Holy Britannian Empire (Code Geass)",
      code: "cg-hbe",
      image: "Holy_Britannian_Empire.svg",
      aliases: ["Holy Britannian Empire", "Britannia", "Code Geass Britannia", "Charles zi Britannia", "Lelouch"],
      tags: ["coat of arms", "lion", "cross", "shield", "crown", "red", "white", "gold", "blue", "snake", "leaf"],
    status: "fictional"
    },
    {
      name: "Earth Federation (Mobile Suit Gundam)",
      code: "msg-eaf",
      image: "Flag_of_the_Earth_Federation_(Mobile_Suit_Gundam).svg",
      aliases: ["Earth Federation", "EFGF", "EFSF", "Gundam Federation", "Amuro Ray"],
      tags: ["globe", "triangle", "blue", "yellow", "gold"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Arma", [
    {
      name: "Altis and Stratis (Arma 3)",
      code: "arma-as",
      image: "Flag_of_Altis_and_Stratis_(Arma_3).svg",
      aliases: ["Altis", "Stratis", "Republic of Altis and Stratis", "Arma 3 AAF"],
      tags: ["green", "black", "white", "yellow", "chevron", "triangle"],
    status: "fictional"
    },
    {
      name: "Horizon Islands (Arma 3)",
      code: "arma-hi",
      image: "Flag_of_Horizon_Islands_(Arma_3).svg",
      aliases: ["Horizon Islands", "Tanoa", "Arma 3 Apex", "South Pacific"],
      tags: ["stripes", "diagonal", "blue", "yellow", "green", "white", "star"],
    status: "fictional"
    },
    {
      name: "Republic of Chernarus (ARMA II / DayZ)",
      code: "ad-rc",
      image: "Flag_of_Chernarus.svg",
      aliases: ["Chernarus", "CDF", "DayZ", "South Zagoria", "Arma 2"],
      tags: ["tricolor", "stripes", "diagonal", "green", "white", "yellow", "stars"],
    status: "fictional"
    },
    {
      name: "Livonia (Arma 3)",
      code: "arma-li",
      image: "Flag_of_Livonia_(Arma_3).png",
      aliases: ["Livonia", "LDF", "Livonian Defense Force", "Arma 3 Contact"],
      tags: ["tricolor", "white", "shield", "stars", "blue", "yellow", "gold", "moose", "stripes", "vertical", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Takistan",
      code: "arma-ta",
      image: "Flag_of_Takistan.png",
      aliases: ["Takistan", "Takistani Army", "Arma 2 Operation Arrowhead", "Colonel Aziz"],
      tags: ["tricolor", "stripes", "horizontal", "green", "white", "black", "stars", "moon", "crown"],
    status: "fictional"
    },
    {
      name: "Canton Strategic Alliance Treaty",
      code: "arma-csat",
      image: "Flag_of_the_Canton_Strategic_Alliance_Treaty.png",
      aliases: ["CSAT", "Canton Protocol Strategic Alliance Treaty", "Arma 3 CSAT"],
      tags: ["black", "red", "pentagon"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Avatar: The Last Airbender", [
    {
      name: "Fire Nation",
      code: "atla-fn",
      image: "Flag_of_the_Fire_Nation.png",
      aliases: ["Fire Nation", "Fire Lord", "ATLA Fire Nation", "Zuko", "Ozai", "Azula"],
      tags: ["flame", "red", "black", "gold", "circle"],
    status: "fictional"
    },
    {
      name: "Southern Water Tribe",
      code: "atla-swt",
      image: "Flag_of_the_Southern_Water_Tribe.png",
      aliases: ["Southern Water Tribe", "Water Tribe", "Katara", "Sokka", "ATLA Water Tribe"],
      tags: ["blue", "white", "vertical", "stripes", "cyan", "star", "wave"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Literature & Cinema", [
    {
      name: "Borduria (King Ottokar's Sceptre 1946)",
      code: "tt-bor46",
      image: "Flag_of_Borduria_(Tintin_-_1946).svg",
      aliases: ["Borduria 1946", "Tintin Borduria", "King Ottokar's Sceptre", "Plekszy-Gladz"],
      tags: ["black", "red", "circle", "yellow"],
    status: "fictional"
    },
    {
      name: "Duchy of Grand Fenwick (The Mouse That Roared)",
      code: "lit-dgf",
      image: "Flag_of_Grand_Fenwick.svg",
      aliases: ["Grand Fenwick", "The Mouse That Roared", "Peter Sellers", "Duchess Gloriana XII"],
      tags: ["eagle", "red", "white", "yellow"],
    status: "fictional"
    },
    {
      name: "Narnia",
      code: "nar-nar",
      image: "Flag_of_Narnia.svg",
      aliases: ["Kingdom of Narnia", "Aslan", "Chronicles of Narnia", "C.S. Lewis", "Cair Paravel"],
      tags: ["lion", "red", "green"],
    status: "fictional"
    },
    {
      name: "Telmar (Narnia)",
      code: "nar-tel",
      image: "Flag_of_Telmar.svg",
      aliases: ["Telmar", "Telmarines", "Prince Caspian", "King Miraz"],
      tags: ["bird", "black", "orange"],
    status: "fictional"
    },
    {
      name: "Narnia (New Dynasty)",
      code: "nar-ned",
      image: "Flag_of_Narnia_(New_Dynasty).svg",
      aliases: ["Narnia New Dynasty", "King Caspian", "Golden Age of Narnia"],
      tags: ["lion", "red", "yellow"],
    status: "fictional"
    },
    {
      name: "Archenland (Narnia)",
      code: "nar-arc",
      image: "Flag_of_Archenland_(Narnia).svg",
      aliases: ["Archenland", "Anvard", "King Lune", "The Horse and His Boy"],
      tags: ["gold", "cross", "yellow", "red"],
    status: "fictional"
    },
    {
      name: "Republic of Freedonia (Duck Soup)",
      code: "lit-fre",
      image: "Flag_of_Freedonia.svg",
      aliases: ["Freedonia", "Duck Soup", "Marx Brothers", "Rufus T. Firefly"],
      tags: ["stripes", "yellow", "white", "blue", "circle", "star", "stars", "text", "name", "black", "saltire"],
    status: "fictional"
    },
    {
      name: "Union of Allied Planets (Firefly)",
      code: "ff-all",
      image: "Flag_of_Alliance_(Firefly).svg",
      aliases: ["Alliance", "Union of Allied Planets", "Firefly Alliance", "Serenity"],
      tags: ["stripes", "stars", "red", "blue", "white", "yellow", "horizontal", "vertical", "square"],
    status: "fictional"
    },
    {
      name: "Flag of Independent Planets (Firefly)",
      code: "ff-ind",
      image: "Flag_of_Independent_Planets.svg",
      aliases: ["Browncoats", "Independent Planets", "Firefly Independents", "Battle of Serenity Valley"],
      tags: ["stripes", "horizontal", "green", "yellow", "star", "black", "tricolor"],
    status: "fictional"
    },
    {
      name: "Land of Oz (The Wonderful Wizard of Oz)",
      code: "oz-oz",
      image: "https://static.wikia.nocookie.net/vexillology/images/4/40/Flag_of_Oz.svg/revision/latest/scale-to-width-down/1000?cb=20251107193852",
      aliases: ["Land of Oz", "Wizard of Oz", "Emerald City", "L. Frank Baum"],
      tags: ["blue", "red", "yellow", "purple", "green", "star"],
    status: "fictional"
    },
    {
      name: "Royal Oz Flag (The Wonderful Wizard of Oz)",
      code: "oz-ro",
      image: "Royal_Oz_flag.svg",
      aliases: ["Royal Flag of Oz", "Princess Ozma", "Oz Royal Standard"],
      tags: ["green", "pink", "purple", "white", "cyan", "star"],
    status: "fictional"
    },
    {
      name: "Panem (The Capitol, Hunger Games)",
      code: "hg-pan",
      image: "Flag_of_Panem.svg",
      aliases: ["Panem", "The Capitol", "Hunger Games", "President Snow", "Mockingjay"],
      tags: ["eagle", "wings", "red", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "Black-Yellow-Green Flag (Kunami, Designated Survivor)",
      code: "ds-kn",
      image: "Black-Yellow-Green_Flag_(Kunami).svg",
      aliases: ["Kunami", "Designated Survivor", "President Moss", "Persian Gulf Nation"],
      tags: ["tricolor", "stripes", "horizontal", "black", "yellow", "green"],
    status: "fictional"
    },
    {
      name: "Groot Badens Rijk Country (Thule Trilogy)",
      code: "tt-gb",
      image: "Flag_Groot_Badens_Rijk.svg",
      aliases: ["Groot Badens Rijk", "Thule Trilogy", "Thea Beckman"],
      tags: ["white", "yellow", "lion"],
    status: "fictional"
    },
    {
      name: "Abuddin (Tyrant)",
      code: "ty-ab",
      image: "Flag_of_Abuddin_(Tyrant).svg",
      aliases: ["Abuddin", "Tyrant FX", "Al-Fayeed Dynasty", "Bassam Al-Fayeed"],
      tags: ["stripes", "horizontal", "black", "white", "green", "chevron"],
    status: "fictional"
    },
    {
      name: "Arvee (Lucky Loser)",
      code: "ll-ar",
      image: "Flag_of_Arvee_(Lucky_Loser).svg",
      aliases: ["Arvee", "Lucky Loser", "Comedic Country"],
      tags: ["red"],
    status: "fictional"
    },
    {
      name: "Bahavia (Cory in the House)",
      code: "ch-ba",
      image: "Flag_of_Bahavia.svg",
      aliases: ["Bahavia", "Cory in the House", "Meena Paroom", "Disney Channel"],
      tags: ["stripes", "horizontal", "purple", "green", "yellow"],
    status: "fictional"
    },
    {
      name: "Baracas (CSI: Miami)",
      code: "csi-ba",
      image: "Flag_of_Baracas_(CSI_Miami).svg",
      aliases: ["Baracas", "CSI Miami", "South American Republic"],
      tags: ["stripes", "horizontal", "yellow", "blue", "red", "sun", "white", "circle"],
    status: "fictional"
    },
    {
      name: "Costa Gravas (Chuck)",
      code: "ch-co",
      image: "Flag_of_Costa_Gravas_(Chuck).svg",
      aliases: ["Costa Gravas", "Chuck TV Show", "General Goya", "Armand Assante"],
      tags: ["stripes", "horizontal", "tricolor", "red", "green", "yellow"],
    status: "fictional"
    },
    {
      name: "Dahum (Solo, William Boyd)",
      code: "so-da",
      image: "Flag_of_Dahum_(James_Bond_novels).svg",
      aliases: ["Dahum", "James Bond Solo", "Zanzarim", "West Africa"],
      tags: ["stripes", "horizontal", "circle", "red", "white", "black", "tricolor"],
    status: "fictional"
    },
    {
      name: "Genovia (The Princess Diaries)",
      code: "pc-ge",
      image: "Flag_of_Genovia.svg",
      aliases: ["Genovia", "Princess Diaries", "Mia Thermopolis", "Queen Clarisse Renaldi", "Anne Hathaway"],
      tags: ["tricolor", "stripes", "vertical", "green", "white", "blue"],
    status: "fictional"
    },
    {
      name: "Manetheren (The Shadow Rising / Winter’s Heart)",
      code: "sr-ma",
      image: "Flag_of_Manetheren.svg",
      aliases: ["Manetheren", "The Mountain Home", "Wheel of Time", "Aemon", "Eldrene", "Red Eagle"],
      tags: ["eagle", "red", "blue"],
    status: "fictional"
    },
    {
      name: "Molvanîa (The book Molvanîa: a Land Untouched by Modern Dentistry)",
      code: "bm-mo",
      image: "Flag_of_Molvanîa.svg",
      aliases: ["Molvania", "Molvanîa", "Jetlag Travel Guide", "Santo Cilauro", "Zlad!"],
      tags: ["red", "yellow", "sickle", "hammer", "arrow", "stripes", "vertical"],
    status: "fictional"
    },
    {
      name: "Nambutu (James Bond: Casino Royale)",
      code: "jb-na",
      image: "Flag_of_Nambutu_(James_Bond_films).svg",
      aliases: ["Nambutu", "Casino Royale", "Mollaka", "Madagascar Embassy"],
      tags: ["stripes", "horizontal", "green", "white", "red", "star", "black", "chevron"],
    status: "fictional"
    },
    {
      name: "San Lorenzo (Cat’s Cradle, Kurt Vonnegut)",
      code: "cc-sl",
      image: "Flag_of_San_Lorenzo_(Vonnegut).svg",
      aliases: ["San Lorenzo", "Cat's Cradle", "Bokononism", "Papa Monzano", "Kurt Vonnegut"],
      tags: ["blue", "yellow", "gun", "red", "arrow"],
    status: "fictional"
    },
    {
      name: "San Marcos (Bananas, 1971)",
      code: "ba-sm",
      image: "Flag_of_San_Marcos_(Bananas).svg",
      aliases: ["San Marcos", "Bananas 1971", "Woody Allen", "Fielding Mellish"],
      tags: ["stripes", "horizontal", "yellow", "white", "black", "star"],
    status: "fictional"
    },
    {
      name: "Sodor (The Railway Series, Wilbert Awdry)",
      code: "rs-so",
      image: "Flag_of_Sodor.svg",
      aliases: ["Island of Sodor", "Sodor", "Thomas the Tank Engine", "Sir Topham Hatt", "Railway Series"],
      tags: ["blue", "yellow", "stripes", "gold", "white", "horizontal", "tricolor"],
    status: "fictional"
    },
    {
      name: "Tescara (CSI: NY)",
      code: "csi-so",
      image: "Flag_of_Tescara_(CSI_NY).svg",
      aliases: ["Tescara", "CSI NY", "Caribbean Island"],
      tags: ["blue", "green", "yellow"],
    status: "fictional"
    },
    {
      name: "Kingdom of Kalayaan (The Kingdom, 2024)",
      code: "tk-kk",
      image: "Flag_of_the_Kingdom_of_Kalayaan.svg",
      aliases: ["Kalayaan", "Kingdom of Kalayaan", "The Kingdom 2024", "Philippine Fictional Kingdom"],
      tags: ["sun", "red", "blue", "yellow", "gold", "stripes", "diagonal"],
    status: "fictional"
    },
    {
      name: "Wadiya (The Dictator, 2012)",
      code: "td-wa",
      image: "Flag_of_Wadiya.svg",
      aliases: ["Republic of Wadiya", "Wadiya", "Admiral General Aladeen", "Sacha Baron Cohen", "The Dictator"],
      tags: ["tricolor", "stripes", "horizontal", "green", "orange", "text", "white", "star"],
    status: "fictional"
    },
    {
      name: "Phaic Tăn Flag (Phaic Tăn, Tom Gleisner)",
      code: "pt-pt",
      image: "Flag_Phaic_Tan.svg",
      aliases: ["Phaic Tan", "Phaic Tăn", "Sunstroke on a Shoestring", "Jetlag Travel"],
      tags: ["stripes", "horizontal", "red", "white", "green", "blue", "cross"],
    status: "fictional"
    },
    {
      name: "Japanese Pacific States (The Man in the High Castle)",
      code: "mhc-jps",
      image: "JPS_flag.svg",
      aliases: ["JPS", "Japanese Pacific States", "Man in the High Castle", "Philip K. Dick", "San Francisco"],
      tags: ["sun", "circle", "white", "red", "blue", "stripes", "diagonal", "stars"],
    status: "fictional"
    },
    {
      name: "Tomania (The Great Dictator)",
      code: "gd-to",
      image: "Tomania_flag.svg",
      aliases: ["Tomania", "The Great Dictator", "Adenoid Hynkel", "Charlie Chaplin", "Double Cross"],
      tags: ["cross", "circle", "white", "red", "black"],
    status: "fictional"
    },
    {
      name: "Turgestan (6 Underground / Borgen)",
      code: "ub-tu",
      image: "Turgestan_flag.svg",
      aliases: ["Turgestan", "6 Underground", "Rovach Alimov", "Michael Bay"],
      tags: ["stripes", "horizontal", "black", "white", "green", "moon"],
    status: "fictional"
    },
    {
      name: "Robur le Conqueror Flag (Jules Verne)",
      code: "rc-rc",
      image: "Robur_le_Conqueror_flag.jpg",
      aliases: ["Robur the Conqueror", "Jules Verne", "The Albatross", "Master of the World"],
      tags: ["sun", "black", "stars", "yellow", "gold"],
    status: "fictional"
    },
    {
      name: "Frank Reynolds’ Unfortunate Team Flag (Chardee MacDennis 2: Electric Boogaloo)",
      code: "cmd-utf",
      image: "Frank_Reynolds%27_Unfortunate_Team_Flag.png",
      aliases: ["Frank Reynolds Flag", "Chardee MacDennis", "It's Always Sunny in Philadelphia", "Danny DeVito", "IASIP"],
      tags: ["circle", "black", "white", "red", "yellow", "F"],
    status: "fictional"
    },
    {
      name: "Captain Nemo’s Flag (Jules Verne)",
      code: "cn-cnf",
      image: "Captain_Nemo%27s_Flag.png",
      aliases: ["Captain Nemo", "Nautilus", "Twenty Thousand Leagues Under the Sea", "Mobilis in Mobili", "Jules Verne"],
      tags: ["black", "gold", "yellow", "N", "circle"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Comic Books & Graphic Novels", [
    {
      name: "Axe Planet (HK, Kevin Hérault 1996)",
      code: "hk-ax",
      image: "Flag_of_Axe.svg",
      aliases: ["Axe", "Axe Planet", "HK Comic", "Kevin Herault"],
      tags: ["red", "circle", "black", "dot"],
    status: "fictional"
    },
    {
      name: "Bangalla (The Phantom, Lee Falk 1936)",
      code: "tp-ba",
      image: "Flag_of_Bangalla_(The_Phantom).svg",
      aliases: ["Bangalla", "The Phantom", "Lee Falk", "Ghost Who Walks", "Skull Cave"],
      tags: ["blue", "yellow", "moon", "star", "circle"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Disney & Pixar", [
    {
      name: "Kingdom of Ariendelle (Frozen)",
      code: "fro-koa",
      image: "https://static.wikia.nocookie.net/vexillology/images/4/4b/Flag_of_Arendelle_from_Frozen.png/revision/latest/scale-to-width-down/1000?cb=20240630180525",
      aliases: ["Arendelle", "Kingdom of Arendelle", "Frozen", "Queen Elsa", "Princess Anna", "Disney Frozen"],
      tags: ["flower", "purple", "green", "gold"],
    status: "fictional"
    },
    {
      name: "New Rearendia (Cars 2)",
      code: "ca-nr",
      image: "Flag_of_New_Rearendia_(Cars_2).svg",
      aliases: ["New Rearendia", "Cars 2", "Rip Clutchgoneski", "Pixar Cars"],
      tags: ["cross", "horizontal", "orange", "gold", "green", "red", "wheel", "cog"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Dune", [
    {
      name: "CHOAM (Combine Honnete Ober Advancer Mercantiles)",
      code: "dune-cho",
      image: "CHOAM_flag_Dune.svg",
      aliases: ["CHOAM", "Combine Honnete Ober Advancer Mercantiles", "Dune Universe", "Frank Herbert", "Spacing Guild"],
      tags: ["red", "black", "circle", "yellow"],
    status: "fictional"
    },
    {
      name: "House Atreides (Red Hawk)",
      code: "dune-atr",
      image: "Atreides_guidon_(hawk).svg",
      aliases: ["House Atreides", "Atreides Hawk", "Duke Leto", "Paul Atreides", "Caladan", "Dune Atreides"],
      tags: ["bird", "red", "green", "black"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Fallout", [
    {
      name: "Caesar's Legion (Golden Bull)",
      code: "fo-leg",
      image: "Flag_of_Caesars_Legion.svg",
      aliases: ["Caesar's Legion", "The Legion", "Fallout New Vegas", "Edward Sallow", "Legate Lanius"],
      tags: ["bull", "red", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "New California Republic (Fallout 2)",
      code: "fo-ncr2",
      image: "NCR_Flag_(Fallout_2).svg",
      aliases: ["NCR Fallout 2", "New California Republic 1998", "Shady Sands", "Tandi"],
      tags: ["bear", "star", "red", "white", "stripes", "horizontal", "green", "brown", "text", "name"],
    status: "fictional"
    },
    {
      name: "New California Republic (NCR - Two-Headed Bear)",
      code: "fo-ncr",
      image: "Flag_of_the_New_California_Republic.svg",
      aliases: ["NCR", "New California Republic", "Fallout New Vegas", "NCR Bear Flag", "Mojave Wasteland"],
      tags: ["bear", "star", "red", "white", "brown", "stripes", "horizontal", "green"],
    status: "fictional"
    },
    {
      name: "People's Republic of China (Fallout Universe)",
      code: "fo-chn",
      image: "Flag_of_China_(Fallout).svg",
      aliases: ["Fallout China", "PRC Fallout", "Great War 2077", "Crimson Dragoon"],
      tags: ["red", "stars", "yellow", "gold", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "The Enclave (Fallout Emblem)",
      code: "fo-enc2",
      image: "Flag_of_the_Enclave_(Fallout).svg",
      aliases: ["Enclave Emblem", "The Enclave", "Fallout Enclave", "Poseidon Energy", "President Eden"],
      tags: ["circle", "stars", "blue", "white", "red", "E"],
    status: "fictional"
    },
    {
      name: "The Enclave (Fallout Standard)",
      code: "fo-enc",
      image: "Flag_of_the_Enclave.svg",
      aliases: ["Enclave Flag", "The Enclave Standard", "Autumn", "Oil Rig", "Fallout 2 Enclave"],
      tags: ["circle", "stars", "blue", "white", "red", "E"],
    status: "fictional"
    },
    {
      name: "United States (Fallout Universe)",
      code: "fo-usa",
      image: "Flag_of_the_United_States_(Fallout).svg",
      aliases: ["Fallout USA", "Pre-War America", "13 Commonwealths", "Fallout US Flag"],
      tags: ["circle", "stars", "blue", "white", "red", "star"],
    status: "fictional"
    },
    {
      name: "Children of the Cathedral Flag",
      code: "fo-ccf",
      image: "Children_of_the_Cathedral_Flag.svg",
      aliases: ["Children of the Cathedral", "The Master", "Fallout 1", "Cathedral of the Apocalypse"],
      tags: ["nuclear", "circle", "red", "gold", "yellow", "black"],
    status: "fictional"
    },
    {
      name: "Church of the Children of Atom",
      code: "fo-cca",
      image: "Church_of_the_Children_of_Atom_Flag.svg",
      aliases: ["Children of Atom", "Megaton", "Confessor Cromwell", "Atom's Glow", "Fallout 3", "Fallout 4"],
      tags: ["gray", "grey", "white", "circle"],
    status: "fictional"
    },
    {
      name: "Thirteen Commonwealths of America",
      code: "fo-tca",
      image: "Thirteen_Commonwealths_of_America_Flag.png",
      aliases: ["13 Commonwealths", "Pre-War US Commonwealths", "Fallout America", "American Commonwealths"],
      tags: ["circle", "stars", "blue", "white", "red", "star"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Far Cry", [
    {
      name: "1967 Revolution Flag",
      code: "fc-ref",
      image: "1967_revolution_flag.webp",
      aliases: ["Far Cry 6 Revolution", "Santos Espinosa", "67 Revolution", "Yara 1967"],
      tags: ["stripes", "blue", "white", "star", "circle"],
    status: "fictional"
    },
    {
      name: "Far Cry 5 Flag (No Stripes)",
      code: "fc-fc5ns",
      image: "Far_Cry_5_flag_(without_stripes).svg",
      aliases: ["Project at Eden's Gate Clean", "Pegies Flag", "Eden's Gate No Stripes", "Hope County"],
      tags: ["cross", "blue", "white"],
    status: "fictional"
    },
    {
      name: "Far Cry 5",
      code: "fc-fc5",
      image: "Far_Cry_5_flag.svg",
      aliases: ["Project at Eden's Gate", "Joseph Seed", "Eden's Gate", "Hope County Montana", "Far Cry 5"],
      tags: ["canton", "cross", "stripes", "red", "white", "blue"],
    status: "fictional"
    },
    {
      name: "Flag of Yara 1967",
      code: "fc-yar",
      image: "Flag_of_Yara_1967.png",
      aliases: ["Yara 1967", "Far Cry 6 Yara", "Pre-Castillo Yara", "Yaran Republic"],
      tags: ["triangle", "star", "stripes", "chevron", "blue", "white", "red"],
    status: "fictional"
    },
    {
      name: "Flag of Yara under Gabriel Castillo",
      code: "fc-yag",
      image: "Flag_of_Yara_under_Gabriel_Castillo.webp",
      aliases: ["Castillo Yara", "Anton Castillo", "Gabriel Castillo", "Far Cry 6 Regime", "Lion of Yara"],
      tags: ["lion", "chevron", "red", "white",],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Floptropica", [
    {
      name: "Flag of Floptropica",
      code: "flo-flo",
      image: "https://static.wikia.nocookie.net/floptok/images/c/cc/Official_Floptropica_flag.jpg/revision/latest/scale-to-width-down/1000?cb=20231110100039",
      aliases: ["Floptropica", "Floptok", "Official Floptropica Flag", "Deborah Ali-Williams", "Jiafei"],
      tags: ["tricolor", "stripes", "horizontal", "pink", "magenta", "blue", "yellow", "tree", "palm"],
    status: "fictional"
    },
    {
      name: "C.V.M.",
      code: "flo-cvm",
      image: "https://static.wikia.nocookie.net/floptok/images/8/81/C.V.M_flag_new.png/revision/latest?cb=20260617224636",
      aliases: ["CVM", "C.V.M.", "Floptok CVM", "Cvmberty Military"],
      tags: ["stripes", "pink", "white", "circle", "dot", "saltire"],
    status: "fictional"
    },
    {
      name: "CupcakKia",
      code: "flo-cup",
      image: "https://static.wikia.nocookie.net/floptok/images/7/7e/CupcakKia_Flag.png/revision/latest?cb=20240412143248",
      aliases: ["CupcakKia", "CupcakKe Nation", "Floptok CupcakKia"],
      tags: ["pink", "white", "yellow", "horizontal", "tricolor", "stripes", "star", "circle"],
    status: "fictional"
    },
    {
      name: "Cvmberty Island",
      code: "flo-cbi",
      image: "https://static.wikia.nocookie.net/floptok/images/0/03/Cvmberty_Island_Flag.png/revision/latest?cb=20240429150935",
      aliases: ["Cvmberty Island", "Cvmberty", "Floptok Island"],
      tags: ["stripes", "vertical", "green", "purple", "statue", "torch", "white", "tricolor"],
    status: "fictional"
    },
    {
      name: "Floptokia",
      code: "flo-ftk",
      image: "https://static.wikia.nocookie.net/floptok/images/a/a4/FloptokiaFlag.png/revision/latest?cb=20240404171652",
      aliases: ["Floptokia", "Floptropica Floptokia"],
      tags: ["pink", "white", "purple", "stripes", "diagonal", "stars", "logo", "tiktok", "tricolor"],
    status: "fictional"
    },
    {
      name: "Jiafeia",
      code: "flo-jia",
      image: "https://static.wikia.nocookie.net/floptok/images/5/5e/Jiafeiaflag.png/revision/latest?cb=20240516144727",
      aliases: ["Jiafeia", "Republic of Jiafeia", "Queen Jiafei", "Jiafei Products"],
      tags: ["pink", "stars", "star", "magenta", "purple", "white", "stripes", "diagonal", "circle"],
    status: "fictional"
    },
    {
      name: "New Bahamas",
      code: "flo-nbh",
      image: "https://static.wikia.nocookie.net/floptok/images/5/53/New_Bahamas.png/revision/latest?cb=20260617225312",
      aliases: ["New Bahamas", "Floptropica New Bahamas"],
      tags: ["stripes", "horizontal", "white", "pink", "black", "triangle", "chevron", "star"],
    status: "fictional"
    },
    {
      name: "New Barbados",
      code: "flo-nbr",
      image: "https://static.wikia.nocookie.net/floptok/images/6/6a/NB_Flag.png/revision/latest?cb=20240310093934",
      aliases: ["New Barbados", "Floptropica New Barbados"],
      tags: ["stripes", "vertical", "trident", "black", "pink", "white"],
    status: "fictional"
    },
    {
      name: "Potaxiene",
      code: "flo-pot",
      image: "https://static.wikia.nocookie.net/floptok/images/9/9b/Potaxiene_State_Flag.png/revision/latest?cb=20250608095155",
      aliases: ["Potaxiene", "Potaxie", "Potaxies Nation", "Tilina"],
      tags: ["green", "pink", "white", "yellow", "sun", "stripes", "vertical", "tricolor"],
    status: "fictional"
    },
    {
      name: "Floptopia (Capital Territory)",
      code: "flo-flp",
      image: "https://static.wikia.nocookie.net/floptok/images/5/57/Floptopia_Flag.png/revision/latest?cb=20240707102624",
      aliases: ["Floptopia Capital", "Floptopia Territory", "Floptok Capital"],
      tags: ["pink", "white", "yellow", "horizontal", "stripes", "lotus", "flower"],
    status: "fictional"
    },
    {
      name: "Merflopia (Territory)",
      code: "flo-mer",
      image: "https://static.wikia.nocookie.net/floptok/images/f/ff/Merflopia_Flag.png/revision/latest?cb=20240509160135",
      aliases: ["Merflopia", "Mermaid Floptropica"],
      tags: ["blue", "purple", "lavender", "pink", "white", "star", "triangle"],
    status: "fictional"
    },
    {
      name: "Nu’ Mantu (Dependent Nation)",
      code: "flo-nmn",
      image: "https://static.wikia.nocookie.net/floptok/images/d/d1/Nu%E2%80%99_Mantu_Flag.png/revision/latest?cb=20251114080716",
      aliases: ["Nu Mantu", "Nu' Mantu", "Floptropica Nu Mantu"],
      tags: ["crescent", "moon", "purple", "white", "yellow", "stripes", "diagonal", "gray", "grey"],
    status: "fictional"
    },
    {
      name: "Summeria (Dependent Nation)",
      code: "flo-sum",
      image: "https://static.wikia.nocookie.net/floptok/images/9/9d/Summeria_Flag.png/revision/latest?cb=20240430143922",
      aliases: ["Summeria", "Floptropica Summeria"],
      tags: ["sun", "stripes", "yellow", "orange", "white", "diagonal"],
    status: "fictional"
    },
    {
      name: "Khøre Rocks (Dependent Nation)",
      code: "flo-khr",
      image: "https://static.wikia.nocookie.net/floptok/images/e/e9/Kh%C3%B8re_Rocks_Flag.png/revision/latest?cb=20240406175814",
      aliases: ["Khøre Rocks", "Khore Rocks", "Floptropica Rocks"],
      tags: ["black", "stars", "magenta", "'pink'", "blue", "white", "chevron", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Reina (Antarctic Territory)",
      code: "flo-rei",
      image: "https://static.wikia.nocookie.net/floptok/images/c/c8/Flag_of_Reina.png/revision/latest?cb=20240520183859",
      aliases: ["Reina", "Reina Antarctic", "Floptropica Antarctica"],
      tags: ["pink", "white", "magenta", "triangle", "horizontal", "stripes"],
    status: "fictional"
    },
    {
      name: "Flag of The Overseas Territories",
      code: "flo-tot",
      image: "https://static.wikia.nocookie.net/floptok/images/9/99/Overseas_Territories_Flag.png/revision/latest?cb=20240530151540",
      aliases: ["Floptropica Overseas Territories", "Overseas Territories"],
      tags: ["pink", "white", "black", "circle", "stripes", "horizontal", "tricolor"],
    status: "fictional"
    },
    {
      name: "Border Island (Overseas Territory)",
      code: "flo-bat",
      image: "https://static.wikia.nocookie.net/floptok/images/8/89/Border_Island_Flag.png/revision/latest?cb=20240531073742",
      aliases: ["Border Island", "Floptropica Border"],
      tags: ["stripes", "diagonal", "pink", "white", "black", "tricolor"],
    status: "fictional"
    },
    {
      name: "Chubaska Island (Overseas Territory)",
      code: "flo-chi",
      image: "https://static.wikia.nocookie.net/floptok/images/1/1d/Chubaska_Island_Flag.png/revision/latest?cb=20240531080418",
      aliases: ["Chubaska Island", "Chubaska"],
      tags: ["purple", "lavender", "blue", "white", "horizontal", "stripes", "star"],
    status: "fictional"
    },
    {
      name: "Cross Coves (Overseas Territory)",
      code: "flo-crc",
      image: "https://static.wikia.nocookie.net/floptok/images/a/a9/Cross_Coves_Flag.png/revision/latest?cb=20240531074911",
      aliases: ["Cross Coves", "Cross Coves Island"],
      tags: ["blue", "yellow", "white", "pink", "stars", "waves", "vertical"],
    status: "fictional"
    },
    {
      name: "Fishy Islands (Overseas Territory)",
      code: "flo-fis",
      image: "https://static.wikia.nocookie.net/floptok/images/d/dc/Fishy_Islands_Flag.png/revision/latest?cb=20240707000704",
      aliases: ["Fishy Islands", "Fishy Territory"],
      tags: ["stripes", "horizontal", "blue", "white", "pink", "star", "tricolor"],
    status: "fictional"
    },
    {
      name: "Gulpa Islands (Overseas Territory)",
      code: "flo-gul",
      image: "https://static.wikia.nocookie.net/floptok/images/c/cc/Gulpa_Islands_Flag.png/revision/latest?cb=20240531081401",
      aliases: ["Gulpa Islands", "Gulpa Territory"],
      tags: ["pink", "yellow", "purple", "star", "white", "stripes", "vertical"],
    status: "fictional"
    },
    {
      name: "Nuëm Rocks (Overseas Territory)",
      code: "flo-nue",
      image: "https://static.wikia.nocookie.net/floptok/images/d/df/Nu%C3%ABm_Rocks_Flag.png/revision/latest?cb=20240531074230",
      aliases: ["Nuëm Rocks", "Nuem Rocks"],
      tags: ["blue", "pink", "stars", "white", "waves", "horizontal"],
    status: "fictional"
    },
    {
      name: "Pajaros Islands (Overseas Territory)",
      code: "flo-paj",
      image: "https://static.wikia.nocookie.net/floptok/images/9/99/Pajaros_%28Pahaross%29_Islands_Flag.png/revision/latest?cb=20240531083959",
      aliases: ["Pajaros Islands", "Pahaross Islands"],
      tags: ["sun", "white", "pink", "stripes", "diagonal"],
    status: "fictional"
    },
    {
      name: "Pusi and Pinang Islands (Overseas Territory)",
      code: "flo-pap",
      image: "https://static.wikia.nocookie.net/floptok/images/8/8b/Pusi_and_Pinang_Islands_Flag.png/revision/latest?cb=20240531074616",
      aliases: ["Pusi and Pinang Islands", "Pusi Pinang"],
      tags: ["pink", "border", "square", "white", "stars", "clovers", "circle"],
    status: "fictional"
    },
    {
      name: "Floptopia (Capital City Flag)",
      code: "flo-flc",
      image: "https://static.wikia.nocookie.net/floptok/images/7/74/Floptopia_City_Flag.png/revision/latest?cb=20240709194136",
      aliases: ["Floptopia City", "City of Floptopia"],
      tags: ["lotus", "flower", "pink", "yellow", "white", "stripes", "horizontal", "stars", "tricolor"],
    status: "fictional"
    },
    {
      name: "Jilu (City Flag)",
      code: "flo-jil",
      image: "https://static.wikia.nocookie.net/floptok/images/2/25/Jilu_flag.png/revision/latest?cb=20240502065137",
      aliases: ["Jilu City", "City of Jilu"],
      tags: ["purple", "pink", "white", "stripes", "diagonal", "star", "circle"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Futurama & Simpsons", [
    {
      name: "Camp Bart (The Simpsons S4 E1)",
      code: "simp-bart",
      image: "Flag_of_Camp_Bart_from_The_Simpsons,_S4_E1.svg",
      aliases: ["Camp Bart", "Kamp Krusty", "Simpsons Kamp Krusty", "Bart Simpson Flag"],
      tags: ["skull", "bones", "black", "white", "text", "name"],
    status: "fictional"
    },
    {
      name: "Decapod 10 (Dr. Zoidberg's Homeworld)",
      code: "fut-dec",
      image: "Flag_of_Decapod_10.svg",
      aliases: ["Decapod 10", "Decapodians", "Dr Zoidberg", "Futurama Decapod"],
      tags: ["red", "orange", "white", "black", "hammer", "circle"],
    status: "fictional"
    },
    {
      name: "Earth (Old Freebie - Futurama)",
      code: "fut-ear",
      image: "Futurama_flag_of_Earth.svg",
      aliases: ["Old Freebie", "Futurama Earth Flag", "President Nixon", "United Earth Futurama"],
      tags: ["stripes", "horizontal", "stars", "canton", "globe", "red", "white", "blue", "green"],
    status: "fictional"
    },
    {
      name: "Globetrotters Homeworld",
      code: "fut-glo",
      image: "Flag_of_the_Globetrotters_Homeworld.svg",
      aliases: ["Globetrotters", "Harlem Globetrotters Homeworld", "Futurama Globetrotters", "Ethan Bubblegum Tate"],
      tags: ["stripes", "horizontal", "red", "blue", "white"],
    status: "fictional"
    },
    {
      name: "Springfield State (The Simpsons)",
      code: "simp-spr",
      image: "Springfield_State_Flag_(The_Simpsons).svg",
      aliases: ["Springfield State", "The Simpsons State Flag", "Jebediah Springfield"],
      tags: ["green", "white", "orange", "blue", "star", "horizontal", "stripes"],
    status: "fictional"
    },
    {
      name: "Palm Corners (The Simpsons S11 E19)",
      code: "simp-plc",
      image: "Flag_of_Palm_Corners_from_the_Simpsons,_S11_E19.png",
      aliases: ["Palm Corners", "Kill the Alligator and Run", "Simpsons Florida"],
      tags: ["blue", "red", "green", "stripes", "horizontal", "squares"],
    status: "fictional"
    },
    {
      name: "Springfield City Flag (The Simpsons)",
      code: "simp-spf",
      image: "https://static.wikia.nocookie.net/vexillology/images/a/ab/Flag_of_Springfield_city.jpg/revision/latest/scale-to-width-down/1000?cb=20241025214735",
      aliases: ["Springfield City", "Town of Springfield", "Simpsons Town Flag"],
      tags: ["coat of arms", "yellow", "blue", "red", "brown", "shield", "beaver", "text", "name"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Game of Thrones", [
    {
      name: "House Arryn of the Eyrie (Falcon and Moon)",
      code: "got-arr",
      image: "Coat_of_arms_of_House_Arryn_of_the_Eyrie.svg",
      aliases: ["House Arryn", "The Eyrie", "As High as Honor", "Jon Arryn", "Robin Arryn", "Game of Thrones Arryn"],
      tags: ["bird", "white", "blue", "circle", "coat of arms"],
    status: "fictional"
    },
    {
      name: "House Baelish of Harrenhal (Mockingbird)",
      code: "got-bae",
      image: "Coat_of_arms_of_House_Baelish_of_Harrenhal.svg",
      aliases: ["House Baelish", "Littlefinger", "Petyr Baelish", "Harrenhal Mockingbird"],
      tags: ["green", "birds", "coat of arms"],
    status: "fictional"
    },
    {
      name: "House Baratheon of Dragonstone (Flaming Heart)",
      code: "got-bard",
      image: "Coat_of_arms_of_House_Baratheon_of_Dragonstone.svg",
      aliases: ["Baratheon of Dragonstone", "Stannis Baratheon", "Lord of Light", "R'hllor Stag"],
      tags: ["black", "heart", "red", "yellow", "flame", "sun", "animal"],
    status: "fictional"
    },
    {
      name: "House Baratheon of King's Landing (Crowned Stag)",
      code: "got-bark",
      image: "Coat_of_arms_of_House_Baratheon_of_King's_Landing.svg",
      aliases: ["House Baratheon", "Ours is the Fury", "Robert Baratheon", "Crowned Stag of Storm's End"],
      tags: ["black", "gold", "yellow", "red", "vertical", "stripes", "animal", "lion", "coat of arms"],
    status: "fictional"
    },
    {
      name: "House Clegane (Three Dogs)",
      code: "got-cle",
      image: "Coat_of_arms_of_House_Clegane.svg",
      aliases: ["House Clegane", "The Hound", "The Mountain", "Sandor Clegane", "Gregor Clegane"],
      tags: ["black", "yellow", "dogs", "coat of arms"],
    status: "fictional"
    },
    {
      name: "House Nymeros Martell of Sunspear (Sun and Spear)",
      code: "got-mar",
      image: "Coat_of_arms_of_House_Nymeros_Martell_of_Sunspear.svg",
      aliases: ["House Martell", "Sunspear", "Unbowed Unbent Unbroken", "Oberyn Martell", "Dorne"],
      tags: ["sun", "spear", "red", "orange", "gold", "yellow", "arrow"],
    status: "fictional"
    },
    {
      name: "House Ryswell of the Rills (Horsehead)",
      code: "got-rys",
      image: "Coat_of_arms_of_House_Ryswell_of_the_Rills.svg",
      aliases: ["House Ryswell", "The Rills", "North Bannermen", "Horse's Head"],
      tags: ["horse", "black", "red", "bronze", "brown", "coat of arms"],
    status: "fictional"
    },
    {
      name: "House Tully of Riverrun (Trout)",
      code: "got-tul",
      image: "Coat_of_arms_of_House_Tully_of_Riverrun.svg",
      aliases: ["House Tully", "Riverrun", "Family Duty Honor", "Catelyn Stark", "Blackfish"],
      tags: ["silver", "gray", "grey", "stripes", "vertical", "waves", "red", "blue", "white", "fish", "coat of arms"],
    status: "fictional"
    },
    {
      name: "House Tyrell of Highgarden (Rose)",
      code: "got-tyr",
      image: "Coat_of_arms_of_House_Tyrell_of_Highgarden.svg",
      aliases: ["House Tyrell", "Highgarden", "Growing Strong", "Margaery Tyrell", "Olenna Tyrell"],
      tags: ["rose", "green", "flower", "gold", "yellow", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Valyrian Freehold (High Valyrian)",
      code: "got-val",
      image: "Flag_of_High_Valyrian.svg",
      aliases: ["Valyrian Freehold", "High Valyrian", "Old Valyria", "Dragonlords", "House of the Dragon"],
      tags: ["dragon", "red", "black", "gold", "yellow", "fire", "flame"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Hearts of Iron", [
    {
      name: "Odenstaat Burgund (HOI4 mod The New Order: Last Days of Europe)",
      code: "hoim-od",
      image: "Flag_of_Odenstaat_Burgund_(fictional).svg",
      aliases: ["Ordensstaat Burgund", "Burgundy TNO", "Heinrich Himmler", "The New Order HOI4"],
      tags: ["black"],
    status: "fictional"
    },
    {
      name: "American Union State Flag (HOI4 mod Kaiserreich)",
      code: "hoim-ausf",
      image: "American_Union_State_Flag_from_Kaiserreich.png",
      aliases: ["American Union State", "AUS", "Huey Long", "Every Man a King", "Kaiserreich AUS"],
      tags: ["eagle", "sword", "torch", "red", "white", "blue", "gold", "shield"],
    status: "fictional"
    },
    {
      name: "Combined Syndicates Flag (HOI4 mod Kaiserreich)",
      code: "hoim-csf",
      image: "Combined_Syndicates_Flag_for_Kaiserreich.webp",
      aliases: ["Combined Syndicates of America", "CSA Kaiserreich", "Jack Reed", "Syndicalist America"],
      tags: ["diagonal", "red", "stripes", "black", "white", "circle", "globe", "text", "stars"],
    status: "fictional"
    },
    {
      name: "Commune of France (HOI4 mod Kaiserreich)",
      code: "hoim-cof",
      image: "Commune_of_France_flag_kaiserreich.webp",
      aliases: ["Commune of France", "Third Republic Syndicalist", "Kaiserreich France", "Syndicalism"],
      tags: ["stripes", "blue", "white", "red", "hammer", "torch", "gold", "yellow", "coat of arms", "wheel", "cog", "circle", "arrow"],
    status: "fictional"
    },
    {
      name: "Workers Commonwealth of America (HOI4 mod Kaiserreich)",
      code: "hoim-wca",
      image: "Flag_of_the_Workers_Commonwealth_of_America_(Kaiserreich).svg",
      aliases: ["Workers Commonwealth of America", "Totalist America", "Kaiserreich WCA"],
      tags: ["red", "canton", "white", "blue", "stars"],
    status: "fictional"
    },
    {
      name: "Socialist Republic of Italy (HOI4 mod Kaiserreich)",
      code: "hoim-sri",
      image: "Flag_of_the_Socialist_Republic_of_Italy_(Kaiserreich).svg",
      aliases: ["Socialist Republic of Italy", "SRI Kaiserreich", "Italian Syndicalists"],
      tags: ["green", "red", "white", "border", "star", "wheel", "cog"],
    status: "fictional"
    },
    {
      name: "Two Sicilies (HOI4 mod Kaiserreich)",
      code: "hoim-tws",
      image: "Flag_of_Two_Sicilies_(Kaiserreich).png",
      aliases: ["Kingdom of the Two Sicilies", "Two Sicilies Kaiserreich", "House of Bourbon-Two Sicilies"],
      tags: ["white", "coat of arms", "fleur-de-lis", "shield", "gold", "blue", "red", "yellow", "crown", "border", "horizontal", "stripes"],
    status: "fictional"
    },
    {
      name: "Flanders-Wallonia (HOI4 mod Kaiserreich)",
      code: "hoim-flw",
      image: "Flanders-Wallonia_kaiserreich.webp",
      aliases: ["Flanders-Wallonia", "Kaiserreich Belgium", "Belgian Faction"],
      tags: ["lion", "rooster", "coat of arms", "yellow", "white", "red", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "AFP Minutemen (HOI4 mod Kaiserreich)",
      code: "hoim-afpm",
      image: "Kaiserreich_AFP_Minutemen.png",
      aliases: ["AFP Minutemen", "American First Party", "Minutemen Militia", "Kaiserreich Minutemen"],
      tags: ["blue", "stripes", "vertical", "white", "red", "tricolor"],
    status: "fictional"
    },
    {
      name: "Ma Family Military Clique (HOI4 mod Kaiserreich)",
      code: "hoim-mmc",
      image: "Ma_clique_flag_kaiserreich.png",
      aliases: ["Ma Clique", "Northwest San Ma", "Chinese Warlords", "Kaiserreich China"],
      tags: ["red", "white", "crescent", "star"],
    status: "fictional"
    },
    {
      name: "Mongolia (HOI4 mod Kaiserreich)",
      code: "hoim-mon",
      image: "Mongolia_flag_kaiserreich.png",
      aliases: ["Mongolia Kaiserreich", "Roman von Ungern-Sternberg", "Mad Baron", "Bogd Khanate"],
      tags: ["yellow", "black", "moon", "circle", "dot"],
    status: "fictional"
    },
    {
      name: "Nicaragua (HOI4 mod Kaiserreich)",
      code: "hoim-nic",
      image: "Nicaragua_kaiserreich.webp",
      aliases: ["Nicaragua Kaiserreich", "Central American Faction", "Sandino"],
      tags: ["stripes", "horizontal", "blue", "black", "red", "white", "chevron", "star", "X"],
    status: "fictional"
    },
    {
      name: "Patagonia (HOI4 mod Kaiserreich)",
      code: "hoim-pat",
      image: "Patagonia_kaiserreich.webp",
      aliases: ["Patagonia Kaiserreich", "FOP", "Federacion Obrera Regional Argentina"],
      tags: ["red", "black", "sun", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Princely Federation (HOI4 mod Kaiserreich)",
      code: "hoim-prf",
      image: "Princely_Federation_kaiserreich.webp",
      aliases: ["Princely Federation", "Kaiserreich India", "Hyderabad", "Nizam"],
      tags: ["stripes", "horizontal", "green", "yellow", "gold", "red", "white", "square", "crescent", "moon", "star"],
    status: "fictional"
    },
    {
      name: "Transamur (HOI4 mod Kaiserreich)",
      code: "hoim-tra",
      image: "Transamur_Flag_kaiserreich.webp",
      aliases: ["Transamur", "Kolchak", "Kaiserreich Russia", "Far Eastern Republic"],
      tags: ["green", "white", "red", "stripes", "horizontal", "saltire"],
    status: "fictional"
    },
    {
      name: "Union of Great Britain (HOI4 mod Kaiserreich)",
      code: "hoim-uob",
      image: "UOBflag_kaiserreich.webp",
      aliases: ["Union of Britain", "UoB", "Kaiserreich Britain", "British Syndicalists"],
      tags: ["tricolor", "stripes", "horizontal", "red", "white", "green", "wheel", "hammer", "gold", "cog", "yellow", "wheat", "torch"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Marvel & DC Comics", [
    {
      name: "Kingdom of Latveria (Doctor Doom)",
      code: "mvl-lat",
      image: "Flag_of_Latveria.svg",
      aliases: ["Latveria", "Doctor Doom", "Victor von Doom", "Marvel Latveria", "Fantastic Four"],
      tags: ["black", "coat of arms", "cross", "circle", "green", "red"],
    status: "fictional"
    },
    {
      name: "Gotham City (DC Comics)",
      code: "dc-got",
      image: "https://static.wikia.nocookie.net/vexillology/images/f/ff/Flag_of_Gotham_city.jpg/revision/latest?cb=20250311170619",
      aliases: ["Gotham", "Gotham City", "Batman", "Dark Knight", "Bruce Wayne", "DC Comics Gotham"],
      tags: ["blue", "gold", "yellow", "black", "white", "coat of arms", "text", "name", "stars", "leaf"],
    status: "fictional"
    },
    {
      name: "Republic of Kasnia (DC Comics)",
      code: "dc-kas",
      image: "Flag_of_Kasnia_(DC_Comics).svg",
      aliases: ["Kasnia", "Republic of Kasnia", "DC Comics Kasnia", "Balkan Nation", "Justice League"],
      tags: ["red", "coat of arms", "chevron", "balck", "star", "triangle"],
    status: "fictional"
    },
    {
      name: "Hammer Syndicate (DC Comics)",
      code: "dc-has",
      image: "Flag_of_Hammer_Syndicate.svg",
      aliases: ["Hammer Syndicate", "DC Comics Hammer", "Underworld"],
      tags: ["red", "circle", "black", "hammer"],
    status: "fictional"
    },
    {
      name: "Nation of Wakanda (Marvel Comics)",
      code: "mvl-wak",
      image: "https://static.wikia.nocookie.net/vexillology/images/9/9e/Flag_of_Wakanda.png/revision/latest/scale-to-width-down/1000?cb=20250910172543",
      aliases: ["Wakanda", "Kingdom of Wakanda", "Black Panther", "T'Challa", "Vibranium", "Wakanda Forever"],
      tags: ["coat of arms", "black", "stripes", "horizontal", "red", "green", "yellow", "panther", "circle"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Memes & Internet Culture", [
    {
      name: "Kekistan (4chan)",
      code: "fc-kek",
      image: "https://static.wikia.nocookie.net/vexillology/images/5/5b/Flag_of_Kekistan.svg/revision/latest?cb=20221115211020",
      aliases: ["Kekistan", "Republic of Kekistan", "4chan Kek", "Pepe the Frog"],
      tags: ["green", "cross", "black", "white", "K", "clover", "circle"],
    status: "fictional"
    },
    {
      name: "Banana Republic",
      code: "br-br",
      image: "Banana_republic.svg",
      aliases: ["Banana Republic", "Fruit Republic", "Tropical Dictatorship"],
      tags: ["yellow", "stripes", "green", "red", "circle", "vertical", "banana"],
    status: "fictional"
    },
    {
      name: "Listenbourg (Concept)",
      code: "li-li",
      image: "Flag_of_Listenbourg_fictional_country_created_from_Emblem_of_Napoleon_Bonaparte_and_Lutry_flag.svg",
      aliases: ["Listenbourg", "Listenbourg Meme", "Iberian Fictional Country", "Twitter Meme"],
      tags: ["horizontal", "red", "white", "stripes", "eagle", "coat of arms", "gold", "yellow", "leaf", "N"],
    status: "fictional"
    },
    {
      name: "FPRV (Verd’landian Furries)",
      code: "vf-fprv",
      image: "Flag_of_the_FPRV.svg",
      aliases: ["FPRV", "Verdlandian Furries", "Furry Republic", "Paw Pride"],
      tags: ["red", "yellow", "paw"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Nineteen Eighty-Four", [
    {
      name: "Eastasia (Obliteration of the Self)",
      code: "1984-eas",
      image: "Eastasia_1984_flag.svg",
      aliases: ["Eastasia", "Obliteration of the Self", "George Orwell 1984", "1984 Eastasia"],
      tags: ["sun", "red", "yellow", "hammer", "candle", "sickle", "stripes"],
    status: "fictional"
    },
    {
      name: "Eurasia (Neo-Bolshevism)",
      code: "1984-eur",
      image: "Eurasia_1984_flag.svg",
      aliases: ["Eurasia", "Neo-Bolshevism", "George Orwell 1984", "1984 Eurasia"],
      tags: ["star", "hammer", "sickle", "red", "yellow", "leaf"],
    status: "fictional"
    },
    {
      name: "Oceania (Ingsoc - The Conjoined Hands)",
      code: "1984-oce",
      image: "Ingsoc_Oceania_flag_1984.svg",
      aliases: ["Oceania", "Ingsoc", "English Socialism", "Big Brother", "Conjoined Hands", "George Orwell 1984"],
      tags: ["black", "red", "white", "coat of arms", "V", "text", "name"],
    status: "fictional"
    },
    {
      name: "Thought Police (Thinkpol)",
      code: "1984-tp",
      image: "Thinkpol.svg",
      aliases: ["Thought Police", "Thinkpol", "Ministry of Love", "Miniluv", "1984 Thought Police"],
      tags: ["eye", "black", "circle", "shield", "red", "text", "name"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Star Trek", [
    {
      name: "Andorian Empire",
      code: "st-and",
      image: "Andorian_Flag.svg",
      aliases: ["Andoria", "Andorian Empire", "Shran", "Ushaan", "Andorian Guard"],
      tags: ["blue", "cyan", "circle", "crecent", "moon"],
    status: "fictional"
    },
    {
      name: "Klingon Empire",
      code: "st-kli",
      image: "Klingon_Flag.svg",
      aliases: ["Klingon Empire", "Qo'noS", "Kronos", "Klingon Trefoil", "High Council", "tlhIngan"],
      tags: ["red", "black", "stripes", "vertical", "coat of arms", "yellow", "circle", "white"],
    status: "fictional"
    },
    {
      name: "Klingon Imperial Empire Banner",
      code: "st-kli2",
      image: "Klingon_Empire_Flag.svg",
      aliases: ["Klingon Imperial Banner", "Klingon Standard", "Imperial Klingon Emblem"],
      tags: ["coat of arms", "red", "black", "white", "circle"],
    status: "fictional"
    },
    {
      name: "Tellarite Republic",
      code: "st-tel",
      image: "Tellarite_Flag.svg",
      aliases: ["Tellar Prime", "Tellarite Republic", "Tellarites"],
      tags: ["gray", "grey", "text", "square"],
    status: "fictional"
    },
    {
      name: "United Earth (Star Trek)",
      code: "st-ue",
      image: "Flag_of_United_Earth_(Star_Trek_Enterprise).svg",
      aliases: ["United Earth", "Star Trek United Earth", "Starfleet Earth", "NX-01"],
      tags: ["globe", "white", "blue", "yellow", "gold", "wheat", "horizontal"],
    status: "fictional"
    },
    {
      name: "United Federation of Planets",
      code: "st-ufp",
      image: "United_Federation_of_Planets_Flag.svg",
      aliases: ["UFP", "Federation", "United Federation of Planets", "Starfleet", "Star Trek Federation"],
      tags: ["stars", "leaf", "laurel", "blue", "white", "circle", "text", "name"],
    status: "fictional"
    },
    {
      name: "Vulcan (Star Trek)",
      code: "st-vul",
      image: "Vulcan_Flag.svg",
      aliases: ["Vulcan High Command", "Planet Vulcan", "IDIC", "Spock", "Ni'Var"],
      tags: ["circle", "triangle", "brown", "gold", "yellow", "white", "grey", "gray", "arrow", "dot"],
    status: "fictional"
    },
    {
      name: "Epsilon Indi (Star Trek)",
      code: "st-epi",
      image: "Epsilon_Indi_flag.svg",
      aliases: ["Epsilon Indi", "Andor System", "Star Trek Colony"],
      tags: ["rainbow", "chevron", "canton", "white", "star", "yellow"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Star Wars", [
    {
      name: "Alliance to Restore the Republic (Rebel Alliance)",
      code: "sw-ra",
      image: "Flag_of_the_Rebel_Alliance.svg",
      aliases: ["Rebel Alliance", "Starbird", "Rebellion", "Phoenix Starbird", "Luke Skywalker", "Princess Leia"],
      tags: ["coat of arms", "red", "white"],
    status: "fictional"
    },
    {
      name: "First Order",
      code: "sw-fo",
      image: "Banner_of_the_First_Order_(Star_Wars).svg",
      aliases: ["First Order", "Supreme Leader Snoke", "Kylo Ren", "Starkiller Base", "Sequel Trilogy"],
      tags: ["red", "crimson", "coat of arms", "hexagon"],
    status: "fictional"
    },
    {
      name: "Galactic Empire",
      code: "sw-ge",
      image: "Flag_of_the_First_Galactic_Empire.svg",
      aliases: ["Galactic Empire", "Imperial Crest", "Darth Vader", "Emperor Palpatine", "Imperial Cog"],
      tags: ["coat of arms", "black", "white", "red"],
    status: "fictional"
    },
    {
      name: "Galactic Empire (Obi-Wan Kenobi)",
      code: "sw-ge2",
      image: "Banner_of_the_Galactic_Empire_(Obi-Wan_Kenobi).svg",
      aliases: ["Imperial Banner Obi-Wan", "Galactic Empire Banner", "Kenobi Imperial Standard"],
      tags: ["black", "coat of arms", "white"],
    status: "fictional"
    },
    {
      name: "Galactic Republic (Clone Wars)",
      code: "sw-gr",
      image: "Flag_of_the_Galactic_Republic_(Clone_Wars).svg",
      aliases: ["Galactic Republic", "Republic Cog", "Grand Army of the Republic", "Clone Wars Republic"],
      tags: ["circle", "red", "white", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Rebel Alliance (Star Wars Galaxies)",
      code: "sw-swg",
      image: "Flag_of_the_Alliance_to_Restore_the_Republic_(SWG).svg",
      aliases: ["Rebel Alliance SWG", "Galaxies Rebellion", "SWG Rebel Flag"],
      tags: ["red", "crimson", "dots", "coat of arms", "border"],
    status: "fictional"
    },
    {
      name: "Confederacy of Independent Systems",
      code: "sw-cis",
      image: "Flag_of_the_Confederacy_of_Independent_Systems.png",
      aliases: ["CIS", "Separatists", "Count Dooku", "General Grievous", "Separatist Alliance"],
      tags: ["blue", "coat of arms", "white", "circle", "hexagon"],
    status: "fictional"
    },
    {
      name: "Empire Reborn",
      code: "sw-emr",
      image: "Flag_of_the_Empire_Reborn.png",
      aliases: ["Empire Reborn", "Jedi Outcast", "Desann", "Imperial Remnant"],
      tags: ["coat of arms", "red", "black"],
    status: "fictional"
    },
    {
      name: "Final Order",
      code: "sw-fin",
      image: "Flag_of_the_Final_Order.png",
      aliases: ["Final Order", "Sith Fleet", "Exegol", "Sith Eternal Fleet", "Darth Sidious"],
      tags: ["red", "black", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Old Sith Empire",
      code: "sw-ose",
      image: "Flag_of_the_Old_Sith_Empire.png",
      aliases: ["Old Sith Empire", "Korriban", "Naga Sadow", "Tales of the Jedi"],
      tags: ["black", "red", "circle", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Pentastar Alignment",
      code: "sw-pea",
      image: "Flag_of_the_Pentastar_Alignment.png",
      aliases: ["Pentastar Alignment", "Moff Kaine", "Imperial Warlord", "Legends Star Wars"],
      tags: ["star", "blue", "white", "gray", "grey", "circle"],
    status: "fictional"
    },
    {
      name: "Restored Empire",
      code: "sw-ree",
      image: "Flag_of_the_Restored_Empire.png",
      aliases: ["Restored Empire", "Ennix Devian", "Crimson Empire"],
      tags: ["red", "black", "white", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Second Galactic Empire",
      code: "sw-sge",
      image: "Flag_of_the_Second_Galactic_Empire.png",
      aliases: ["Second Galactic Empire", "Fel Empire", "Legacy Star Wars", "Roan Fel"],
      tags: ["coat of arms", "red", "white", "black"],
    status: "fictional"
    },
    {
      name: "New Republic",
      code: "sw-nre",
      image: "Flag_of_the_New_Republic.png",
      aliases: ["New Republic", "Mon Mothma", "Chandrila", "Hosnian Prime", "Star Wars New Republic"],
      tags: ["blue", "gold", "circle", "stars", "yellow", "white", "border", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Sith Empire",
      code: "sw-sit",
      image: "Flag_of_the_Sith_Empire.png",
      aliases: ["Sith Empire", "SWTOR Sith", "Vitiate", "Dromund Kaas", "The Old Republic"],
      tags: ["hexagon", "coat of arms", "red", "black"],
    status: "fictional"
    },
    {
      name: "Sith Eternal",
      code: "sw-sie",
      image: "Flag_of_the_Sith_Eternal.png",
      aliases: ["Sith Eternal", "Cult of Exegol", "Rise of Skywalker", "Sith Cult"],
      tags: ["red", "black", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Trade Federation",
      code: "sw-trf",
      image: "Flag_of_the_Trade_Federation.png",
      aliases: ["Trade Federation", "Nute Gunray", "Neimoidian", "Lucrehulk", "Phantom Menace"],
      tags: ["circle", "T", "F", "blue", "white", "text", "coat of arms"],
    status: "fictional"
    },
    {
      name: "New Republic (The Mandalorian)",
      code: "sw-nrm",
      image: "New_Republic_flag_from_The_Mandalorian_(2023).svg",
      aliases: ["New Republic Mandalorian", "Mando New Republic", "New Republic Roundel"],
      tags: ["stars", "blue", "yellow", "coat of arms", "circle"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("The Expanse", [
    {
      name: "Martian Congressional Republic (MCRN)",
      code: "exp-mcr",
      image: "Flag_of_the_Martian_Congressional_Republic.svg",
      aliases: ["MCR", "MCRN", "Mars", "Martian Congressional Republic", "The Expanse Mars", "Duster"],
      tags: ["globe", "red", "crescent", "blue", "orange", "brown", "yellow", "circle", "stripes", "horizontal", "dots"],
    status: "fictional"
    },
    {
      name: "United Nations (Earth & Luna - The Expanse)",
      code: "exp-un",
      image: "Flag_of_the_United_Nations_(The_Expanse).svg",
      aliases: ["UN Expanse", "United Nations Earth Luna", "The Expanse UN", "Chrisjen Avasarala"],
      tags: ["laurel", "leaf", "wreath", "globe", "blue", "white", "stars", "circle", "text", "name"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("The Fire Rises", [
    {
      name: "Albanian People’s Socialist Republic",
      code: "tfr-apsr",
      image: "Flag_of_the_Albanian_People's_Socialist_Republic_(The_Fire_Rises).svg",
      aliases: ["Albanian PSR", "TFR Albania", "The Fire Rises Albania", "Enverist"],
      tags: ["eagle", "black", "red", "star", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "British National Republic",
      code: "tfr-bnr",
      image: "Flag_of_the_British_National_Republic_(The_Fire_Rises).svg",
      aliases: ["British National Republic", "TFR Britain", "The Fire Rises Britain"],
      tags: ["stripes", "red", "white", "blue", "yellow", "cross", "saltire"],
    status: "fictional"
    },
    {
      name: "Democratic People’s Republic of Germany",
      code: "tfr-dprg",
      image: "Flag_of_the_Democratic_People's_Republic_of_Germany_(The_Fire_Rises).svg",
      aliases: ["DPRG", "TFR Germany", "East Germany Fire Rises", "German DPR"],
      tags: ["tricolor", "stripes", "red", "gold", "yellow", "black", "hammer", "coat of arms", "compass", "laurel", "wreath"],
    status: "fictional"
    },
    {
      name: "Frankish National State",
      code: "tfr-fns",
      image: "Flag_of_the_Frankish_National_State_(The_Fire_Rises).svg",
      aliases: ["Frankish National State", "TFR France", "The Fire Rises Frankish"],
      tags: ["fleur-de-lis", "blue", "white", "red", "gold", "yellow", "stripes", "vertical", "sun"],
    status: "fictional"
    },
    {
      name: "German People’s State",
      code: "tfr-gps",
      image: "Flag_of_the_German_People's_State_(The_Fire_Rises).svg",
      aliases: ["German People's State", "TFR German State", "The Fire Rises Germany"],
      tags: ["stripes", "horizontal", "red", "black", "white", "eagle", "tricolor"],
    status: "fictional"
    },
    {
      name: "Government of National Defense",
      code: "tfr-gnd",
      image: "Flag_of_the_Government_of_National_Defense_(The_Fire_Rises).svg",
      aliases: ["Government of National Defense", "TFR National Defense", "The Fire Rises Junta"],
      tags: ["blue", "white", "red", "dark"],
    status: "fictional"
    },
    {
      name: "Islamic Republic of Iraq",
      code: "tfr-iri",
      image: "Flag_of_the_Islamic_Republic_of_Iraq_(The_Fire_Rises).svg",
      aliases: ["Islamic Republic of Iraq", "TFR Iraq", "The Fire Rises Iraq"],
      tags: ["tricolor", "stripes", "horizontal", "red", "white", "black", "green", "text"],
    status: "fictional"
    },
    {
      name: "People’s Overlordship over China and People’s Overlordship over Asia",
      code: "tfr-poca",
      image: "Flag_of_the_People's_Overlordship_over_China_and_the_People's_Overlordship_over_Asia_(The_Fire_Rises).svg",
      aliases: ["Overlordship China", "TFR China Overlordship", "Pan-Asian Overlordship"],
      tags: ["red", "crimson", "dark", "pink", "stars", "star"],
    status: "fictional"
    },
    {
      name: "People’s Republic of Italy",
      code: "tfr-pri",
      image: "Flag_of_the_People's_Republic_of_Italy_(The_Fire_Rises).svg",
      aliases: ["People's Republic of Italy", "TFR Italy", "Italian Social Republic TFR"],
      tags: ["tricolor", "stripes", "green", "white", "red", "star", "laurel", "wreath", "wheel", "cog", "leaf", "text", "name"],
    status: "fictional"
    },
    {
      name: "Polish Revolutionary Republic",
      code: "tfr-prr",
      image: "Flag_of_the_Polish_Revolutionary_Republic_(The_Fire_Rises).svg",
      aliases: ["Polish Revolutionary Republic", "TFR Poland", "The Fire Rises Poland"],
      tags: ["tricolor", "horizontal", "red", "white", "yellow"],
    status: "fictional"
    },
    {
      name: "Pétainist French State",
      code: "tfr-pfs",
      image: "Flag_of_the_pétainist_French_State_(The_Fire_Rises).svg",
      aliases: ["Petainist French State", "Vichy TFR", "The Fire Rises France", "Philippe Petain"],
      tags: ["tricolor", "stripes", "vertical", "drape", "blue", "white", "red", "E", "F", "coat of arms", "dark"],
    status: "fictional"
    },
    {
      name: "Republic of Thailand",
      code: "tfr-rot",
      image: "Flag_of_the_Republic_of_Thailand_(The_Fire_Rises).svg",
      aliases: ["Republic of Thailand", "TFR Thailand", "The Fire Rises Thailand"],
      tags: ["stripes", "horizontal", "red", "white"],
    status: "fictional"
    },
    {
      name: "Socialist Republic of Austria",
      code: "tfr-sra",
      image: "Flag_of_the_Socialist_Republic_of_Austria_(The_Fire_Rises).svg",
      aliases: ["Socialist Republic of Austria", "TFR Austria", "The Fire Rises Austria"],
      tags: ["stripes", "horizontal", "red", "white", "gold", "yellow", "laurel", "leaf", "wreath", "shield", "star"],
    status: "fictional"
    },
    {
      name: "Technocratic People’s Republic of China",
      code: "tfr-tprc",
      image: "Flag_of_the_technocratic_People's_Republic_of_China_(The_Fire_Rises).svg",
      aliases: ["Technocratic PRC", "TFR Technocratic China", "Chinese Technocracy"],
      tags: ["red", "stars", "star", "white"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("The Lord of the Rings", [
    {
      name: "Isengard (White Hand of Saruman)",
      code: "lotr-ise",
      image: "Flag_of_Isengard.svg",
      aliases: ["Isengard", "White Hand of Saruman", "Saruman the White", "Orthanc", "Uruk-hai"],
      tags: ["white", "black", "hand"],
    status: "fictional"
    },
    {
      name: "Kingdom of Gondor (White Tree)",
      code: "lotr-gon",
      image: "Flag_of_Gondor.svg",
      aliases: ["Gondor", "White Tree of Gondor", "Kingdom of Gondor", "Minas Tirith", "Aragorn", "Return of the King"],
      tags: ["tree", "white", "stars", "black"],
    status: "fictional"
    },
    {
      name: "Kingdom of Rohan (Mark of the Horse)",
      code: "lotr-roh",
      image: "Flag_of_Rohan.svg",
      aliases: ["Rohan", "Mark of the Horse", "Riders of Rohan", "Theoden", "Eomer", "Horse of Rohan"],
      tags: ["horse", "white", "green"],
    status: "fictional"
    },
    {
      name: "Kings of Gondor",
      code: "lotr-gonk",
      image: "Flag_of_the_Kings_of_Gondor.svg",
      aliases: ["Kings of Gondor", "High King of Arnor and Gondor", "Elendil", "Royal Standard of Gondor"],
      tags: ["tree", "white", "stars", "black", "crown"],
    status: "fictional"
    },
    {
      name: "Mordor (Red Eye of Sauron)",
      code: "lotr-mor",
      image: "Flag_of_Mordor.svg",
      aliases: ["Mordor", "Eye of Sauron", "Great Eye", "Dark Tower", "Barad-dur", "Sauron"],
      tags: ["eye", "red", "black"],
    status: "fictional"
    },
    {
      name: "Stewards of Gondor",
      code: "lotr-gons",
      image: "Flag_of_the_Stewards_of_Gondor.svg",
      aliases: ["Stewards of Gondor", "Ruling Stewards", "Denethor", "Boromir", "Steward's Banner"],
      tags: ["white", "black", "text", "stars"],
    status: "fictional"
    },
    {
      name: "Dol Amroth",
      code: "lotr-dola",
      image: "Flag_of_Dol_Amroth.svg",
      aliases: ["Dol Amroth", "Swan Knights of Dol Amroth", "Prince Imrahil", "Belfalas"],
      tags: ["ship", "swan", "blue", "coat of arms", "white", "bird"],
    status: "fictional"
    },
    {
      name: "Minas Morgul",
      code: "lotr-minm",
      image: "Flag_of_Minas_Morgul.svg",
      aliases: ["Minas Morgul", "Tower of Sorcery", "Witch-king of Angmar", "Dead City"],
      tags: ["moon", "yellow", "black", "skull"],
    status: "fictional"
    },
    {
      name: "Morgoth",
      code: "lotr-morg",
      image: "Flag_of_Morgoth.svg",
      aliases: ["Morgoth", "Morgoth Bauglir", "Melkor", "Iron Crown", "Silmarillion"],
      tags: ["black"],
    status: "fictional"
    },
    {
      name: "Umbar",
      code: "lotr-umbar",
      image: "Flag_of_Umbar.svg",
      aliases: ["Umbar", "Corsairs of Umbar", "Black Numenoreans", "Haven of Umbar"],
      tags: ["black", "yellow", "text", "border"],
    status: "fictional"
    },
    {
      name: "Harad",
      code: "lotr-harad",
      image: "Flag_of_Harad.svg",
      aliases: ["Harad", "Haradrim", "Southrons", "Mumakil", "Black Serpent of Harad"],
      tags: ["snake", "black", "red"],
    status: "fictional"
    },
    {
      name: "Quenya",
      code: "lotr-que",
      image: "Quenya_flag.svg",
      aliases: ["Quenya", "High Elven", "Elves Flag", "Tengwar"],
      tags: ["red", "white", "black", "yellow", "stripes", "diagonal", "feather", "text", "star"],
    status: "fictional"
    },
    {
      name: "Minas Tirith",
      code: "lotr-mint",
      image: "Minas_thirith_flag.png",
      aliases: ["Minas Tirith", "Tower of Guard", "White City", "City of Kings"],
      tags: ["white"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("The Witcher", [
    {
      name: "Brugge",
      code: "tw-br",
      image: "Brugge_flag.svg",
      aliases: ["Brugge", "Kingdom of Brugge", "Northern Realms Brugge", "Witcher Brugge"],
      tags: ["cross", "green", "white"],
    status: "fictional"
    },
    {
      name: "Caingorn",
      code: "tw-cg",
      image: "Caingorn_flag.svg",
      aliases: ["Caingorn", "Kingdom of Caingorn", "Hengfors League", "Witcher Caingorn"],
      tags: ["bird", "white", "red", "purple", "wine"],
    status: "fictional"
    },
    {
      name: "Cintra",
      code: "tw-ct",
      image: "Cintra_flag.svg",
      aliases: ["Cintra", "Kingdom of Cintra", "Lion of Cintra", "Queen Calanthe", "Ciri"],
      tags: ["lions", "blue", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "Lyria & Rivia",
      code: "tw-lr",
      image: "Lyria&Rivia_flag.svg",
      aliases: ["Lyria and Rivia", "Queen Meve", "Thronebreaker", "Lyria", "Rivia"],
      tags: ["eagle", "black", "diamond", "red", "yellow"],
    status: "fictional"
    },
    {
      name: "Redania",
      code: "tw-re",
      image: "Redania_flag.svg",
      aliases: ["Redania", "Kingdom of Redania", "King Radovid", "Sigismund Dijkstra", "Redanian Eagle"],
      tags: ["eagle", "crown", "red", "white", "yellow", "gold"],
    status: "fictional"
    },
    {
      name: "Temeria",
      code: "tw-te",
      image: "Temeria_flag.svg",
      aliases: ["Temeria", "Kingdom of Temeria", "King Foltest", "Vernon Roche", "Temerian Lilies"],
      tags: ["black", "fleur-de-lis", "white"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("The Wheel of Time", [
    {
      name: "Almoth",
      code: "wt-alm",
      image: "Flag_of_Almoth.svg",
      aliases: ["Almoth", "Almoth Plain", "Wheel of Time Almoth"],
      tags: ["blue", "black", "stripes", "horizontal", "tree", "green", "brown"],
    status: "fictional"
    },
    {
      name: "Banner of Light",
      code: "wt-bol",
      image: "Banner_of_Light.svg",
      aliases: ["Banner of Light", "Light's Banner", "Forces of the Light", "The Light"],
      tags: ["red", "white", "black", "circle"],
    status: "fictional"
    },
    {
      name: "Con of Dobraine Taborwin",
      code: "wt-cdt",
      image: "Con_of_Dobraine_Taborwin.svg",
      aliases: ["Dobraine Taborwin", "Con of Dobraine", "House Taborwin"],
      tags: ["diamonds", "triangles", "blue", "white"],
    status: "fictional"
    },
    {
      name: "Con of Talmanes Delovinde",
      code: "wt-ctd",
      image: "Con_of_Talmanes_Delovinde.svg",
      aliases: ["Talmanes Delovinde", "Con of Talmanes", "House Delovinde"],
      tags: ["stars", "blue", "yellow"],
    status: "fictional"
    },
    {
      name: "Dragon Banner",
      code: "wt-dra",
      image: "Dragon_Banner.svg",
      aliases: ["Dragon Banner", "Banner of the Dragon", "Lews Therin Telamon", "Rand al'Thor", "Dragon Reborn"],
      tags: ["dragon", "white", "red", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "Altara",
      code: "wt-alt",
      image: "Flag_of_Altara.svg",
      aliases: ["Altara", "Kingdom of Altara", "Ebou Dar", "Queen Tylin"],
      tags: ["red", "blue", "gold", "yellow", "leopards", "checkerboard"],
    status: "fictional"
    },
    {
      name: "Amadicia",
      code: "wt-ama",
      image: "Flag_of_Amadicia.svg",
      aliases: ["Amadicia", "Kingdom of Amadicia", "Amador", "Whitecloaks"],
      tags: ["blue", "yellow", "gray", "grey", "white", "red", "star", "leaf", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Andor",
      code: "wt-and",
      image: "Flag_of_Andor.svg",
      aliases: ["Andor", "Realm of Andor", "Caemlyn", "Queen Morgase", "White Lion of Andor"],
      tags: ["lion", "white", "red", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Arad Doman",
      code: "wt-ado",
      image: "Flag_of_Arad_Doman.svg",
      aliases: ["Arad Doman", "Bandar Eban", "King Alsalam"],
      tags: ["glove", "sword", "silver", "green", "white", "blue", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Arafel",
      code: "wt-ara",
      image: "Flag_of_Arafel.svg",
      aliases: ["Arafel", "Borderlands Arafel", "Shol Arbela", "Paitar Nachiman"],
      tags: ["red", "white", "yellow", "flowers"],
    status: "fictional"
    },
    {
      name: "Cairhien",
      code: "wt-cah",
      image: "Flag_of_Cairhien.svg",
      aliases: ["Cairhien", "Sun Throne", "Rising Sun of Cairhien", "King Galldrian"],
      tags: ["sun", "blue", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "Far Madding",
      code: "wt-fam",
      image: "Flag_of_Far_Madding.svg",
      aliases: ["Far Madding", "Guardian", "City of Far Madding"],
      tags: ["blue", "red", "yellow", "hand", "sword", "circle", "oval"],
    status: "fictional"
    },
    {
      name: "Ghealdan",
      code: "wt-ghe",
      image: "Flag_of_Ghealdan.svg",
      aliases: ["Ghealdan", "Jehannah", "Queen Alliandre"],
      tags: ["stars", "red", "white"],
    status: "fictional"
    },
    {
      name: "House Anshar",
      code: "wt-han",
      image: "Flag_of_House_Anshar.svg",
      aliases: ["House Anshar", "Andor Noble House"],
      tags: ["fox", "yellow", "red", "gold", "animal"],
    status: "fictional"
    },
    {
      name: "House Arawn",
      code: "wt-har",
      image: "Flag_of_House_Arawn.svg",
      aliases: ["House Arawn", "Andor House Arawn"],
      tags: ["gray", "grey", "blue", "silver", "white", "keys"],
    status: "fictional"
    },
    {
      name: "House Baryn",
      code: "wt-hba",
      image: "Flag_of_House_Baryn.svg",
      aliases: ["House Baryn", "Andor House Baryn"],
      tags: ["green", "gray", "grey", "white", "hammer", "wings"],
    status: "fictional"
    },
    {
      name: "House Bashere",
      code: "wt-hbs",
      image: "Flag_of_House_Bashere.svg",
      aliases: ["House Bashere", "Davram Bashere", "Saldaea House"],
      tags: ["blue", "white", "red", "flowers"],
    status: "fictional"
    },
    {
      name: "House Caeren",
      code: "wt-hca",
      image: "Flag_of_House_Caeren.svg",
      aliases: ["House Caeren", "Andor House Caeren"],
      tags: ["black", "white", "red", "scimitar", "sword", "star"],
    status: "fictional"
    },
    {
      name: "House Carand",
      code: "wt-hcr",
      image: "Flag_of_House_Carand.svg",
      aliases: ["House Carand", "Andor House Carand"],
      tags: ["red", "yellow", "arrows"],
    status: "fictional"
    },
    {
      name: "House Coelan",
      code: "wt-hco",
      image: "Flag_of_House_Coelan.svg",
      aliases: ["House Coelan", "Andor House Coelan"],
      tags: ["blue", "white", "red", "green", "stripes", "horizontal", "flowers"],
    status: "fictional"
    },
    {
      name: "House Mantear",
      code: "wt-hma",
      image: "Flag_of_House_Mantear.svg",
      aliases: ["House Mantear", "Tigraine Mantear", "Andor Royal House"],
      tags: ["quartered", "blue", "red", "anvil", "gray", "grey", "white"],
    status: "fictional"
    },
    {
      name: "House Marne",
      code: "wt-hmr",
      image: "Flag_of_House_Marne.svg",
      aliases: ["House Marne", "Andor House Marne"],
      tags: ["blue", "white", "moons"],
    status: "fictional"
    },
    {
      name: "House Mitsobar",
      code: "wt-hmi",
      image: "Flag_of_House_Mitsobar.svg",
      aliases: ["House Mitsobar", "Altara Royal House", "Tylin Mitsobar"],
      tags: ["white", "green", "scimitar", "sword", "anchor"],
    status: "fictional"
    },
    {
      name: "House Norwelyn",
      code: "wt-hno",
      image: "Flag_of_House_Norwelyn.svg",
      aliases: ["House Norwelyn", "Andor House Norwelyn"],
      tags: ["blue", "green", "stripes", "vertical", "fish", "white", "gray", "grey"],
    status: "fictional"
    },
    {
      name: "House Pendar",
      code: "wt-hpe",
      image: "Flag_of_House_Pendar.svg",
      aliases: ["House Pendar", "Andor House Pendar"],
      tags: ["red", "white", "yellow", "stars", "stripes", "vertical"],
    status: "fictional"
    },
    {
      name: "House Saighan",
      code: "wt-hsa",
      image: "Flag_of_House_Saighan.svg",
      aliases: ["House Saighan", "Cairhien House Saighan", "Toram Saighan"],
      tags: ["yellow", "red", "white", "diamond", "checkerboard"],
    status: "fictional"
    },
    {
      name: "House Sarand",
      code: "wt-hsr",
      image: "Flag_of_House_Sarand.svg",
      aliases: ["House Sarand", "Andor House Sarand", "Arymilla Sarand"],
      tags: ["red", "gold", "yellow", "hog"],
    status: "fictional"
    },
    {
      name: "House Trakand",
      code: "wt-htr",
      image: "Flag_of_House_Trakand.svg",
      aliases: ["House Trakand", "Morgase Trakand", "Elayne Trakand"],
      tags: ["jar", "gray", "grey", "blue"],
    status: "fictional"
    },
    {
      name: "Illian",
      code: "wt-ill",
      image: "Flag_of_Illian.svg",
      aliases: ["Illian", "City of Illian", "King Mattin Stepaneos", "Golden Bees of Illian"],
      tags: ["green", "gold", "yellow", "bees"],
    status: "fictional"
    },
    {
      name: "Kandor",
      code: "wt-kan",
      image: "Flag_of_Kandor.svg",
      aliases: ["Kandor", "Borderlands Kandor", "Chachin", "Queen Ethenielle"],
      tags: ["horse", "red", "green"],
    status: "fictional"
    },
    {
      name: "Malkier",
      code: "wt-mal",
      image: "Flag_of_Malkier.svg",
      aliases: ["Malkier", "Lost Malkier", "Lan Mandragoran", "Golden Crane of Malkier"],
      tags: ["white", "bird", "yellow"],
    status: "fictional"
    },
    {
      name: "Mayene",
      code: "wt-may",
      image: "Flag_of_Mayene.svg",
      aliases: ["Mayene", "City-State of Mayene", "First of Mayene", "Berelain", "Golden Hawk of Mayene"],
      tags: ["bird", "blue", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "Murandy",
      code: "wt-mur",
      image: "Flag_of_Murandy.svg",
      aliases: ["Murandy", "Lugard", "King Roedran"],
      tags: ["stripes", "vertical", "red", "blue", "bull", "silver", "white"],
    status: "fictional"
    },
    {
      name: "Saldaea",
      code: "wt-sal",
      image: "Flag_of_Saldaea.svg",
      aliases: ["Saldaea", "Borderlands Saldaea", "Maradon", "Queen Tenobia"],
      tags: ["silver", "blue", "gray", "grey", "fish"],
    status: "fictional"
    },
    {
      name: "Seanchan",
      code: "wt-sea",
      image: "Flag_of_Seanchan.svg",
      aliases: ["Seanchan", "Seanchan Empire", "Crystal Throne", "Empress Fortuona", "Tuon"],
      tags: ["coat of arms", "border", "white", "bird", "gold", "yellow", "blue"],
    status: "fictional"
    },
    {
      name: "Shienar",
      code: "wt-shi",
      image: "Flag_of_Shienar.svg",
      aliases: ["Shienar", "Borderlands Shienar", "Fal Moran", "Lord Agelmar", "Black Hawk of Shienar"],
      tags: ["bird", "black", "stripes", "blue", "white", "horizontal"],
    status: "fictional"
    },
    {
      name: "Tar Valon",
      code: "wt-tav",
      image: "Flag_of_Tar_Valon.svg",
      aliases: ["Tar Valon", "Aes Sedai", "White Tower", "Flame of Tar Valon", "Amyrlin Seat"],
      tags: ["rainbow", "spiral", "drop", "white"],
    status: "fictional"
    },
    {
      name: "Tarabon",
      code: "wt-tar",
      image: "Flag_of_Tarabon.svg",
      aliases: ["Tarabon", "Tanchico", "Panarch", "King of Tarabon"],
      tags: ["tree", "gold", "yellow", "red", "white", "stripes", "vertical"],
    status: "fictional"
    },
    {
      name: "Tear",
      code: "wt-tea",
      image: "Flag_of_Tear.svg",
      aliases: ["Tear", "City of Tear", "Stone of Tear", "High Lords of Tear", "Crescent Moons of Tear"],
      tags: ["crescent", "moon", "red", "gold", "yellow", "diagonal"],
    status: "fictional"
    },
    {
      name: "Band of the Red Hand",
      code: "wt-brh",
      image: "Flag_of_the_Band_of_the_Red_Hand.svg",
      aliases: ["Band of the Red Hand", "Mat Cauthon", "Shen an Calhar"],
      tags: ["red", "white", "border", "hand", "text"],
    status: "fictional"
    },
    {
      name: "Children of the Light",
      code: "wt-col",
      image: "Flag_of_the_Children_of_the_Light.svg",
      aliases: ["Children of the Light", "Whitecloaks", "Fortress of the Light", "Pedron Niall"],
      tags: ["sun", "border", "white", "gold", "yellow"],
    status: "fictional"
    },
    {
      name: "Panarch of Tarabon",
      code: "wt-pot",
      image: "Flag_of_the_Panarch_of_Tarabon.svg",
      aliases: ["Panarch of Tarabon", "Panarch's Palace", "Amathera"],
      tags: ["tree", "gold", "yellow", "red", "white", "stripes", "vertical", "cane", "green"],
    status: "fictional"
    },
    {
      name: "The Younglings",
      code: "wt-you",
      image: "Flag_of_the_Younglings.svg",
      aliases: ["The Younglings", "Gawyn Trakand", "White Tower Younglings"],
      tags: ["white", "green", "hog"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Agelmar Jagad",
      code: "wt-paj",
      image: "Personal_flag_of_Agelmar_Jagad.svg",
      aliases: ["Agelmar Jagad", "Lord Agelmar", "Shienar Lord"],
      tags: ["white", "blue", "quartered", "red", "fox"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Elayne Trakand",
      code: "wt-pet",
      image: "Personal_flag_of_Elayne_Trakand.svg",
      aliases: ["Elayne Trakand", "Queen Elayne", "Golden Lioness"],
      tags: ["lily", "flower", "blue", "yellow"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Gawyn Trakand",
      code: "wt-pgt",
      image: "Personal_flag_of_Gawyn_Trakand.svg",
      aliases: ["Gawyn Trakand", "First Prince of the Sword"],
      tags: ["red", "white", "hog"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Guaire Amalasan",
      code: "wt-pga",
      image: "Personal_flag_of_Guaire_Amalasan.svg",
      aliases: ["Guaire Amalasan", "False Dragon Guaire"],
      tags: ["blue", "black", "white", "circle"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Ingtar Shinowa",
      code: "wt-pis",
      image: "Personal_flag_of_Ingtar_Shinowa.svg",
      aliases: ["Ingtar Shinowa", "Lord Ingtar", "House Shinowa"],
      tags: ["yellow", "black", "owl"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Logain Ablar",
      code: "wt-pla",
      image: "Personal_flag_of_Logain_Ablar.svg",
      aliases: ["Logain Ablar", "False Dragon Logain", "Asha'man Logain"],
      tags: ["blue", "yellow", "crowns"],
    status: "fictional"
    },
    {
      name: "Personal Flag of Mattin Stepaneos den Balgar",
      code: "wt-pms",
      image: "Personal_flag_of_Mattin_Stepaneos_den_Balgar.svg",
      aliases: ["Mattin Stepaneos", "King of Illian Banner"],
      tags: ["black", "white", "cheetah"],
    status: "fictional"
    },
    {
      name: "Red Wolfhead Banner",
      code: "wt-rwb",
      image: "Red_Wolfhead_Banner.svg",
      aliases: ["Red Wolfhead Banner", "Perrin Aybara", "Lord of the Two Rivers", "Wolf King"],
      tags: ["wolf", "red", "white", "border"],
    status: "fictional"
    },
    {
      name: "Traitor’s Banner",
      code: "wt-trb",
      image: "Traitor's_Banner.svg",
      aliases: ["Traitor's Banner", "Traitor Banner Wheel of Time"],
      tags: ["black", "yellow", "chevron"],
    status: "fictional"
    },
    {
      name: "Wot Tweewater",
      code: "wt-wtw",
      image: "Wot_tweewater_vlag.gif",
      aliases: ["Two Rivers", "Emond's Field", "Tweewater", "Red Eagle of Manetheren"],
      tags: ["eagle", "red", "white"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Tin Tin", [
    {
      name: "Emirate of Khemed",
      code: "tt-khm",
      image: "Flag_of_Khemed.svg",
      aliases: ["Khemed", "Emirate of Khemed", "Emir Mohammed Ben Kalish Ezab", "Bab El Ehr", "Tintin Khemed"],
      tags: ["crescent", "star", "red", "green", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Republic of Borduria",
      code: "tt-bor",
      image: "Flag_of_Borduria.svg",
      aliases: ["Borduria", "Kurvi-Tasch", "Plekszy-Gladz", "Tintin Borduria"],
      tags: ["circle", "red", "black", "triangle"],
    status: "fictional"
    },
    {
      name: "Republic of San Theodoros",
      code: "tt-st",
      image: "Flag_of_San_Theodoros.svg",
      aliases: ["San Theodoros", "General Alcazar", "General Tapioca", "Tintin San Theodoros"],
      tags: ["stripes", "horizontal", "green", "black", "red", "circle"],
    status: "fictional"
    },
    {
      name: "Republic of Nuevo Rico (The Broken Ear)",
      code: "tt-nr",
      image: "Flag_of_Nuevo_Rico.svg",
      aliases: ["Nuevo Rico", "General Dos Santos", "The Broken Ear", "Tintin Nuevo Rico"],
      tags: ["black", "red", "stars"],
    status: "fictional"
    },
    {
      name: "Sondonesia",
      code: "tt-sno",
      image: "https://static.wikia.nocookie.net/vexillology/images/d/dd/Flag_of_Sondonesia.webp/revision/latest?cb=20260323164642",
      aliases: ["Sondonesia", "Flight 714 to Sydney", "Rastapopoulos", "Tintin Sondonesia"],
      tags: ["white", "green", "stripes", "horizontal", "chevron"],
    status: "fictional"
    },
    {
      name: "Poldavia",
      code: "tt-pd",
      image: "https://static.wikia.nocookie.net/vexillology/images/b/b9/Poldavia_Flag_Proposal_by_C1932.webp/revision/latest/scale-to-width-down/1000?cb=20260324181624",
      aliases: ["Poldavia", "Blue Lotus Poldavia", "Fictional Country", "Tintin Poldavia"],
      tags: ["blue", "yellow", "white", "red", "chevron", "coat of arms", "crown", "stripes", "horizontal", "sun"],
    status: "fictional"
    },
    {
      name: "Syldavia",
      code: "tt-syl",
      image: "https://static.wikia.nocookie.net/vexillology/images/0/09/Flag_of_Syldavia.webp/revision/latest?cb=20260323164727",
      aliases: ["Syldavia", "Kingdom of the Black Pelican", "King Muskar XII", "Ottokar's Sceptre", "Tintin Syldavia"],
      tags: ["bird", "black", "yellow"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Total War", [
    {
      name: "Bandera Punjab",
      code: "tw-bpj",
      image: "Bandera_punyab.png",
      aliases: ["Punjab Total War", "Sikh Empire", "Bandera Punjab Total War", "Empire Total War Punjab"],
      tags: ["coat of arms", "green", "red", "diagonal", "yellow"],
    status: "fictional"
    },
    {
      name: "Austrian Empire",
      code: "tw-aem",
      image: "Flag_of_Austria_(Empire_Total_War).svg",
      aliases: ["Austrian Empire Total War", "Habsburg Empire", "Empire Total War Austria"],
      tags: ["black", "eagle", "yellow", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Bavaria (Empire Total War)",
      code: "tw-bav",
      image: "Flag_of_Bavaria_(Empire_Total_War).svg",
      aliases: ["Bavaria Total War", "Electorate of Bavaria", "Empire Total War Bavaria"],
      tags: ["blue", "white", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Courland (Empire Total War)",
      code: "tw-cou",
      image: "Flag_of_Courland_(Empire_Total_War).svg",
      aliases: ["Courland Total War", "Duchy of Courland", "Courland and Semigallia"],
      tags: ["quartered", "blue", "white", "red", "yellow", "lion", "animal"],
    status: "fictional"
    },
    {
      name: "Dagestan (Empire Total War)",
      code: "tw-dag",
      image: "Flag_of_Dagestan_(Empire_Total_War).svg",
      aliases: ["Dagestan Total War", "Shamkhalate of Tarki", "Empire Total War Dagestan"],
      tags: ["crescent", "stars", "green", "yellow"],
    status: "fictional"
    },
    {
      name: "Khanat of Crimea (Empire Total War)",
      code: "tw-koc",
      image: "Flag_of_Khanat_of_Crimea_(Empire_Total_War).svg",
      aliases: ["Crimean Khanate Total War", "Khanat of Crimea", "Giray Dynasty"],
      tags: ["red", "white", "moon", "crescent", "circle", "blue", "T", "yellow"],
    status: "fictional"
    },
    {
      name: "Poland-Lithuania (Empire Total War)",
      code: "tw-pol",
      image: "Flag_of_Poland-Lithuania_(Empire_Total_War).svg",
      aliases: ["Polish-Lithuanian Commonwealth Total War", "Poland-Lithuania", "Empire Total War Poland"],
      tags: ["eagle", "white", "red", "coat of arms", "crown", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Russia (Empire Total War)",
      code: "tw-rus",
      image: "Flag_of_Russia_(Empire_Total_War).svg",
      aliases: ["Russian Tsardom Total War", "Empire Total War Russia", "Imperial Russia"],
      tags: ["tricolor", "stripes", "horizontal", "red", "blue", "white", "eagle", "yellow"],
    status: "fictional"
    },
    {
      name: "Russia (Napoleon Empire, Total War Faction)",
      code: "tw-run",
      image: "Flag_of_Russia_(Napoleon_Empire_-_Total_War_Faction).svg",
      aliases: ["Napoleon Total War Russia", "Imperial Russia Napoleon", "Russian Empire Total War"],
      tags: ["eagle", "coat of arms", "black", "white", "yellow", "stripes", "horizontal", "tricolor"],
    status: "fictional"
    },
    {
      name: "Sweden (Empire Total War)",
      code: "tw-swe",
      image: "Flag_of_Sweden_(Empire_Total_War).svg",
      aliases: ["Swedish Empire Total War", "Empire Total War Sweden", "Carolean Sweden"],
      tags: ["cross", "blue", "yellow", "canton"],
    status: "fictional"
    },
    {
      name: "Berber Coast (Empire Total War)",
      code: "tw-ber",
      image: "Flag_of_the_Berber_Coast_(Empire_Total_War).svg",
      aliases: ["Barbary Corsairs Total War", "Berber Coast", "Barbary States Total War"],
      tags: ["crescent", "moon", "stars", "black", "yellow", "sword"],
    status: "fictional"
    },
    {
      name: "Maratha Confederacy (Empire Total War)",
      code: "tw-mar",
      image: "Flag_of_the_Maratha_Confederacy_(Empire_Total_War).svg",
      aliases: ["Maratha Empire Total War", "Maratha Confederacy", "Bhagwa Dhwaj"],
      tags: ["yellow", "orange", "ashoka chakra", "circle", "sun"],
    status: "fictional"
    },
    {
      name: "Mughal Empire (Empire Total War)",
      code: "tw-mug",
      image: "Flag_of_the_Mughal_Empire_(Empire_Total_War).svg",
      aliases: ["Mughal Empire Total War", "Empire Total War Mughals", "Alam Ensign"],
      tags: ["green", "yellow", "crescent", "moon", "peacock"],
    status: "fictional"
    },
    {
      name: "Flag of the Otomans (Empire Total War)",
      code: "tw-ott",
      image: "Flag_of_the_Otomans_(Empire_Total_War).svg",
      aliases: ["Ottoman Empire Total War", "Empire Total War Ottomans", "Sublime Porte"],
      tags: ["red", "white", "moons", "crescent", "star"],
    status: "fictional"
    },
    {
      name: "Republic of Venice (Empire Total War)",
      code: "tw-ven",
      image: "Flag_of_the_Republic_of_Venice_(Empire_Total_War).svg",
      aliases: ["Venice Total War", "Republic of Venice", "Serenissima", "Lion of Saint Mark"],
      tags: ["lion", "wings", "red", "gold", "yellow", "border", "book", "blue"],
    status: "fictional"
    },
    {
      name: "United Provinces (Empire Total War)",
      code: "tw-upr",
      image: "Flag_of_the_United_Provinces_(Empire_Total_War).svg",
      aliases: ["Dutch Republic Total War", "United Provinces", "States-General", "Prince's Flag"],
      tags: ["tricolor", "stripes", "horizontal", "red", "blue", "white"],
    status: "fictional"
    },
    {
      name: "Württemberg (Empire Total War)",
      code: "tw-wur",
      image: "Flag_of_Württemberg_(Empire_Total_War).svg",
      aliases: ["Duchy of Wurttemberg Total War", "Wurttemberg", "Empire Total War Wurttemberg"],
      tags: ["stripes", "horizontal", "red", "black", "coat of arms"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("TV Shows Misc.", [
    {
      name: "Petoria (Family Guy)",
      code: "fg-pet",
      image: "https://static.wikia.nocookie.net/vexillology/images/1/1d/Flag_of_Petoria.svg/revision/latest/scale-to-width-down/1000?cb=20250628220202",
      aliases: ["Petoria", "Peter Griffin Country", "Family Guy Petoria", "E. Peterbus Unum"],
      tags: ["white", "pink", "brown", "text", "name"],
    status: "fictional"
    },
    {
      name: "South Park Town Flag",
      code: "sp-sp",
      image: "https://static.wikia.nocookie.net/vexillology/images/b/bf/Flag_of_South_Park.jpg/revision/latest/scale-to-width-down/1000?cb=20241025210805",
      aliases: ["South Park", "South Park Flag", "South Park Town", "South Park White Power Parody"],
      tags: ["yellow", "white", "red", "black", "text", "name", "hangman", "people"],
    status: "fictional"
    },
    {
      name: "Bikini Bottom (Spongebob)",
      code: "sb-bb",
      image: "https://static.wikia.nocookie.net/vexillology/images/e/e1/Flag_of_Bikini_bottom.png/revision/latest/scale-to-width-down/1000?cb=20241025221328",
      aliases: ["Bikini Bottom", "SpongeBob SquarePants", "Bikini Bottom Flag", "Bikini Atoll Cartoon"],
      tags: ["white", "pink", "blue", "shell", "anchor"],
    status: "fictional"
    },
    {
      name: "Cocoricó Flag (Cocoricó, TV Cultura)",
      code: "cr-cf",
      image: "https://static.wikia.nocookie.net/vexillology/images/5/58/Bandeira_do_Paiol_do_Cocoric%C3%B3.jpg/revision/latest/scale-to-width-down/1000?cb=20241015164051",
      aliases: ["Cocorico", "Paiol do Cocorico", "TV Cultura Cocorico", "Julio Cocorico"],
      tags: ["prints", "hand", "paw", "hoof", "world", "globe", "sun", "green", "yellow", "orange"],
    status: "fictional"
    },
    {
      name: "Rá Tim Bum Castle (Castelo Rá Tim Bum, TV Cultura)",
      code: "rt-rc",
      image: "https://static.wikia.nocookie.net/vexillology/images/1/1b/Bandeira_do_Castelo_R%C3%A1_Tim_Bum.png/revision/latest/scale-to-width-down/1000?cb=20241021065623",
      aliases: ["Castelo Ra Tim Bum", "Ra Tim Bum Castle", "TV Cultura Castelo", "Nino Ra Tim Bum"],
      tags: ["castle", "coat of arms", "blue", "yellow", "red", "sun", "text", "name"],
    status: "fictional"
    },
    {
      name: "Pentagram City (Hazbin Hotel)",
      code: "hh-pc",
      image: "https://static.wikia.nocookie.net/vexillology/images/9/91/Hazbin_Hotel_Hell_flag_Starwa7.jpg/revision/latest/scale-to-width-down/1000?cb=20251113110015",
      aliases: ["Pentagram City", "Hazbin Hotel", "Pride Ring Hell", "Charlie Morningstar", "Hell Flag"],
      tags: ["red", "white", "black", "stripes", "vertical", "circle", "star", "pentagram"],
    status: "fictional"
    },
    {
      name: "PocoyoWorld (Pocoyo, Concept)",
      code: "py-pw",
      image: "https://static.wikia.nocookie.net/vexillology/images/b/b6/Flag_of_PocoyoWorld_by_milko3770.png/revision/latest/scale-to-width-down/1000?cb=20250211163501",
      aliases: ["PocoyoWorld", "Pocoyo Flag", "Pocoyo Planet"],
      tags: ["blue", "white", "red", "brown", "tree", "circle", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Flag of Equestria (My Little Pony)",
      code: "mlp-equ",
      image: "https://static.wikia.nocookie.net/vexillology/images/9/97/Flag_of_Equestria.svg/revision/latest?cb=20250726120243",
      aliases: ["Equestria", "My Little Pony", "MLP", "Princess Celestia", "Princess Luna", "Friendship is Magic"],
      tags: ["unicorn", "sun", "moon", "stars", "blue", "white", "purple", "yellow", "chevron", "border"],
    status: "fictional"
    },
    {
      name: "Flag of Achu (Miraculous: Tales of Ladybug & Cat Noir)",
      code: "mr-ac",
      image: "Flag_of_Achu_(Miraculous).svg",
      aliases: ["Kingdom of Achu", "Achu Miraculous", "Prince Ali Achu", "Miraculous Ladybug Achu"],
      tags: ["green", "yellow", "white", "red", "star", "chevron", "triangle", "circle"],
    status: "fictional"
    },
    {
      name: "Tri-State Area (Phineas and Ferb)",
      code: "pp-tsa",
      image: "Flag_of_Tri-State_Area.svg",
      aliases: ["Tri-State Area", "Phineas and Ferb", "Doofenshmirtz", "Tri State Flag"],
      tags: ["orange", "red", "purple", "stripes", "horizontal", "triangle", "text", "name", "T"],
    status: "fictional"
    },
    {
      name: "Flag of Earth (Duck Dodgers in the 24½th Century)",
      code: "dd-foe",
      image: "Flag_of_Earth_(Duck_Dodgers_in_the_24½th_Century).svg",
      aliases: ["Duck Dodgers Earth", "Earth Duck Dodgers", "Looney Tunes Earth", "24th and a Half Century"],
      tags: ["yellow", "red", "blue", "world", "globe"],
    status: "fictional"
    },
    {
      name: "Little Homeworld’s Flag of Earth (Steven Universe Future)",
      code: "su-lhw",
      image: "Steven_Universe_Little_Homeworld_Flag.svg",
      aliases: ["Little Homeworld", "Steven Universe Earth Flag", "Gems Little Homeworld", "Crystal Gems"],
      tags: ["blue", "white", "cyan", "yellow", "orange", "circle", "dot", "hexagon"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("Videogames Misc.", [
    {
      name: "Fall Guys Flag",
      code: "fg-fg",
      image: "https://static.wikia.nocookie.net/vexillology/images/4/42/Fall_guys_flag.jpg/revision/latest/scale-to-width-down/1000?cb=20241008191930",
      aliases: ["Fall Guys", "Fall Guys Ultimate Knockout", "Blunderdome", "Crown Flag"],
      tags: ["crown", "pink", "red", "yellow", "border", "white"],
    status: "fictional"
    },
    {
      name: "Green Hill Zone (Sonic The Hedgehog)",
      code: "sh-gh",
      image: "https://static.wikia.nocookie.net/vexillology/images/0/09/Flag_of_Green_Hill_Zone_by_Sonic_Fanon.gif/revision/latest?cb=20250316011018",
      aliases: ["Green Hill Zone", "Sonic the Hedgehog", "South Island", "Sega Sonic"],
      tags: ["checkerboard", "orange", "brown", "green", "blue"],
    status: "fictional"
    },
    {
      name: "Empire City (Sonic: Unleashed)",
      code: "sh-ec",
      image: "Flag_of_Empire_City_(Sonic_the_Hedgehog).svg",
      aliases: ["Empire City", "Sonic Unleashed", "Empire City Flag", "Sega Sonic Unleashed"],
      tags: ["stripes", "horizontal", "stars", "blue", "white", "red"],
    status: "fictional"
    },
    {
      name: "Knights of Favonius (Genshin Impact)",
      code: "gi-kf",
      image: "https://static.wikia.nocookie.net/vexillology/images/c/cb/Knights_of_Favonius_Flag.png/revision/latest/scale-to-width-down/1000?cb=20251222071432",
      aliases: ["Knights of Favonius", "Mondstadt", "Genshin Impact Favonius", "Jean Gunnhildr", "Klee"],
      tags: ["chevron", "red", "crimson", "yellow", "coat of arms", "shield", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Mushroom Kingdom (Super Mario)",
      code: "sm-mk",
      image: "https://static.wikia.nocookie.net/vexillology/images/6/63/Flag_of_Mushroom_Kingdom.png/revision/latest/scale-to-width-down/1000?cb=20250316012448",
      aliases: ["Mushroom Kingdom", "Super Mario", "Princess Peach", "Toadstool Kingdom", "Nintendo"],
      tags: ["coat of arms", "white", "red", "stripes", "horizontal", "mushroom", "stars"],
    status: "fictional"
    },
    {
      name: "Glorious Arstotzka (Papers, Please)",
      code: "pp-ars",
      image: "Flag_arstotzka.png",
      aliases: ["Arstotzka", "Glorious Arstotzka", "Papers Please", "Glory to Arstotzka", "Lucas Pope"],
      tags: ["black", "red", "green", "eagle", "shield", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Kingdom of Hyrule (Royal Crest / Triforce, Legend of Zelda)",
      code: "tloz-hyr",
      image: "Flag_of_Hyrule_(The_Wind_Waker).svg",
      aliases: ["Hyrule", "Royal Crest Hyrule", "Triforce", "Legend of Zelda", "Link", "Princess Zelda"],
      tags: ["red", "white", "yellow", "triangle", "cross", "circle"],
    status: "fictional"
    },
    {
      name: "Adal (Call of Duty: Modern Warfare II)",
      code: "cod-ad",
      image: "Flag_of_Adal_(Call_of_Duty).svg",
      aliases: ["Republic of Adal", "Adal COD", "Al Mazrah", "Modern Warfare II Adal"],
      tags: ["tricolor", "stripes", "horizontal", "green", "white", "orange", "coat of arms", "star"],
    status: "fictional"
    },
    {
      name: "Adjikistan (SOCOM U.S. Navy SEALs: Fireteam Bravo 2)",
      code: "sns-adj",
      image: "Flag_of_Adjikistan_(SOCOM_U.S._Navy_SEALs).svg",
      aliases: ["Adjikistan", "SOCOM Adjikistan", "Fireteam Bravo 2", "Navy SEALs Game"],
      tags: ["saltire", "red", "green", "black", "yellow", "star"],
    status: "fictional"
    },
    {
      name: "Minoa (NationStates Web Game)",
      code: "ns-mi",
      image: "Flag_of_Minoa.svg",
      aliases: ["Minoa", "NationStates Minoa", "Minoa NationStates", "Online NationStates"],
      tags: ["blue", "yellow", "sun"],
    status: "fictional"
    },
    {
      name: "Numbani (Overwatch)",
      code: "ow-nu",
      image: "Flag_of_Numbani.svg",
      aliases: ["Numbani", "City of Harmony", "Overwatch Numbani", "Doomfist", "Orisa"],
      tags: ["green", "red", "yellow", "diamond", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Ecopoint Antarctica (Overwatch)",
      code: "ow-ea",
      image: "Ecopoint_Antarctica_flag.svg",
      aliases: ["Ecopoint Antarctica", "Mei Overwatch", "Overwatch Ecopoint", "Antarctica Station"],
      tags: ["logo", "black", "white", "green"],
    status: "fictional"
    },
    {
      name: "Lunar OPS (Overwatch)",
      code: "ow-lo",
      image: "Lunar_OPS_(Overwatch),_flag.png",
      aliases: ["Lunar Colony", "Horizon Lunar Colony", "Overwatch Lunar OPS", "Winston", "Hammond"],
      tags: ["gray", "grey", "circle", "planet", "white", "blue"],
    status: "fictional"
    },
    {
      name: "Overwatch Flag",
      code: "ow-of",
      image: "Overwatch_flag.png",
      aliases: ["Overwatch Logo", "Overwatch Insignia", "Strike Team Overwatch", "Jack Morrison"],
      tags: ["circle", "orange", "blue", "white", "logo"],
    status: "fictional"
    },
    {
      name: "Panau (Just Cause 2)",
      code: "jc-pa",
      image: "Flag_of_Panau.svg",
      aliases: ["Panau", "Baby Panay", "Just Cause 2 Panau", "Rico Rodriguez"],
      tags: ["red", "white", "green", "stripes", "triangle", "chevron", "horizontal", "star"],
    status: "fictional"
    },
    {
      name: "Federation of the Americas (Call of Duty: Ghosts)",
      code: "cod-fa",
      image: "Flag_of_the_Federation_of_the_Americas.svg",
      aliases: ["Federation of the Americas", "COD Ghosts Federation", "South American Federation", "Call of Duty Federation"],
      tags: ["red", "crimson", "black", "stripes", "horizontal", "stars", "circle"],
    status: "fictional"
    },
    {
      name: "Drapeau Medici (Just Cause 3)",
      code: "jc-dm",
      image: "Drapeau_Medici.svg",
      aliases: ["Medici", "Drapeau Medici", "General Di Ravello", "Just Cause 3 Medici"],
      tags: ["tricolor", "stripes", "horizontal", "yellow", "white", "red", "stars", "green"],
    status: "fictional"
    },
    {
      name: "Morden Army Ensign (Metal Slug)",
      code: "ms-ma",
      image: "Morden_army_ensign.svg",
      aliases: ["Morden Army", "General Morden", "Rebel Army Metal Slug", "Metal Slug"],
      tags: ["X", "white", "black", "red", "crimson", "circle"],
    status: "fictional"
    },
    {
      name: "Davenport Homestead (Assassin’s Creed 3)",
      code: "ac-dh",
      image: "Davenport_Homestead_Flag.svg",
      aliases: ["Davenport Homestead", "Connor Kenway", "Achilles Davenport", "Assassin's Creed 3"],
      tags: ["stars", "circle", "blue", "white", "green", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Columbia (BioShock Infinite)",
      code: "bs-co",
      image: "Flag_of_Columbia_(BioShock_Infinite).svg",
      aliases: ["Columbia", "BioShock Infinite Columbia", "Father Comstock", "Floating City"],
      tags: ["stripes", "horizontal", "star", "shield", "red", "blue", "white"],
    status: "fictional"
    },
    {
      name: "Naval Jack of the Confederate States (StarCraft)",
      code: "sc-njcs",
      image: "Confederate_Navy_Jack_(light_blue).svg",
      aliases: ["Confederacy StarCraft", "Terran Confederacy", "Naval Jack StarCraft", "Tarsonis"],
      tags: ["saltire", "red", "white", "blue", "stars"],
    status: "fictional"
    },
    {
      name: "Russian Ultranationalist Flag (Call of Duty)",
      code: "cod-ruf",
      image: "Russian_ultranationalist_flag_(CoD).png",
      aliases: ["Russian Ultranationalists", "Imran Zakhaev", "Vladimir Makarov", "COD Ultranationalist"],
      tags: ["red", "black", "star", "hammer", "sickle"],
    status: "fictional"
    },
    {
      name: "Battlefield Flag",
      code: "bat-ba",
      image: "DE_battlefield_flag.png",
      aliases: ["Battlefield", "Battlefield Game Flag", "Capture the Flag Battlefield", "DICE Battlefield"],
      tags: ["white", "red", "black", "coat of arms", "cross", "tricolor", "stripes", "horizontal"],
    status: "fictional"
    },
    {
      name: "Levantine Assassins (Assassin’s Creed)",
      code: "ac-la",
      image: "Levantine_Assassins_Flag.svg",
      aliases: ["Levantine Assassins", "Altair Ibn-La'Ahad", "Masyaf", "Assassin Brotherhood"],
      tags: ["white", "black", "yellow", "stripes", "vertical", "horizontal", "coat of arms"],
    status: "fictional"
    },
    {
      name: "Edward Kenway Initial Flag (Assassin’s Creed)",
      code: "ac-ek",
      image: "Edward_Kenway_Initial_Flag.svg",
      aliases: ["Edward Kenway Initial", "Jackdaw Initial Flag", "Black Flag Initial", "Edward Kenway"],
      tags: ["skull", "black", "white"],
    status: "fictional"
    },
    {
      name: "Edward Kenway Jolly Roger (Assassin’s Creed 4)",
      code: "ac-kj",
      image: "Edward_Kenway_Jolly_Roger.svg",
      aliases: ["Edward Kenway Jolly Roger", "Jackdaw Flag", "Assassin Pirate Flag", "Black Flag Jolly Roger"],
      tags: ["skull", "black", "bones", "A", "white"],
    status: "fictional"
    },
    {
      name: "Libya (Red Alert 2)",
      code: "ra-li",
      image: "Flag_of_Libya_(Red_Alert_2).svg",
      aliases: ["Libya Red Alert", "Command & Conquer Libya", "Demolition Truck", "Soviet Libya"],
      tags: ["green", "red", "black", "white", "stripes", "horizontal", "tricolor", "hammer", "sickle"],
    status: "fictional"
    },
    {
      name: "Novaya Russia (Empire Earth)",
      code: "ee-nr",
      image: "Flag_of_Novaya_Russia.jpg",
      aliases: ["Novaya Russia", "Empire Earth Russia", "Grigor Illyanich Stoyanovich", "Cybernetic Russia"],
      tags: ["red", "yellow", "cross"],
    status: "fictional"
    },
    {
      name: "Petria (Road 96)",
      code: "r96-pe",
      image: "Flag_of_Petria.webp",
      aliases: ["Petria", "Road 96 Petria", "President Tyrak", "Florres", "Petria Republic"],
      tags: ["arrow", "yellow", "red", "black", "star", "stripes"],
    status: "fictional"
    },
    {
      name: "San Esperito (Just Cause)",
      code: "jc-se",
      image: "Flag_of_San_Esperito.png",
      aliases: ["San Esperito", "Salvador Mendoza", "Just Cause 1", "San Esperito Island"],
      tags: ["stripes", "horizontal", "white", "cyan"],
    status: "fictional"
    },
    {
      name: "Flag of the Automatons (Helldivers 2)",
      code: "hd-aut",
      image: "Flag_of_the_Automatons_(Helldivers_2).svg",
      aliases: ["Automatons", "Helldivers 2 Automatons", "Bot Flag", "Socialist Bots", "Super Earth Enemies"],
      tags: ["white", "red", "black", "wheel", "cog", "coat of arms", "circle"],
    status: "fictional"
    },
    {
      name: "Helghan Empire (Killzone)",
      code: "kz-he",
      image: "Flag_of_the_Helghan_Empire.svg",
      aliases: ["Helghan Empire", "Helghast", "Scolar Visari", "Killzone Helghast", "Triad Emblem"],
      tags: ["gray", "grey", "red", "black", "white", "circle", "arrows"],
    status: "fictional"
    },
    {
      name: "Russian Democratic Union (Tom Clancy: Ghost Recon)",
      code: "tc-rdu",
      image: "Flag_of_the_Russian_Democratic_Union.png",
      aliases: ["Russian Democratic Union", "Ghost Recon RDU", "Tom Clancy Russia", "Ultranationalist RDU"],
      tags: ["tricolor", "stripes", "red", "blue", "white", "horizontal", "star"],
    status: "fictional"
    },
    {
      name: "Flag of the SCG (Baystation12, Space Station 13)",
      code: "ss-scg",
      image: "Flag_of_the_SCG.svg",
      aliases: ["SCG", "Solar Coalition Government", "Space Station 13 SCG", "Baystation 12"],
      tags: ["blue", "yellow", "wreath", "white", "circle"],
    status: "fictional"
    },
    {
      name: "Tropico (Game Flag)",
      code: "tr-tr",
      image: "Flag_of_Tropico.jpg",
      aliases: ["Tropico", "El Presidente", "Tropico Game Flag", "Banana Island", "Kalypso"],
      tags: ["stripes", "horizontal", "blue", "yellow", "green", "star", "coat of arms", "chevron", "black"],
    status: "fictional"
    },
    {
      name: "Fortress Flag (Super Mario Bros. 1985)",
      code: "sm-ff",
      image: "Fortress_Flag_(SMB).png",
      aliases: ["Fortress Flag SMB", "Bowser's Castle Flag", "Super Mario Castle Flag", "SMB1 Fortress"],
      tags: ["white", "red", "star"],
    status: "fictional"
    },
    {
      name: "Reichskriegsflagge (R.U.S.E.)",
      code: "ruse-rkf",
      image: "Reichskriegsflagge_(R.U.S.E.).png",
      aliases: ["RUSE German Flag", "R.U.S.E. War Flag", "RUSE Reichskriegsflagge"],
      tags: ["cross", "red", "black", "white"],
    status: "fictional"
    },
    {
      name: "Russo-Mongolian Empire (Iron Storm)",
      code: "is-rme",
      image: "Russomon2.png",
      aliases: ["Russo-Mongolian Empire", "Iron Storm", "Baron Nikolai von Ugenberg", "World War Zero"],
      tags: ["red", "black", "stripes", "horizontal", "star", "yellow", "U"],
    status: "fictional"
    },
    {
      name: "Saints Row 4 Flag",
      code: "sr4-sr",
      image: "Saints_Row_IV_flag.svg",
      aliases: ["Saints Row 4", "Third Street Saints", "President of the United States Saints Row", "Fleur-de-lis Saints"],
      tags: ["fleur-de-lis", "blue", "stripes", "red", "white", "horizontal", "canton"],
    status: "fictional"
    },
    {
      name: "Skinz Armband (Manhunt)",
      code: "mh-sa",
      image: "Skinz_Armband.svg",
      aliases: ["Skinz", "Manhunt Skinz", "Skinz Gang", "Rockstar Games Manhunt"],
      tags: ["red", "white", "black", "circle"],
    status: "fictional"
    },
    {
      name: "Flagpole Flag (Super Mario Bros.)",
      code: "sm-fl",
      image: "SMB1_Flagpole_Flag.png",
      aliases: ["SMB Flagpole Flag", "Mario End of Level Flag", "Green Peace Symbol Flag", "Goal Flag Mario"],
      tags: ["triangle", "white", "green", "skull"],
    status: "fictional"
    },
    {
      name: "Germany Fascist Flag (Victoria 3)",
      code: "vc-gf",
      image: "Victoria_3_GER_fascist_flag.svg",
      aliases: ["Victoria 3 Germany Fascist", "Fascist Germany Vic3", "Paradox Fascist Flag"],
      tags: ["cross", "red", "white", "black", "circle"],
    status: "fictional"
    },
    {
      name: "Germany Nihilist Flag (Victoria 3)",
      code: "vc-nf",
      image: "Victoria_3_GER_nihilist_flag.svg",
      aliases: ["Victoria 3 Germany Nihilist", "Nihilist Germany Vic3", "Nihilist Movement Flag"],
      tags: ["green", "black", "diagonal"],
    status: "fictional"
    },
    {
      name: "Technocracy Inc. Flag (Victoria 3)",
      code: "vc-ti",
      image: "Victoria3TechnocracyFlag.png",
      aliases: ["Technocracy Victoria 3", "Technocracy Inc Vic3", "Monad Flag Victoria 3"],
      tags: ["red", "grey", "gray", "circle", "white"],
    status: "fictional"
    }
  ]),

  ...createFictionalFlags("YouTube Misc.", [
    {
      name: "Calhatopia (Avi65 Mapping)",
      code: "am-cal",
      image: "https://static.wikia.nocookie.net/vexillology/images/9/97/Flag_of_Calhatopia.svg/revision/latest/scale-to-width-down/1000?cb=20240521235255",
      aliases: ["Calhatopia", "Avi65 Mapping", "Mapping Community Calhatopia", "YouTube Mapping"],
      tags: ["quartered", "blue", "green", "yellow", "red", "black", "circle"],
    status: "fictional"
    },
    {
      name: "L'Manberg (Wilbur Soot)",
      code: "ws-lm",
      image: "Flag_of_L'Manberg.svg",
      aliases: ["L'Manberg", "L'Manburg", "Dream SMP", "Wilbur Soot", "TommyInnit", "Tubbo"],
      tags: ["tricolor", "stripes", "horizontal", "blue", "yellow", "white", "red", "black", "X", "cross", "chevron"],
    status: "fictional"
    },
    {
      name: "Aurmenia (Auremian)",
      code: "au-au",
      image: "Flag_of_Auremia.svg",
      aliases: ["Aurmenia", "Auremia", "Auremian YouTube", "Mapping Country Auremia"],
      tags: ["blue", "yellow", "white", "red", "stripes", "horizontal", "star"],
    status: "fictional"
    },
    {
      name: "AGL Empire (AGL Productions)",
      code: "agl-em",
      image: "Flag_of_the_AGL_Empire.svg",
      aliases: ["AGL Empire", "AGL Productions", "AGL Mapping", "YouTube AGL Empire"],
      tags: ["orange", "blue", "white", "cross"],
    status: "fictional"
    }
  ])
];
