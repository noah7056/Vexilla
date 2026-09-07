import fs from 'fs';
import path from 'path';

function extractFlags() {
  const dir = 'src/data/provinces';
  let flags = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.endsWith('.ts') && f !== 'index.ts' && f !== 'utils.ts') {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const regex = /image:\s*['"]([^'"]+)['"]/g;
      for (const match of content.matchAll(regex)) {
        if (!match[1].startsWith('http')) {
           flags.push({ file: f, image: match[1] });
        }
      }
    }
  }
  return flags;
}

const flags = extractFlags();
console.log(`Checking ${flags.length} images via API...`);

async function check() {
  const badFlags = [];
  // MediaWiki allows up to 50 titles per request
  for (let i = 0; i < flags.length; i += 50) {
    const batch = flags.slice(i, i + 50);
    const titles = batch.map(f => `File:${f.image}`).join('|');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&format=json`;
    
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CoolApp/1.0 (https://example.com)' } });
      const json = await res.json();
      
      const pages = json.query?.pages || {};
      for (const pageId in pages) {
        if (pages[pageId].missing !== undefined) {
          const title = pages[pageId].title.replace(/^File:/, '');
          const original = batch.find(f => f.image.replace(/_/g, ' ') === title.replace(/_/g, ' ') || decodeURIComponent(f.image).replace(/_/g, ' ') === title.replace(/_/g, ' '));
          if (original) {
            badFlags.push(original);
          } else {
             // Try strict matching
             badFlags.push({ title, batchItem: true });
          }
        }
      }
    } catch (e) {
      console.log('Error fetching batch:', e.message);
    }
    process.stdout.write('.');
  }
  
  console.log('\nMissing files:');
  console.log(JSON.stringify(badFlags, null, 2));
}

check();
