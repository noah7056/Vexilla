import { createOrganizationFlags } from './utils';

export const NORTH_AMERICA_ORG_FLAGS = createOrganizationFlags('North America', 'North America', [
  {
    id: 'custom-org-nafta-1788873118540',
    code: 'org-nafta',
    name: 'North American Free Trade Agreement (1994-2020)',
    image: 'Flag_of_the_North_American_Free_Trade_Agreement_(standard_version).svg',
    continent: 'North America',
    country: 'North America',
    status: 'historical',
  },
  {
    id: 'org-guatemala',
    name: 'Guatemala',
    image: 'Flag_of_Guatemala.svg',
    continent: 'North America',
    country: 'Guatemala',
    aliases: ['Guatemala', 'GT', 'GTM'],
    status: 'official',
  },
  {
    id: 'custom-org-es-cacif-1788883066683',
    code: 'org-gt-cacif',
    name: 'Coordinadora de Asociaciones Comerciales, Industriales y Financieras',
    imageUrl: 'https://www.crwflags.com/fotw/images/g/gt$cacif.gif',
    sourceUrl: 'https://www.crwflags.com/fotw/flags/gt_cacif.html',
    creator: 'Ivan Sache',
    continent: 'North America',
    country: 'Guatemala',
    aliases: ['cacif'],
    status: 'official',
  },
]);

