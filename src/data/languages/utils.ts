import { Flag, Continent, FlagStatus } from '../../types';

export interface LanguageFlagInput {
  id?: string;
  name: string;
  code: string;
  continent?: Continent;
  country?: string;
  image?: string;
  imageUrl?: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus | '';
}

export function createLanguageFlags(
  defaultGroupOrCountry: string,
  defaultContinent: Continent,
  flags: LanguageFlagInput[],
  defaultStatus?: FlagStatus | ''
): Flag[] {
  return flags.map(flag => {
    let finalImageUrl = flag.imageUrl;
    if (flag.image && !finalImageUrl) {
      if (flag.image.startsWith('http')) {
        finalImageUrl = flag.image;
      } else {
        finalImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${flag.image}`;
      }
    }
    const cleanCode = flag.code.startsWith('lang-') ? flag.code : `lang-${flag.code}`;

    let finalAliases: string[] | undefined = undefined;
    if (flag.aliases) {
      if (Array.isArray(flag.aliases)) {
        finalAliases = flag.aliases.map((a) => String(a).trim()).filter(Boolean);
      } else if (typeof flag.aliases === 'string' && flag.aliases.trim()) {
        finalAliases = [flag.aliases.trim()];
      }
    }

    let finalTags: string[] = [];
    if (flag.tags) {
      if (Array.isArray(flag.tags)) {
        finalTags = Array.from(new Set(flag.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)));
      } else if (typeof flag.tags === 'string' && flag.tags.trim()) {
        finalTags = [flag.tags.trim().toLowerCase()];
      }
    }

    const status = flag.status || defaultStatus;

    return {
      id: flag.id || cleanCode,
      name: flag.name,
      code: cleanCode,
      continent: flag.continent || defaultContinent,
      category: 'Languages',
      country: flag.country || defaultGroupOrCountry,
      imageUrl: finalImageUrl,
      ...(status ? { status } : {}),
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags
    };
  });
}
