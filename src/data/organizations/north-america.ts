import { createOrganizationFlags } from './utils';

export const NORTH_AMERICA_ORG_FLAGS = createOrganizationFlags('North America', 'North America', [
  {
    id: 'org-oas',
    name: 'Organization of American States',
    image: 'Flag_of_the_Organization_of_American_States.svg',
    continent: 'North America',
    country: 'North America',
    aliases: ['OAS', 'Organization of American States', 'Organización de los Estados Americanos'],
    status: 'official',
  },
  {
    id: 'org-caricom',
    name: 'Caribbean Community',
    image: 'Flag_of_the_Caribbean_Community.svg',
    continent: 'North America',
    country: 'North America',
    aliases: ['CARICOM', 'Caribbean Community', 'Communauté caribéenne'],
    status: 'official',
  },
  {
    id: 'org-sica',
    name: 'Central American Integration System',
    image: 'Flag_of_SICA.svg',
    continent: 'North America',
    country: 'North America',
    aliases: ['SICA', 'Central American Integration System', 'Sistema de la Integración Centroamericana'],
    status: 'official',
  },
  {
    id: 'org-petrocaribe',
    name: 'Petrocaribe',
    image: 'Flag_of_Petrocaribe.svg',
    continent: 'North America',
    country: 'North America',
    aliases: ['Petrocaribe', 'Petrocaribe Energy Cooperation'],
    status: 'official',
  },
  {
    id: 'org-alba',
    name: 'Bolivarian Alliance for the Peoples of Our America',
    image: 'Flag_of_ALBA.svg',
    continent: 'North America',
    country: 'North America',
    aliases: ['ALBA', 'Bolivarian Alliance for the Peoples of Our America', 'Alianza Bolivariana para los Pueblos de Nuestra América'],
    status: 'official',
  },
]);
