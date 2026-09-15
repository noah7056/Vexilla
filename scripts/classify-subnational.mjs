/**
 * High-precision adminType backfill for built-in flag data files.
 *
 * Rules mirror `src/lib/subnational.ts#classifyAdminType` (single-signal only:
 * exactly one of council/municipality/county/district/... fires across the
 * entry name + image filename). Parent regions are NEVER inferred.
 *
 * Usage:
 *   node scripts/classify-subnational.mjs            # dry run, prints report
 *   node scripts/classify-subnational.mjs --write    # writes adminType into files
 *
 * Only touches entries that lack `adminType`. US state entries get 'state'.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROVINCES_DIR = path.join(ROOT, 'src', 'data', 'provinces');
const US_STATES_FILE = path.join(ROOT, 'src', 'data', 'countries', 'us-states.ts');

const SIGNAL_PATTERNS = [
  ['council', [/\bcouncil\b/i]],
  ['municipality', [/\bmunicip\w*/i]],
  ['county', [/\bcounty\b/i, /\bcounties\b/i]],
  ['district', [/\bdistrict\b/i]],
  ['parish', [/\bparish\b/i]],
  ['canton', [/\bcanton\b/i]],
  ['governorate', [/\bgovernorate\b/i]],
  ['province', [/\bprovince\b/i]],
  ['state', [/\bstate\b/i]],
  ['region', [/\bregion\b/i]],
  ['territory', [/\bterritor\w*/i]],
  ['department', [/\bdepartment\b/i]],
  ['prefecture', [/\bprefecture\b/i]],
  ['town', [/\btown\b/i]],
  ['village', [/\bvillage\b/i]],
  ['city', [/\bcity\b/i]],
];

function imageFilename(image) {
  const raw = String(image || '');
  if (!raw) return '';
  if (!raw.includes('/')) return raw.split('?')[0];
  const segs = raw.split('?')[0].split('/');
  for (let i = segs.length - 1; i >= 0; i--) {
    if (/\.(svg|png|jpe?g|webp|gif|tif?f|bmp)$/i.test(segs[i])) return segs[i];
  }
  return segs[segs.length - 1] || '';
}

function classify(name, image) {
  const hayName = ` ${name || ''} `;
  if (/\b(municipal|city|town|village|county|district|regional)\s+council\b/i.test(hayName)) {
    return { adminType: 'council', confident: true, reason: 'name contains "<unit> council"' };
  }
  const imgFile = imageFilename(image);
  const hayImg = ` ${imgFile.replace(/[_-]+/g, ' ')} `;
  const fired = new Map();
  for (const [type, patterns] of SIGNAL_PATTERNS) {
    for (const re of patterns) {
      if (re.test(hayName)) {
        fired.set(type, `name matches ${re}`);
        break;
      }
    }
    if (!fired.has(type)) {
      for (const re of patterns) {
        if (re.test(hayImg)) {
          fired.set(type, `image filename matches ${re}`);
          break;
        }
      }
    }
  }
  if (fired.size === 1) {
    const [[type, reason]] = Array.from(fired.entries());
    return { adminType: type, confident: true, reason };
  }
  if (fired.size === 0) return { confident: false, reason: 'no signal' };
  return { confident: false, reason: `ambiguous: ${Array.from(fired.keys()).join('+')}` };
}

function extractStringField(block, field) {
  const m = block.match(new RegExp(`${field}\\s*:\\s*(['"\`])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`));
  return m ? m[2] : undefined;
}

/** Split a createXFlags([...]) array body into top-level {...} entry blocks. */
function splitEntries(arrayBody) {
  const entries = [];
  let depth = 0;
  let start = -1;
  let inStr = null;
  let prev = '';
  for (let i = 0; i < arrayBody.length; i++) {
    const ch = arrayBody[i];
    if (inStr) {
      if (ch === inStr && prev !== '\\') inStr = null;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
    } else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        entries.push({ block: arrayBody.slice(start, i + 1), start, end: i + 1 });
        start = -1;
      }
    }
    prev = ch;
  }
  return entries;
}

