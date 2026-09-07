import { Flag, Continent, Category, FlagStatus } from '../../types';

/**
 * Province and Territory Flag Input.
 * - `id`: Unique identifier (e.g. "ca-on", "us-tx", "it-lom"). Code is optional because `id` is sufficient.
 * - `name`: Display name of the province, state, or territory.
 * - `image`: Wikimedia Commons filename (e.g. "Flag_of_Ontario.svg") or full URL.
 * - `imageUrl`: (Optional) Alternate direct image URL.
 * - `code`: (Optional) If omitted, defaults automatically to `id`.
 * - `continent`: (Optional) Defaults to defaultContinent passed to createProvinceFlags or 'North America'.
 * - `country`: (Optional) Defaults to country passed to createProvinceFlags.
 * - `category`: (Optional) Automatically set to 'Provinces & Territories'.
 * - `aliases`: (Optional) Alternative search names/abbreviations (e.g. ["ON", "Ontario"] or "ON").
 * - `status`: (Optional) Official status / designation of the flag.
 */
export interface CreateProvinceFlagInput {
  id?: string;
  code?: string;
  name: string;
  image?: string;
  imageUrl?: string;
  continent?: Continent;
  country?: string;
  category?: Category;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus | '';
}

// Backward compatibility alias
export type CreateFlagInput = CreateProvinceFlagInput;

export function createProvinceFlags(
  country: string,
  flags: CreateProvinceFlagInput[],
  defaultContinent?: Continent,
  defaultStatus?: FlagStatus | ''
): Flag[] {
  const inferredContinent = defaultContinent || flags.find((f) => f.continent)?.continent;

  return flags.map((flag) => {
    let finalImageUrl = flag.imageUrl;

    if (flag.image && !finalImageUrl) {
      if (flag.image.startsWith('http')) {
        finalImageUrl = flag.image;
      } else {
        finalImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${flag.image}`;
      }
    }

    // Determine ID and Code: id is primary; code defaults to id (or vice versa)
    const rawId = flag.id || flag.code || flag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalId = rawId.startsWith('prov-') ? rawId : `prov-${rawId}`;
    const finalCode = flag.code || flag.id || rawId.replace(/^prov-/, '');

    // Normalize aliases: supports string[] or a single string
    let finalAliases: string[] | undefined = undefined;
    if (flag.aliases) {
      if (Array.isArray(flag.aliases)) {
        finalAliases = flag.aliases.map((a) => String(a).trim()).filter(Boolean);
      } else if (typeof flag.aliases === 'string' && flag.aliases.trim()) {
        finalAliases = [flag.aliases.trim()];
      }
    }

    // Normalize tags: supports string[] or a single string
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
      continent: flag.continent || inferredContinent || 'North America',
      country: flag.country || country,
      category: 'Provinces & Territories' as Category,
      imageUrl: finalImageUrl,
      ...(status ? { status } : {}),
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      tags: finalTags
    };
  });
}

