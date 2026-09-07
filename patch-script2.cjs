const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

const targetStr = `      // If flag is in Provinces & Territories or Indigenous & Cultural Populations and a specific country is selected
      if (
        (flag.category === 'Provinces & Territories' || flag.category === 'Indigenous & Cultural Populations') &&
        selectedProvinceCountry !== 'All'
      ) {
        if (flag.country !== selectedProvinceCountry) {
          return false;
        }
      }

      // If flag is in Fictional and a specific universe is selected
      if (flag.category === 'Fictional' && selectedFictionalUniverse !== 'All') {
        if (flag.country !== selectedFictionalUniverse) {
          return false;
        }
      }`;

const replacement = `      // Sub-options filtering for specific categories
      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional'].includes(flag.category)) {
        const activeSubOptions = selectedSubOptions[flag.category] || [];
        if (activeSubOptions.length > 0) {
          if (!flag.country || !activeSubOptions.includes(flag.country)) {
            return false;
          }
        }
      }`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/components/FlagDictionary.tsx', content);
