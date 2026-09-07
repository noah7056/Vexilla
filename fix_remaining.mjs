import fs from 'fs';
import path from 'path';

// Let's create a script that checks specifically these files against Wikipedia 
// by looking for the best match like we did before, but with hardcoded URLs.
const targets = {
  'united-kingdom.ts': ['Counties_of_the_United_Kingdom', 'Counties_of_England', 'Counties_of_Wales', 'Counties_of_Northern_Ireland', 'Shires_of_Scotland'],
  'indonesia.ts': ['Provinces_of_Indonesia'],
  'philippines.ts': ['Provinces_of_the_Philippines', 'Regions_of_the_Philippines'],
  'russia.ts': ['Federal_subjects_of_Russia', 'Republics_of_Russia', 'Krais_of_Russia', 'Oblasts_of_Russia', 'Autonomous_okrugs_of_Russia'],
  'germany.ts': ['States_of_Germany'],
  'panama.ts': ['Provinces_of_Panama'],
  'guatemala.ts': ['Departments_of_Guatemala'],
  'nicaragua.ts': ['Departments_of_Nicaragua'],
  'honduras.ts': ['Departments_of_Honduras'],
  'dominican-republic.ts': ['Provinces_of_the_Dominican_Republic'],
  'brazil.ts': ['Federative_units_of_Brazil'],
  'peru.ts': ['Regions_of_Peru'],
  'bolivia.ts': ['Departments_of_Bolivia'],
  'paraguay.ts': ['Departments_of_Paraguay']
};

async function run() {
  for (const [file, wikiPages] of Object.entries(targets)) {
    const flagSet = new Set();
    
    for (const wikiPage of wikiPages) {
       console.log(`\nFetching ${wikiPage}...`);
       try {
         const res = await fetch(`https://en.wikipedia.org/wiki/${wikiPage}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
         const html = await res.text();
         
         const matches = html.matchAll(/\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+(?:\.svg|\.png|\.jpg|\.PNG|\.JPG))/g);
         for (const m of matches) {
            const decoded = decodeURIComponent(m[1]);
            if (decoded.toLowerCase().includes('flag') || decoded.toLowerCase().includes('bandera') || decoded.toLowerCase().includes('bandeira') || decoded.toLowerCase().includes('vlag')) {
               flagSet.add(decoded);
            }
         }
       } catch (e) {
         console.log('Error fetching', wikiPage);
       }
    }
    
    const flags = Array.from(flagSet);
    console.log(`Found ${flags.length} flags on Wikipedia for ${file}`);
    
    // Read local file
    const filePath = path.join('src/data/provinces', file);
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    const regex = /name:\s*['"]([^'"]+)['"][\s\S]*?image:\s*['"]([^'"]+)['"]/g;
    for (const match of content.matchAll(regex)) {
      const name = match[1];
      const img = match[2];
      
      const searchName = name.toLowerCase().replace(/province|state|department|region|autonomous|\(.*\)/g, '').trim();
      let bestMatch = null;
      let bestScore = 0;
      
      for (const f of flags) {
         const fName = f.replace(/Flag_of_|Bandera_de_la_Provincia_de_|Bandera_de_la_Provincia_del_|Bandera_de_|Bandera_del_Departamento_de_|Bandera_|Bandeira_do_|Bandeira_de_|\.svg|\.png|\.jpg/ig, '').replace(/_/g, ' ').trim().toLowerCase();
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
