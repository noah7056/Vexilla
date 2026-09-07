const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

// Ensure correct imports
if (!content.includes('Filter')) {
    content = content.replace("import { Search,", "import { Search, Filter, Settings2,");
} else if (!content.includes('Settings2')) {
    content = content.replace("import { Search, Filter,", "import { Search, Filter, Settings2,");
}

fs.writeFileSync('src/components/FlagDictionary.tsx', content);