function processFile(filePath, { write, defaultType }) {
  const src = fs.readFileSync(filePath, 'utf8');
  const arrStart = src.indexOf('[');
  const arrEnd = src.lastIndexOf(']');
  if (arrStart === -1 || arrEnd === -1 || arrEnd <= arrStart) {
    return { file: filePath, scanned: 0, tagged: [], skipped: [], error: 'no array found' };
  }
  const head = src.slice(0, arrStart + 1);
  const body = src.slice(arrStart + 1, arrEnd);
  const tail = src.slice(arrEnd);
  const entries = splitEntries(body);
  const tagged = [];
  const skipped = [];
  let out = head;
  let cursor = 0;

  for (const e of entries) {
    out += body.slice(cursor, e.start);
    const name = extractStringField(e.block, 'name');
    if (!name) {
      skipped.push({ reason: 'no name' });
      out += e.block;
      cursor = e.end;
      continue;
    }
    if (/\badminType\s*:/.test(e.block)) {
      skipped.push({ name, reason: 'already tagged' });
      out += e.block;
      cursor = e.end;
      continue;
    }
    const image = extractStringField(e.block, 'image') || extractStringField(e.block, 'imageUrl') || '';
    let result = classify(name, image);
    if (!result.confident && defaultType) {
      result = { adminType: defaultType, confident: true, reason: `file default (${defaultType})` };
    }
    if (!result.confident) {
      skipped.push({ name, reason: result.reason });
      out += e.block;
      cursor = e.end;
      continue;
    }
    tagged.push({ name, adminType: result.adminType, reason: result.reason });
    if (write) {
      const nameLine = e.block.match(/^([ \t]*)name\s*:\s*(['"`]).*$/m);
      if (nameLine) {
        const indent = nameLine[1];
        const patched = e.block.replace(
          /^([ \t]*)name\s*:\s*(['"`]).*$/m,
          (m) => `${m}\n${indent}adminType: '${result.adminType}',`
        );
        out += patched;
      } else {
        out += e.block;
        tagged[tagged.length - 1].writeSkipped = true;
      }
    } else {
      out += e.block;
    }
    cursor = e.end;
  }
  out += body.slice(cursor) + tail;

  if (write && tagged.some((t) => !t.writeSkipped)) {
    fs.writeFileSync(filePath, out, 'utf8');
  }
  return { file: filePath, scanned: entries.length, tagged, skipped };
}

const WRITE = process.argv.includes('--write');
const targets = fs
  .readdirSync(PROVINCES_DIR)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'utils.ts')
  .map((f) => ({ path: path.join(PROVINCES_DIR, f), defaultType: undefined }));
if (fs.existsSync(US_STATES_FILE)) {
  targets.push({ path: US_STATES_FILE, defaultType: 'state' });
}

let totalScanned = 0;
let totalTagged = 0;
const byType = new Map();
const ambiguousSamples = [];
for (const t of targets) {
  const r = processFile(t.path, { write: WRITE, defaultType: t.defaultType });
  totalScanned += r.scanned;
  totalTagged += r.tagged.length;
  for (const tag of r.tagged) {
    byType.set(tag.adminType, (byType.get(tag.adminType) || 0) + 1);
  }
  for (const s of r.skipped) {
    if (s.reason && s.reason.startsWith('ambiguous') && ambiguousSamples.length < 20) {
      ambiguousSamples.push(`${path.basename(t.path)}: ${s.name} (${s.reason})`);
    }
  }
  const rel = path.relative(ROOT, t.path);
  if (r.tagged.length > 0) {
    console.log(`${WRITE ? 'WROTE' : 'WOULD TAG'} ${r.tagged.length}/${r.scanned} in ${rel}`);
  }
}

console.log('\n--- summary ---');
console.log(`files: ${targets.length}, entries scanned: ${totalScanned}`);
console.log(`confident tags: ${totalTagged} ${WRITE ? '(written)' : '(dry run — rerun with --write to apply)'}`);
console.log('by type:', Object.fromEntries(byType));
if (ambiguousSamples.length > 0) {
  console.log('ambiguous samples (left unspecified):');
  ambiguousSamples.forEach((s) => console.log(`  - ${s}`));
}
