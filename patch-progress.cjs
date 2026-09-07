const fs = require('fs');

function patchProgressTracker() {
    let content = fs.readFileSync('src/components/ProgressTracker.tsx', 'utf8');
    if (!content.includes('LGBTQISubMenu')) {
        content = content.replace("import { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';", "import { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';\nimport { LGBTQISubMenu } from './LGBTQISubMenu';");
    }

    content = content.replace(
        "if (selectedCategories.includes('Fictional') && selectedFictionalUniverse && selectedFictionalUniverse !== 'All' && flag.category === 'Fictional') {",
        `if (selectedCategories.includes('LGBTQI+') && selectedLgbtqiSubcategory && selectedLgbtqiSubcategory !== 'All' && flag.category === 'LGBTQI+') {
          if (flag.country !== selectedLgbtqiSubcategory) return false;
        }
        
        if (selectedCategories.includes('Fictional') && selectedFictionalUniverse && selectedFictionalUniverse !== 'All' && flag.category === 'Fictional') {`
    );

    const submenuJSX = `{selectedCategories.includes('Fictional') && (
            <div className="mt-3">
              <FictionalUniverseSubMenu
                selectedUniverse={selectedFictionalUniverse || 'All'}
                onSelectUniverse={setSelectedFictionalUniverse}
              />
            </div>
          )}`;

    const lgbtqiJSX = `
          {selectedCategories.includes('LGBTQI+') && (
            <div className="mt-3">
              <LGBTQISubMenu
                selectedSubcategory={selectedLgbtqiSubcategory || 'All'}
                onSelectSubcategory={setSelectedLgbtqiSubcategory}
              />
            </div>
          )}`;

    if (!content.includes('LGBTQISubMenu selectedSubcategory=')) {
        content = content.replace(submenuJSX, submenuJSX + lgbtqiJSX);
        
        // Add state
        content = content.replace("const [selectedFictionalUniverse, setSelectedFictionalUniverse] = useState<string>('All');", "const [selectedFictionalUniverse, setSelectedFictionalUniverse] = useState<string>('All');\n  const [selectedLgbtqiSubcategory, setSelectedLgbtqiSubcategory] = useState<string>('All');");
    }
    fs.writeFileSync('src/components/ProgressTracker.tsx', content);
}

patchProgressTracker();
