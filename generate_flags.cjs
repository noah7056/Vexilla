const fs = require('fs');

const existingContent = fs.readFileSync('src/data/flags.ts', 'utf8');

// The 197 recognized countries (UN members + observers + a few others commonly recognized)
const sovereignCodes = [
  "af", "al", "dz", "ad", "ao", "ag", "ar", "am", "au", "at", "az", "bs", "bh", "bd", "bb", "by", "be", "bz", "bj", "bt", 
  "bo", "ba", "bw", "br", "bn", "bg", "bf", "bi", "cv", "kh", "cm", "ca", "cf", "td", "cl", "cn", "co", "km", "cg", "cd", 
  "cr", "hr", "cu", "cy", "cz", "dk", "dj", "dm", "do", "tl", "ec", "eg", "sv", "gq", "er", "ee", "sz", "et", "fj", "fi", 
  "fr", "ga", "gm", "ge", "de", "gh", "gr", "gd", "gt", "gn", "gw", "gy", "ht", "hn", "hu", "is", "in", "id", "ir", "iq", 
  "ie", "il", "it", "ci", "jm", "jp", "jo", "kz", "ke", "ki", "kp", "kr", "kw", "kg", "la", "lv", "lb", "ls", "lr", "ly", 
  "li", "lt", "lu", "mg", "mw", "my", "mv", "ml", "mt", "mh", "mr", "mu", "mx", "fm", "md", "mc", "mn", "me", "ma", "mz", 
  "mm", "na", "nr", "np", "nl", "nz", "ni", "ne", "ng", "mk", "no", "om", "pk", "pw", "pa", "pg", "py", "pe", "ph", "pl", 
  "pt", "qa", "ro", "ru", "rw", "kn", "lc", "vc", "ws", "sm", "st", "sa", "sn", "rs", "sc", "sl", "sg", "sk", "si", "sb", 
  "so", "za", "ss", "es", "lk", "sd", "sr", "se", "ch", "sy", "tj", "tz", "th", "tg", "to", "tt", "tn", "tr", "tm", "tv", 
  "ug", "ua", "ae", "gb", "us", "uy", "uz", "vu", "ve", "vn", "ye", "zm", "zw", "va"
]; // 194 codes

// Add Palestine (ps), Kosovo (xk), Taiwan (tw) which brings it to 197. Wait, the user has them in "Non-Sovereign & Unrecognized" already. 
// Let's add them to Sovereign States or keep them? The user asked for "at least all 197 flags of recognized countries".
// Let's just generate the Sovereign States list.

async function run() {
  const res = await fetch('https://flagcdn.com/en/codes.json');
  const codes = await res.json();
  
  let flags = [];
  
  // 1. Add all sovereign states
  for (const code of sovereignCodes) {
    if (codes[code]) {
      flags.push(`  { id: '${code}', name: '${codes[code].replace(/'/g, "\\'")}', code: '${code}', category: 'Sovereign States' },`);
    }
  }
  
  // 2. Extract existing flags from the other categories
  const nonSovereign = [
    { id: 'tw', name: 'Taiwan', code: 'tw', category: 'Non-Sovereign & Unrecognized' },
    { id: 'xk', name: 'Kosovo', code: 'xk', category: 'Non-Sovereign & Unrecognized' },
    { id: 'ps', name: 'Palestine', code: 'ps', category: 'Non-Sovereign & Unrecognized' },
    { id: 'eh', name: 'Western Sahara', code: 'eh', category: 'Non-Sovereign & Unrecognized' }
  ];
  for(let f of nonSovereign) {
    flags.push(`  { id: '${f.id}', name: '${f.name}', code: '${f.code}', category: '${f.category}' },`);
  }

  const usStates = [
    { id: 'us-ca', name: 'California', code: 'us-ca', category: 'US States' },
    { id: 'us-tx', name: 'Texas', code: 'us-tx', category: 'US States' },
    { id: 'us-ny', name: 'New York', code: 'us-ny', category: 'US States' },
    { id: 'us-fl', name: 'Florida', code: 'us-fl', category: 'US States' },
    { id: 'us-hi', name: 'Hawaii', code: 'us-hi', category: 'US States' },
    { id: 'us-ak', name: 'Alaska', code: 'us-ak', category: 'US States' },
    { id: 'us-md', name: 'Maryland', code: 'us-md', category: 'US States' },
    { id: 'us-co', name: 'Colorado', code: 'us-co', category: 'US States' },
    { id: 'us-oh', name: 'Ohio', code: 'us-oh', category: 'US States' },
    { id: 'us-nm', name: 'New Mexico', code: 'us-nm', category: 'US States' }
  ];
  for(let f of usStates) {
    flags.push(`  { id: '${f.id}', name: '${f.name}', code: '${f.code}', category: '${f.category}' },`);
  }

  const provinces = [
    { id: 'pr', name: 'Puerto Rico', code: 'pr', category: 'Provinces & Territories' },
    { id: 'gl', name: 'Greenland', code: 'gl', category: 'Provinces & Territories' },
    { id: 'gb-sct', name: 'Scotland', code: 'gb-sct', category: 'Provinces & Territories' },
    { id: 'gb-wls', name: 'Wales', code: 'gb-wls', category: 'Provinces & Territories' },
    { id: 'gb-eng', name: 'England', code: 'gb-eng', category: 'Provinces & Territories' },
    { id: 'ca-qc', name: 'Quebec', code: 'ca-qc', category: 'Provinces & Territories', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Quebec.svg/500px-Flag_of_Quebec.svg.png' },
    { id: 'ca-bc', name: 'British Columbia', code: 'ca-bc', category: 'Provinces & Territories', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Flag_of_British_Columbia.svg/500px-Flag_of_British_Columbia.svg.png' },
    { id: 'ca-on', name: 'Ontario', code: 'ca-on', category: 'Provinces & Territories', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Ontario.svg/500px-Flag_of_Ontario.svg.png' },
    { id: 'au-nt', name: 'Northern Territory', code: 'au-nt', category: 'Provinces & Territories', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_the_Northern_Territory.svg/500px-Flag_of_the_Northern_Territory.svg.png' },
    { id: 'pf', name: 'French Polynesia', code: 'pf', category: 'Provinces & Territories' }
  ];
  for(let f of provinces) {
    if(f.imageUrl) {
      flags.push(`  { id: '${f.id}', name: '${f.name}', code: '${f.code}', category: '${f.category}', imageUrl: '${f.imageUrl}' },`);
    } else {
      flags.push(`  { id: '${f.id}', name: '${f.name}', code: '${f.code}', category: '${f.category}' },`);
    }
  }

  const outContent = `import { Flag } from './types';\n\nexport const FLAGS: Flag[] = [\n${flags.join('\\n')}\n];\n\nexport const getFlagImageUrl = (flag: Flag) => {\n  if (flag.imageUrl) {\n    return flag.imageUrl;\n  }\n  return \`https://flagcdn.com/w320/\${flag.code.toLowerCase()}.png\`;\n};\n`;
  
  fs.writeFileSync('src/data/flags.ts', outContent);
  console.log("Wrote " + flags.length + " flags");
}

run();
