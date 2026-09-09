import { Continent, Flag, FlagStatus } from '../../types';

export interface ConceptFlagInput {
  id?: string;
  name: string;
  code: string;
  country?: string;
  /** Sub-section this flag belongs to (Concepts, Experiments, Community, Personal). */
  continent?: Continent | string;
  image?: string;
  imageUrl?: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus | '';
}

export function createConceptFlags(
  subgroup: string,
  flags: ConceptFlagInput[],
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
    const cleanCode = flag.code.startsWith('concept-') ? flag.code : `concept-${flag.code}`;

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
      category: 'Concepts' as const,
      continent: (flag.continent || subgroup) as Continent,
      country: flag.country || subgroup,
      imageUrl: finalImageUrl,
      ...(status ? { status } : {}),
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags
    };
  });
}
