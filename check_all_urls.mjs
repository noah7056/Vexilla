import fs from 'fs';
import path from 'path';

function extractFlags() {
  const dir = 'src/data/provinces';
  let flags = [];
  
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.endsWith('.ts') && f !== 'index.ts' && f !== 'utils.ts') {
      const p = path.join(dir, f);
      const content = fs.readFileSync(p, 'utf8');
      
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
console.log(`Checking ${flags.length} local flag images...`);

async function checkUrls() {
  const badUrls = [];
  const batchSize = 100;
  for (let i = 0; i < flags.length; i += batchSize) {
    const batch = flags.slice(i, i + batchSize);
    await Promise.all(batch.map(async (f) => {
      const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${f.image}`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (!res.ok && res.status !== 429) {
            const res2 = await fetch(url);
            if (!res2.ok && res2.status !== 429) badUrls.push({ ...f, status: res2.status });
        }
      } catch (e) {
        badUrls.push({ ...f, status: e.message });
      }
    }));
    process.stdout.write('.');
  }
  console.log('\nBad URLs:');
  console.log(JSON.stringify(badUrls, null, 2));
}

checkUrls();
