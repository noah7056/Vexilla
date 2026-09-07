const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

const regex = /\{\/\* Active Search Filter Tags \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;
content = content.replace(regex, "");

fs.writeFileSync('src/components/FlagDictionary.tsx', content);
