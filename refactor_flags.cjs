const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const filesToRefactor = [
  'Flashcards.tsx',
  'Quiz.tsx',
  'FlagCompareModal.tsx',
  'ProvinceCountrySubMenu.tsx',
  'CategoryFilterChips.tsx',
  'ProgressTracker.tsx',
  'FlagDictionary.tsx',
  'CollectionsView.tsx',
  'FictionalUniverseSubMenu.tsx',
  'LGBTQISubMenu.tsx',
  'AdditionalFiltersBar.tsx'
];

filesToRefactor.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  if (content.includes("import { FLAGS } from '../data/flags';")) {
    content = content.replace("import { FLAGS } from '../data/flags';", "import { useFlags } from '../contexts/FlagsContext';");
  } else if (content.match(/import\s*\{\s*FLAGS\s*,\s*([^}]+)\}\s*from\s*'..\/data\/flags';/)) {
    content = content.replace(/import\s*\{\s*FLAGS\s*,\s*([^}]+)\}\s*from\s*'..\/data\/flags';/, "import { $1 } from '../data/flags';\nimport { useFlags } from '../contexts/FlagsContext';");
  } else if (content.match(/import\s*\{\s*([^,]+),\s*FLAGS\s*\}\s*from\s*'..\/data\/flags';/)) {
    content = content.replace(/import\s*\{\s*([^,]+),\s*FLAGS\s*\}\s*from\s*'..\/data\/flags';/, "import { $1 } from '../data/flags';\nimport { useFlags } from '../contexts/FlagsContext';");
  }

  // Inject `const { flags: FLAGS } = useFlags();` at the beginning of the component
  // Components usually start with `export function ComponentName` or `export const ComponentName = `
  
  // Custom injections for each component
  const hookInjection = "\n  const { flags: FLAGS } = useFlags();";
  
  // Simple regex to find the first `{` after the component declaration
  // A bit naive, but works for these specific files if we know their structure.
  
  if (file === 'Flashcards.tsx') {
    content = content.replace(/export function Flashcards\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'Quiz.tsx') {
    content = content.replace(/export function Quiz\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'FlagCompareModal.tsx') {
    content = content.replace(/export function FlagCompareModal\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'ProvinceCountrySubMenu.tsx') {
    content = content.replace(/export function ProvinceCountrySubMenu\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'CategoryFilterChips.tsx') {
    content = content.replace(/export function CategoryFilterChips\([^)]*\) \{/, match => match + hookInjection);
    // Note: CategoryFilterChips has `flagsPool = FLAGS` in props. We need to remove default prop and set it inside.
    content = content.replace(/flagsPool = FLAGS,/g, "flagsPool: initialFlagsPool,");
    content = content.replace(/const { flags: FLAGS } = useFlags\(\);/, "const { flags: FLAGS } = useFlags();\n  const flagsPool = initialFlagsPool || FLAGS;");
  } else if (file === 'ProgressTracker.tsx') {
    content = content.replace(/export function ProgressTracker\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'FlagDictionary.tsx') {
    content = content.replace(/export function FlagDictionary\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'CollectionsView.tsx') {
    content = content.replace(/export function CollectionsView\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'FictionalUniverseSubMenu.tsx') {
    content = content.replace(/export function FictionalUniverseSubMenu\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'LGBTQISubMenu.tsx') {
    content = content.replace(/export function LGBTQISubMenu\([^)]*\) \{/, match => match + hookInjection);
  } else if (file === 'AdditionalFiltersBar.tsx') {
    content = content.replace(/export function AdditionalFiltersBar\([^)]*\) \{/, match => match + hookInjection);
    // Note: AdditionalFiltersBar has `flagsPool = FLAGS` in props.
    content = content.replace(/flagsPool = FLAGS,/g, "flagsPool: initialFlagsPool,");
    content = content.replace(/const { flags: FLAGS } = useFlags\(\);/, "const { flags: FLAGS } = useFlags();\n  const flagsPool = initialFlagsPool || FLAGS;");
  }

  fs.writeFileSync(filePath, content);
});

console.log("Done");
