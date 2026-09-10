import { Flag, Continent, FlagStatus } from '../../types';

/**
 * Pirate flag definition.
 * - `id`: Short identifier (e.g. "pir-beard", "pir-rackham", "pir-jolly") displayed in the focus view badge.
 * - `name`: Display name of the flag.
 * - `image`: Wikimedia filename or full URL.
 * - `country`: (Optional) Custom subgroup or historical region.
 * - `code`: (Optional) Defaults to `id` so you never have to duplicate both.
 */
export interface PirateFlagInput {
  id?: string;
  name: string;
  image: string;
  code?: string;
  country?: string;
  continent?: Continent;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus;
}

export function createPirateFlags(
  defaultGroup: string,
  flags: PirateFlagInput[]
): Flag[] {
  return flags.map((flag) => {
    let finalImageUrl = flag.image;
    if (flag.image && !flag.image.startsWith('http')) {
      finalImageUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${flag.image}&width=320`;
    }

    const rawId = flag.id || flag.code || flag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanId = rawId.startsWith('pir-') ? rawId : `pir-${rawId}`;

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

    return {
      id: cleanId,
      name: flag.name,
      code: flag.code || cleanId, // Defaults to id so there is no redundancy
      // Pirate flags have no sub-sections, so no continent attribute.
      ...(flag.continent ? { continent: flag.continent } : {}),
      category: 'Pirate Flags',
      country: flag.country || defaultGroup,
      imageUrl: finalImageUrl,
      status: flag.status || 'historical',
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags
    };
  });
}
