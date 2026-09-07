const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

content = content.replace('grouped[cont].add(f.country);', 'grouped[cont].add(f.country as string);');
content = content.replace('options: Array.from(grouped[cont]).sort().filter(opt => opt.toLowerCase().includes(submenuSearch.toLowerCase()))', 'options: Array.from(grouped[cont]).sort().filter(opt => (opt as string).toLowerCase().includes(submenuSearch.toLowerCase()))');

fs.writeFileSync('src/components/FlagDictionary.tsx', content);
