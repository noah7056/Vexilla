import { FLAGS } from './src/data/flags';

const getSubOptions = (category: string) => {
  const flags = FLAGS.filter(f => f.category === category);
  const options = new Set(flags.map(f => f.country).filter(Boolean));
  console.log(`${category} sub-options:`, Array.from(options).length);
};
getSubOptions('Provinces & Territories');
getSubOptions('Indigenous & Cultural Populations');
getSubOptions('Fictional');
