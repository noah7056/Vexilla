const fs = require('fs');

let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

// 1. Imports
content = content.replace(
  "ShieldCheck\n} from 'lucide-react';",
  "ShieldCheck,\n  Settings,\n  Check\n} from 'lucide-react';"
);

content = content.replace("import { ProvinceCountrySubMenu } from './ProvinceCountrySubMenu';\nimport { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';\n", "");

// 2. States
content = content.replace(
  "const [selectedProvinceCountry, setSelectedProvinceCountry] = useState<string>('All');\n  const [selectedFictionalUniverse, setSelectedFictionalUniverse] = useState<string>('All');\n  const [selectedIndigenousCountry, setSelectedIndigenousCountry] = useState<string>('All');",
  "const [selectedSubOptions, setSelectedSubOptions] = useState<Record<string, string[]>>({});\n  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);\n  const [submenuSearch, setSubmenuSearch] = useState('');"
);

// 3. useEffect
content = content.replace(
  "}, [search, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedProvinceCountry, selectedFictionalUniverse, selectedIndigenousCountry, sortBy, showFavoritesOnly, itemsPerPage]);",
  "}, [search, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedSubOptions, sortBy, showFavoritesOnly, itemsPerPage]);"
);

// 4. toggleCategory
content = content.replace(
  "const toggleCategory = (cat: Category) => {\n    setSelectedCategories((prev) => {\n      if (prev.includes('All')) {\n        return [cat];\n      }\n      const exists = prev.includes(cat);\n      if (exists) {\n        const next = prev.filter((c) => c !== cat);\n        return next.length === 0 ? ['All'] : next;\n      } else {\n        const next = [...prev, cat];\n        if (next.length === ALL_CATEGORIES.length) {\n          return ['All'];\n        }\n        return next;\n      }\n    });\n  };",
  "const toggleCategory = (cat: Category | 'All') => {\n    if (cat === 'All') {\n      setSelectedCategories(['All']);\n      setSelectedSubOptions({});\n      return;\n    }\n    setSelectedCategories((prev) => {\n      if (prev.includes('All')) return [cat];\n      const exists = prev.includes(cat);\n      if (exists) {\n        const next = prev.filter((c) => c !== cat);\n        setSelectedSubOptions(prevSub => {\n          const newSub = { ...prevSub };\n          delete newSub[cat];\n          return newSub;\n        });\n        return next.length === 0 ? ['All'] : next;\n      } else {\n        const next = [...prev, cat];\n        if (next.length === ALL_CATEGORIES.length) {\n          setSelectedSubOptions({});\n          return ['All'];\n        }\n        return next;\n      }\n    });\n  };"
);

// 5. selectAll
content = content.replace(
  "const selectAllCategories = () => setSelectedCategories(['All']);",
  "const selectAllCategories = () => {\n    setSelectedCategories(['All']);\n    setSelectedSubOptions({});\n  };"
);

// 6. clearAllFilters
content = content.replace(
  "setSelectedProvinceCountry('All');\n    setSelectedFictionalUniverse('All');\n    setSelectedIndigenousCountry('All');",
  "setSelectedSubOptions({});"
);

// 7. hasCustomFilters
content = content.replace(
  "selectedProvinceCountry !== 'All' ||\n    selectedFictionalUniverse !== 'All' ||\n    selectedIndigenousCountry !== 'All' ||",
  "Object.values(selectedSubOptions).some(arr => arr.length > 0) ||"
);

// 8. filteredFlags memo
const memoStart = "const filteredFlags = useMemo(() => {";
const memoEnd = "}, [search, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedProvinceCountry, selectedFictionalUniverse, selectedIndigenousCountry, sortBy, showFavoritesOnly, favoritesSet]);";
const newMemoEnd = "}, [search, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedSubOptions, sortBy, showFavoritesOnly, favoritesSet]);";
content = content.replace(memoEnd, newMemoEnd);

const regexProvinces = /\/\/ If flag is in Provinces & Territories.*?if \(flag\.category === 'Fictional' and selectedFictionalUniverse !== 'All'\) \{/s;
// Let's replace the whole filtering part for subcategories.
// Wait, regex might fail. Let's do it safely.
fs.writeFileSync('src/components/FlagDictionary.tsx', content);
