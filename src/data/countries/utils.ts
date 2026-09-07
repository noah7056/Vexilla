import { Flag, Continent, Category, FlagStatus } from '../../types';

export type SovereignTuple =
  | [code: string, name: string, continent: Continent]
  | [code: string, name: string, continent: Continent, aliases?: string[] | string]
  | [code: string, name: string, continent: Continent, aliases?: string[] | string, tags?: string[] | string]
  | [code: string, name: string, continent: Continent, options?: { aliases?: string[] | string; tags?: string[] | string }]
  | [code: string, name: string, continent: Continent, ...any[]];

export function createSovereignFlags(tuples: (SovereignTuple | any[])[]): Flag[] {
  return tuples.map((tuple) => {
    const [code, name, continent, ...rest] = tuple;
    let aliasesList: string[] = [];
    let tagsList: string[] = [];

    if (rest.length === 1) {
      const item = rest[0];
      if (Array.isArray(item)) {
        aliasesList = item.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (typeof item === 'string' && item.trim()) {
        aliasesList = [item.trim()];
      } else if (typeof item === 'object' && item) {
        if (item.aliases) {
          aliasesList = Array.isArray(item.aliases)
            ? item.aliases.map((s: any) => String(s).trim()).filter(Boolean)
            : [String(item.aliases).trim()];
        }
        if (item.tags) {
          tagsList = Array.isArray(item.tags)
            ? item.tags.map((s: any) => String(s).trim().toLowerCase()).filter(Boolean)
            : [String(item.tags).trim().toLowerCase()];
        }
      }
    } else if (rest.length >= 2) {
      // 4th arg is aliases, 5th arg is tags
      const [aliasesArg, tagsArg] = rest;
      if (aliasesArg) {
        if (Array.isArray(aliasesArg)) {
          aliasesList = aliasesArg.map((s: any) => String(s).trim()).filter(Boolean);
        } else if (typeof aliasesArg === 'string' && aliasesArg.trim()) {
          aliasesList = [aliasesArg.trim()];
        }
      }
      if (tagsArg) {
        if (Array.isArray(tagsArg)) {
          tagsList = tagsArg.map((s: any) => String(s).trim().toLowerCase()).filter(Boolean);
        } else if (typeof tagsArg === 'string' && tagsArg.trim()) {
          tagsList = [tagsArg.trim().toLowerCase()];
        }
      }
    }

    return {
      id: code,
      name,
      code,
      continent,
      category: 'Sovereign States' as Category,
      status: 'official' as FlagStatus,
      ...(aliasesList.length > 0 ? { aliases: aliasesList } : {}),
      tags: tagsList
    };
  });
}

export interface CountryFlagInput {
  id?: string;
  name: string;
  code?: string;
  continent: Continent;
  category?: Category;
  country?: string;
  imageUrl?: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  status?: FlagStatus | '';
}

export function createCountryFlags(
  defaultCategory: Category,
  flags: CountryFlagInput[],
  defaultCountry?: string,
  defaultStatus?: FlagStatus | ''
): Flag[] {
  return flags.map((flag) => {
    const code = flag.code || flag.id || '';
    const id = flag.id || flag.code || '';

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
      id,
      name: flag.name,
      code,
      continent: flag.continent,
      category: flag.category || defaultCategory,
      ...(flag.country || defaultCountry ? { country: flag.country || defaultCountry } : {}),
      ...(flag.imageUrl ? { imageUrl: flag.imageUrl } : {}),
      ...(finalAliases && finalAliases.length > 0 ? { aliases: finalAliases } : {}),
      ...(status ? { status } : {}),
      tags: finalTags
    };
  });
}

