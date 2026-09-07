const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

const regex = /const \[submenuSearch,[\s\S]*?setSubmenuSearch\] = useState\(''\);/;
content = content.replace(regex, "const [submenuSearch, setSubmenuSearch] = useState('');");

fs.writeFileSync('src/components/FlagDictionary.tsx', content);
