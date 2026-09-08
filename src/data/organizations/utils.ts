import { Flag, Continent, FlagStatus } from '../../types';

export interface OrganizationFlagInput {
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
  creator?: string;
  sourceUrl?: string;
}

export function createOrganizationFlags(
  defaultGroup: string,
  defaultContinent: Continent,
  flags: OrganizationFlagInput[],
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
    const finalId = flag.id || (rawId.startsWith('org-') ? rawId : `org-${rawId}`);
    const finalCode = flag.code || (flag.id ? flag.id.replace(/^custom-/, '') : rawId.replace(/^org-/, ''));

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
      category: 'Organizations' as const,
      country: flag.country || defaultGroup,
      imageUrl: finalImageUrl,
      ...(status ? { status } : {}),
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags,
      ...(flag.creator ? { creator: flag.creator } : {}),
      ...(flag.sourceUrl ? { sourceUrl: flag.sourceUrl } : {})
    };
  });
}
