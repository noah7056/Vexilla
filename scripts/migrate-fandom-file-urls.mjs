// One-time repair: rewrite Fandom file-page image URLs in src/data to the
// direct static.wikia.nocookie.net file URLs (Special:FilePath is 403 for
// cross-site embeds, so page-style links no longer load as images).
// Usage: node scripts/migrate-fandom-file-urls.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const DATA_DIR = 'src/data';
const UA = 'VexillaBot/1.0 (bundled flag repair; contact via repo)';

function parseFandomFileUrl(url) {
  const m = url.match(/^https?:\/\/([^/]+)\/wiki\/(.+)$/i);
  if (!m) return null;
  const host = m[1].toLowerCase();
  if (!host.endsWith('.fandom.com')) return null;
  const wiki = host.slice(0, -'.fandom.com'.length);
  if (!wiki) return null;
  const rest = m[2];
  const qi = rest.indexOf('?file=');
  if (qi >= 0) {
    const file = decode(rest.slice(qi + '?file='.length).split('&')[0]);
    return file ? { wiki, file } : null;
  }
  if (/^File:/i.test(rest)) {
    const file = decode(rest.slice('File:'.length).split('?')[0].split('#')[0]);
    return file ? { wiki, file } : null;
  }
  const sp = rest.match(/^Special:(?:FilePath|Redirect\/file)\/(.+)$/i);
  if (sp) {
    const file = decode(sp[1].split('?')[0].split('#')[0]);
    return file ? { wiki, file } : null;
  }
  return null;
}

function decode(s) {
  try {
    return decodeURIComponent(s).trim();
  } catch {
    return s.trim();
  }
}

function collectFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectFiles(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

async function resolveDirect({ wiki, file }) {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${file}`,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    formatversion: '2',
  });
  const res = await fetch(`https://${wiki}.fandom.com/api.php?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  const json = await res.json();
  const pages = json?.query?.pages;
  const direct = Array.isArray(pages) ? pages[0]?.imageinfo?.[0]?.url : null;
  if (!direct || !direct.startsWith('http')) throw new Error('no imageinfo url (missing file?)');
  return direct;
}

async function verifyImage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/*,*/*',
      Referer: 'https://localhost:5173/',
    },
  });
  const ct = res.headers.get('content-type') || '';
  await res.arrayBuffer().catch(() => null);
  return { status: res.status, contentType: ct };
}

const files = collectFiles(DATA_DIR);
const urlRe = /https?:\/\/[A-Za-z0-9-]+\.fandom\.com\/wiki\/[^'"`\s)]+/g;
const hits = new Map(); // url -> Set<file>
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const m of content.matchAll(urlRe)) {
    const ref = parseFandomFileUrl(m[0]);
    if (!ref) continue;
    if (!hits.has(m[0])) hits.set(m[0], new Set());
    hits.get(m[0]).add(f);
  }
}

console.log(`Found ${hits.size} unique Fandom file-page URLs in ${files.length} files.`);
const results = [];
for (const [url, inFiles] of hits) {
  const ref = parseFandomFileUrl(url);
  try {
    const direct = await resolveDirect(ref);
    const check = await verifyImage(direct);
    const ok = check.status === 200 && check.contentType.startsWith('image');
    results.push({ url, direct, ok, check, inFiles: [...inFiles] });
    console.log(`${ok ? 'OK  ' : 'WARN'} ${url}\n     -> ${direct} [${check.status} ${check.contentType}]`);
  } catch (e) {
    results.push({ url, direct: null, ok: false, error: e.message, inFiles: [...inFiles] });
    console.log(`FAIL ${url}\n     -> ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 300)); // be polite to the API
}

if (WRITE) {
  let changed = 0;
  for (const r of results) {
    if (!r.ok) continue;
    for (const f of r.inFiles) {
      const content = fs.readFileSync(f, 'utf8');
      if (!content.includes(r.url)) continue;
      fs.writeFileSync(f, content.split(r.url).join(r.direct));
      changed++;
    }
  }
  console.log(`\nRewrote ${changed} file occurrence(s). Re-run without --write to confirm zero remaining.`);
} else {
  console.log('\nDry run. Re-run with --write to apply.');
}
