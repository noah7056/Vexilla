import { Flag, Continent, FlagStatus } from '../../types';

export interface IndigenousFlagInput {
  id?: string;
  name: string;
  code?: string;
  continent?: Continent;
  country?: string;
  image?: string;
  imageUrl?: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus | '';
}

export function createIndigenousFlags(
  defaultCountry: string,
  defaultContinent: Continent,
  flags: IndigenousFlagInput[],
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

    const rawId = flag.id || flag.code || flag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalId = rawId.startsWith('ind-') ? rawId : `ind-${rawId}`;
    const finalCode = flag.code || flag.id || rawId.replace(/^ind-/, '');

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
      id: finalId,
      name: flag.name,
      code: finalCode,
      continent: flag.continent || defaultContinent,
      category: 'Indigenous & Cultural Populations',
      country: flag.country || defaultCountry,
      imageUrl: finalImageUrl,
      ...(status ? { status } : {}),
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags
    };
  });
}
