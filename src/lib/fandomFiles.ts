/**
 * Fandom file-URL resolver.
 *
 * Background: Fandom's CDN currently answers the `Special:FilePath` redirect
 * endpoint with 403 for cross-site image embeds, so stored links of the form
 *   https://<wiki>.fandom.com/wiki/<Page>?file=<File>
 *   https://<wiki>.fandom.com/wiki/File:<File>
 *   https://<wiki>.fandom.com/wiki/Special:FilePath/<File>
 * can no longer be used (or derived) as <img> sources. The direct file URLs
 * on static.wikia.nocookie.net DO still allow hotlinking.
 *
 * This module resolves those page-style links to direct file URLs through
 * Fandom's MediaWiki API (`origin=*` returns `Access-Control-Allow-Origin: *`,
 * so plain browser GETs are allowed). Results are cached in memory and
 * persisted to localStorage, and subscribers are notified when new URLs land
 * so views holding placeholder pins can re-render.
 */

export interface FandomFileRef {
  wiki: string;
  file: string;
}

const LS_KEY = 'vexilla-fandom-file-urls-v1';

/** Extract a (wiki, file) reference from a Fandom file-page style URL. */
export function parseFandomFileUrl(url: string | undefined | null): FandomFileRef | null {
  if (!url) return null;
  const trimmed = url.trim();
  const m = trimmed.match(/^https?:\/\/([^\/]+)\/wiki\/(.+)$/i);
  if (!m) return null;
  const host = m[1].toLowerCase();
  if (!host.endsWith('.fandom.com')) return null;
  const wiki = host.slice(0, -'.fandom.com'.length);
  if (!wiki) return null;
  const rest = m[2];

  // /wiki/<Anything>?file=<File>
  const fileParam = rest.indexOf('?file=');
  if (fileParam >= 0) {
    const file = safeDecode(rest.slice(fileParam + '?file='.length).split('&')[0]);
    return file ? { wiki, file } : null;
  }
  // /wiki/File:<File>
  if (/^File:/i.test(rest)) {
    const file = safeDecode(rest.slice('File:'.length).split('?')[0].split('#')[0]);
    return file ? { wiki, file } : null;
  }
  // /wiki/Special:FilePath/<File> or /wiki/Special:Redirect/file/<File>
  const sp = rest.match(/^Special:(?:FilePath|Redirect\/file)\/(.+)$/i);
  if (sp) {
    const file = safeDecode(sp[1].split('?')[0].split('#')[0]);
    return file ? { wiki, file } : null;
  }
  return null;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s).trim();
  } catch {
    return s.trim();
  }
}

function cacheKey(ref: FandomFileRef): string {
  // MediaWiki treats spaces and underscores in file names as equivalent.
  return `${ref.wiki.toLowerCase()}/${ref.file.replace(/ /g, '_')}`;
}

const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
const listeners = new Set<() => void>();
let loaded = false;

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && v.startsWith('http')) memCache.set(k, v);
      }
    }
  } catch {
    // Corrupt cache: ignore and rebuild.
  }
}

function persist(): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Object.fromEntries(memCache)));
  } catch {
    // Storage full or unavailable: memory cache still works for the session.
  }
}

function notify(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // Listener errors must not break resolution for everyone else.
    }
  });
}

/** Subscribe to cache updates (new resolutions). Returns an unsubscribe fn. */
export function subscribeFandomCache(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Synchronous cache lookup. Returns null on miss (call resolve... to fill). */
export function getCachedFandomFileUrl(ref: FandomFileRef): string | null {
  ensureLoaded();
  return memCache.get(cacheKey(ref)) ?? null;
}

/** Resolve to a direct static.wikia.nocookie.net URL (cached, deduped). */
export function resolveFandomFileUrl(ref: FandomFileRef): Promise<string | null> {
  ensureLoaded();
  const k = cacheKey(ref);
  const hit = memCache.get(k);
  if (hit) return Promise.resolve(hit);
  const f = inflight.get(k);
  if (f) return f;
  const p = fetchDirectFileUrl(ref).then((url) => {
    inflight.delete(k);
    if (url) {
      memCache.set(k, url);
      persist();
      notify();
    }
    return url;
  }).catch(() => {
    inflight.delete(k);
    return null;
  });
  inflight.set(k, p);
  return p;
}

async function fetchDirectFileUrl(ref: FandomFileRef): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${ref.file}`,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  // NOTE: no custom headers — this must stay a CORS-simple GET.
  const res = await fetch(`https://${ref.wiki}.fandom.com/api.php?${params.toString()}`);
  if (!res.ok) return null;
  const json = await res.json();
  const pages = json?.query?.pages;
  const info = Array.isArray(pages) ? pages[0]?.imageinfo?.[0] : undefined;
  const direct = typeof info?.url === 'string' ? info.url : null;
  return direct && direct.startsWith('http') ? direct : null;
}
