import { createOrganizationFlags } from './utils';

export const SOUTH_AMERICA_ORG_FLAGS = createOrganizationFlags('South America', 'South America', [
  {
    id: 'org-mercosur',
    name: 'Mercado Común del Sur',
    image: 'Flag_of_Mercosur.svg',
    continent: 'South America',
    country: 'South America',
    aliases: ['Mercosur', 'Mercosul', 'Southern Common Market'],
    status: 'official',
  },
  {
    id: 'org-can',
    name: 'Andean Community',
    image: 'Flag_of_the_Andean_Community.svg',
    continent: 'South America',
    country: 'South America',
    aliases: ['CAN', 'Andean Community', 'Comunidad Andina'],
    status: 'official',
  },
  {
    id: 'org-sela',
    name: 'Latin American and Caribbean Economic System',
    image: 'Flag_of_SELA.svg',
    continent: 'South America',
    country: 'South America',
    aliases: ['SELA', 'Latin American and Caribbean Economic System', 'Sistema Económico Latinoamericano y del Caribe'],
    status: 'official',
  },
  {
    id: 'org-unasur',
    name: 'Union of South American Nations',
    image: 'Flag_of_UNASUR.svg',
    continent: 'South America',
    country: 'South America',
    aliases: ['UNASUR', 'UNASUL', 'Union of South American Nations', 'Unión de Naciones Suramericanas'],
    status: 'official',
  },
  {
    id: 'org-prosur',
    name: 'Forum for the Progress and Development of South America',
    image: 'Flag_of_PROSUR.svg',
    continent: 'South America',
    country: 'South America',
    aliases: ['PROSUR', 'Forum for the Progress and Development of South America'],
    status: 'official',
  },
]);
