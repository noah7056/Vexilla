import fs from 'fs';
import path from 'path';

// Helper to calculate similarity
function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  let match = 0;
  for(let i=0; i<shorter.length; i++) {
     if(longer.toLowerCase().includes(shorter[i].toLowerCase())) match++;
  }
  return match / longerLength;
}

const targets = {
  'mexico.ts': 'List_of_states_of_Mexico',
  'argentina.ts': 'Provinces_of_Argentina',
  'peru.ts': 'Regions_of_Peru',
  'venezuela.ts': 'States_of_Venezuela',
  'ecuador.ts': 'Provinces_of_Ecuador',
  'uruguay.ts': 'Departments_of_Uruguay',
  'panama.ts': 'Provinces_of_Panama',
  'dominican-republic.ts': 'Provinces_of_the_Dominican_Republic'
};

async function run() {
  for (const [file, wikiPage] of Object.entries(targets)) {
    console.log(`\nFixing ${file} using ${wikiPage}...`);
    
    // Fetch flags from Wikipedia
    const res = await fetch(`https://en.wikipedia.org/wiki/${wikiPage}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    const flagSet = new Set();
    const matches = html.matchAll(/\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+(?:\.svg|\.png|\.jpg|\.PNG|\.JPG))/g);
    for (const m of matches) {
       const decoded = decodeURIComponent(m[1]);
       if (decoded.toLowerCase().includes('flag') || decoded.toLowerCase().includes('bandera')) {
          flagSet.add(decoded);
       }
    }
    const flags = Array.from(flagSet);
    console.log(`Found ${flags.length} flags on Wikipedia`);
    
    // Read local file
    const filePath = path.join('src/data/provinces', file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find missing or broken flags from original logic
    const regex = /name:\s*['"]([^'"]+)['"][\s\S]*?image:\s*['"]([^'"]+)['"]/g;
    let newContent = content;
    
    for (const match of content.matchAll(regex)) {
      const name = match[1];
      const img = match[2];
      
      // If the image contains "Mexico", "Quebec" but not the name, or if we know it was broken
      // Let's just find the best match for EVERY flag in the file from the Wikipedia list to be safe!
      let bestMatch = img;
      let bestScore = -1;
      
      const searchName = name.toLowerCase().replace(/province|state|department|region|autonomous|\(.*\)/g, '').trim();
      
      for (const f of flags) {
         const fName = f.replace(/Flag_of_|Bandera_de_la_Provincia_de_|Bandera_de_la_Provincia_del_|Bandera_de_|Bandera_del_Departamento_de_|Bandera_|\.svg|\.png|\.jpg/ig, '').replace(/_/g, ' ').trim().toLowerCase();
         if (fName.includes(searchName) || searchName.includes(fName)) {
            bestMatch = f;
            bestScore = 1;
            break;
         }
      }
      
      if (bestScore === 1 && bestMatch !== decodeURIComponent(img)) {
         console.log(`${name}: ${img} -> ${bestMatch}`);
         newContent = newContent.replace(img, encodeURIComponent(bestMatch));
      }
    }
    
    fs.writeFileSync(filePath, newContent);
  }
}

run();
