import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import Supercluster from 'supercluster';
import { Map as MapIcon, Search, LocateFixed, CircleDashed, Layers, MapPin, ExternalLink, Eye, X, XCircle, Star, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, RotateCcw } from 'lucide-react';
import {
  Flag,
  FlagProgress,
  Category,
  Continent,
  FlagStatus,
  MasteryLevel,
  ALL_CONTINENTS,
  ALL_STATUSES,
  getFlagMasteryLevel,
} from '../types';
import { getFlagImageUrl } from '../data/flags';
import { useFlags } from '../contexts/FlagsContext';
import { useAdmin } from '../contexts/AdminContext';
import { useFavorites } from '../hooks/useFavorites';
import { consumePendingFocus, onAtlasFocus, setPendingFocus } from '../lib/atlasBus';
import { TILE_ATTRIBUTION, atlasTileUrl } from '../lib/mapTiles';
import { GeoPoint, useGeoBuckets } from '../hooks/useGeoFlags';
import { FlagImage } from './FlagImage';
import { FlagModal } from './FlagModal';
import { FlagEditorModal } from './FlagEditorModal';
import { CategoryFilterChips } from './CategoryFilterChips';
import { AdditionalFiltersBar } from './AdditionalFiltersBar';

interface AtlasViewProps {
  progress: Record<string, FlagProgress>;
}

type MapPoint = GeoPoint;

const ATLAS_TOGGLES_KEY = 'vexilla-atlas-toggles';

function loadAtlasToggles(): { showApprox: boolean; showClusters: boolean } {
  try {
    const raw = localStorage.getItem(ATLAS_TOGGLES_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        showApprox: p.showApprox !== false,
        showClusters: p.showClusters !== false,
      };
    }
  } catch {}
  return { showApprox: true, showClusters: true };
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function PlaceRow({ p, active, onPick }: { key?: string | number; p: MapPoint; active: boolean; onPick: (f: Flag) => void }) {
  return (
    <button
      onClick={() => onPick(p.flag)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60'}`}
    >
      <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
      <span className="truncate min-w-0 flex-1">{p.flag.name}</span>
      {p.approx && <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400 shrink-0">approx</span>}
    </button>
  );
}

/** Tiny pin thumbnail: downscale CDN/Wikimedia thumbs so clusters stay cheap (no Firebase involved). */
function pinThumb(flag: Flag): string {
  const url = getFlagImageUrl(flag);
  return url
    .replace('flagcdn.com/w320', 'flagcdn.com/w80')
    .replace('flagcdn.com/w1280', 'flagcdn.com/w80')
    .replace('width=320', 'width=80')
    .replace('width=800', 'width=80');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Cached rectangular pin icons. Creating a new L.DivIcon per marker per render
 * forces Leaflet to replace every pin's DOM (and reload every image) on any
 * state change — that was a major source of the lag/crash. Cache by flag +
 * visual state so unchanged pins keep their DOM nodes.
 */
const iconCache = new Map<string, L.DivIcon>();
function chipIcon(flag: Flag, selected: boolean, approx: boolean, dark: boolean): L.DivIcon {
  const cacheKey = `${flag.id}|${selected ? 1 : 0}|${approx ? 1 : 0}|${dark ? 1 : 0}`;
  const hit = iconCache.get(cacheKey);
  if (hit) return hit;
  // Rectangular 3:2 mini-flag so contents aren't cropped like in a circle.
  // Theme-aware: thin soft border on dark basemaps instead of stark white.
  const border = selected
    ? '#6366f1'
    : approx
      ? '#f59e0b'
      : dark ? 'rgba(228,228,231,.75)' : '#ffffff';
  const shadow = selected
    ? 'box-shadow:0 0 0 3px rgba(99,102,241,.55),0 1px 5px rgba(0,0,0,.45);'
    : 'box-shadow:0 1px 4px rgba(0,0,0,.35);';
  const icon = L.divIcon({
    className: 'vexilla-pin',
    html: `<span title="${esc(flag.name)}" style="display:block;width:36px;height:24px;border-radius:6px;overflow:hidden;border:${selected ? '2px' : '1.5px'} solid ${border};${selected ? '' : approx ? 'border-style:dashed; ' : ''}${shadow}background:${dark ? '#27272a' : '#fff'};cursor:pointer"><img src="${esc(pinThumb(flag))}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none" loading="lazy"/></span>`,
    iconSize: [36, 24],
    iconAnchor: [18, 12],
    popupAnchor: [0, -10],
  });
  // Bound the cache: ~1 entry per visible visual state; drop oldest half past 3k.
  if (iconCache.size > 3000) {
    const keys = Array.from(iconCache.keys());
    for (let i = 0; i < 1500; i++) iconCache.delete(keys[i]);
  }
  iconCache.set(cacheKey, icon);
  return icon;
}

const clusterCache = new Map<number, L.DivIcon>();
function clusterIcon(count: number, dark: boolean): L.DivIcon {
  // Bucket counts so the cache stays tiny (a few dozen entries max).
  const bucket = count < 10 ? count : count < 25 ? 25 : count < 50 ? 50 : count < 100 ? 100 : count < 250 ? 250 : 500;
  const cacheKey = bucket * 2 + (dark ? 1 : 0);
  const hit = clusterCache.get(cacheKey);
  if (hit) return hit;
  const icon = L.divIcon({
    className: 'vexilla-cluster',
    html: `<span style="display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;padding:0 9px;border-radius:9999px;background:${dark ? '#4338ca' : '#4f46e5'};color:#fff;font-weight:800;font-size:13px;border:1.5px solid ${dark ? 'rgba(228,228,231,.8)' : '#fff'};box-shadow:0 1px 6px rgba(0,0,0,.4);cursor:pointer">${count}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  clusterCache.set(cacheKey, icon);
  return icon;
}

/**
 * Syncs map viewport back to React for supercluster queries.
 * Debounced + change-guarded: without this, every moveend/zoomend triggered a
 * setState → re-render → re-subscribe → emit loop that froze the page.
 */
function ViewportTracker({ onChange }: { onChange: (b: L.LatLngBounds, z: number) => void }) {
  const map = useMap();
  const cbRef = useRef(onChange);
  cbRef.current = onChange;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastKey = '';
    const emit = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const b = map.getBounds();
        const z = Math.round(map.getZoom());
        const key = `${b.getWest().toFixed(2)}|${b.getSouth().toFixed(2)}|${b.getEast().toFixed(2)}|${b.getNorth().toFixed(2)}|${z}`;
        if (key !== lastKey) {
          lastKey = key;
          cbRef.current(b, z);
        }
      }, 120);
    };
    // No maxBounds horizontally (infinite world looping), so gently clamp
    // only the latitude back toward inhabited land after a drag ends.
    const clampLat = () => {
      const c = map.getCenter();
      const LIM = 80;
      if (c.lat > LIM || c.lat < -LIM) {
        map.panTo([Math.max(-LIM, Math.min(LIM, c.lat)), c.lng], { animate: false });
      }
    };
    emit();
    map.on('moveend zoomend', emit);
    map.on('moveend', clampLat);
    return () => {
      map.off('moveend zoomend', emit);
      map.off('moveend', clampLat);
      if (timer) clearTimeout(timer);
    };
  }, [map]);
  return null;
}

/** Flies to the selected pin. `nonce` (not React `key`) retriggers the flight. */
function FlyTo({ lat, lon, nonce }: { lat: number; lon: number; nonce: string }) {
  const map = useMap();
  const last = useRef('');
  useEffect(() => {
    if (nonce && nonce !== last.current) {
      last.current = nonce;
      map.flyTo([lat, lon], Math.max(map.getZoom(), 5), { duration: 0.9 });
    }
  }, [lat, lon, nonce, map]);
  return null;
}

function ClusterLayer({ points, selectedId, focusNonce, dark, showClusters, onSelect }: {
  points: MapPoint[];
  selectedId: string | null;
  focusNonce: string;
  dark: boolean;
  showClusters: boolean;
  onSelect: (f: Flag) => void;
}) {
  const map = useMap();
  const [viewport, setViewport] = useState<{ bounds: L.LatLngBounds; zoom: number } | null>(null);

  // Stable callback: creating a new closure per render used to resubscribe the
  // tracker on every render and avalanche into an update loop.
  const handleViewport = useCallback((bounds: L.LatLngBounds, zoom: number) => {
    setViewport({ bounds, zoom });
  }, []);

  // Two separate indexes so sovereign / non-sovereign countries decluster early
  // (fully individual past zoom 4) and are never absorbed into province blobs.
  const { countryIndex, regionIndex } = useMemo(() => {
    const toFeature = (p: MapPoint) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
      properties: { flagId: p.flag.id },
    });
    const countryIndex = new Supercluster({ radius: 50, maxZoom: 4, minPoints: 2 });
    countryIndex.load(points.filter((p) => p.level === 'country' && !p.approx).map(toFeature));
    const regionIndex = new Supercluster({ radius: 80, maxZoom: 14, minPoints: 2 });
    regionIndex.load(points.filter((p) => !(p.level === 'country' && !p.approx)).map(toFeature));
    return { countryIndex, regionIndex };
  }, [points]);

  const byId = useMemo(() => new Map(points.map((p) => [p.flag.id, p])), [points]);

  const clusters = useMemo(() => {
    if (!viewport) return [];
    const b = viewport.bounds;
    const bbox: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const z = Math.round(viewport.zoom);
    return [
      ...countryIndex.getClusters(bbox, z).map((c) => ({ c, tag: 'c' as const })),
      ...regionIndex.getClusters(bbox, z).map((c) => ({ c, tag: 'r' as const })),
    ];
  }, [countryIndex, regionIndex, viewport]);

  // Look the pin up by flag id (the nonce is only the retrigger, not the key).
  const focusPoint = selectedId ? byId.get(selectedId) ?? null : null;

  const handlePinClick = useCallback((f: Flag) => {
    onSelect(f);
  }, [onSelect]);

  const zoomInto = useCallback((lat: number, lon: number) => {
    const z = Math.min(map.getZoom() + 2, 12);
    map.flyTo([lat, lon], z, { duration: 0.6 });
  }, [map]);

  return (
    <>
      <ViewportTracker onChange={handleViewport} />
      {focusPoint && focusNonce && <FlyTo lat={focusPoint.lat} lon={focusPoint.lon} nonce={focusNonce} />}
      {clusters.map(({ c, tag }) => {
        const [lon, lat] = c.geometry.coordinates as [number, number];
        const props = c.properties as any;
        if (props.cluster) {
          // Bubbles off: grouped flags stay invisible until you zoom in far
          // enough for them to break apart into individual pins.
          if (!showClusters) return null;
          return (
            <Marker
              key={`${tag}-${props.cluster_id}`}
              position={[lat, lon]}
              icon={clusterIcon(props.point_count, dark)}
              eventHandlers={{ click: () => zoomInto(lat, lon) }}
            />
          );
        }
        const p = byId.get(props.flagId);
        if (!p) return null;
        return (
          <Marker
            key={p.flag.id}
            position={[p.lat, p.lon]}
            icon={chipIcon(p.flag, p.flag.id === selectedId, p.approx, dark)}
            eventHandlers={{ click: () => handlePinClick(p.flag) }}
          />
        );
      })}
    </>
  );
}

/** Revalidates the Leaflet size when the aside opens/closes (grid width changes). */
function ResizeFix({ dep }: { dep: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map, dep]);
  return null;
}

export function AtlasView({ progress }: AtlasViewProps) {
  const { flags: FLAGS, getCategories } = useFlags();
  const { isAdmin } = useAdmin();
  const { favoritesSet } = useFavorites();
  // Dictionary-identical filter state so Atlas filters behave exactly like
  // the Dictionary (search + tags, categories + sub-options, continents,
  // statuses, mastery, favorites).
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(t);
  }, [search]);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [selectedContinents, setSelectedContinents] = useState<string[]>(['All']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['All']);
  const [selectedSubOptions, setSelectedSubOptions] = useState<Record<string, string[]>>({});
  const [selectedMastery, setSelectedMastery] = useState<(MasteryLevel | 'all')[]>(['all']);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<Flag | null>(null);
  const [focusNonce, setFocusNonce] = useState('');
  const [viewing, setViewing] = useState<Flag | null>(null);
  const [editing, setEditing] = useState<Flag | null>(null);
  const [showApprox, setShowApprox] = useState(() => loadAtlasToggles().showApprox);
  const [showClusters, setShowClusters] = useState(() => loadAtlasToggles().showClusters);

  // Remember the Atlas toggles when leaving and coming back to the section.
  useEffect(() => {
    try {
      localStorage.setItem(ATLAS_TOGGLES_KEY, JSON.stringify({ showApprox, showClusters }));
    } catch {}
  }, [showApprox, showClusters]);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Fullscreen map: request it on the wrapper so the toggle button stays
  // visible, then revalidate the Leaflet size once the transition lands.
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapFs, setMapFs] = useState(false);
  useEffect(() => {
    const onFs = () => {
      setMapFs(document.fullscreenElement === mapWrapRef.current);
      // The fullscreen transition animates layout: revalidate after paint
      // and again once it settles, or tiles render at the old (strip) size.
      requestAnimationFrame(() => mapRef.current?.invalidateSize());
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const toggleMapFs = () => {
    if (document.fullscreenElement === mapWrapRef.current) {
      document.exitFullscreen().catch(() => {});
    } else {
      mapWrapRef.current?.requestFullscreen().catch(() => {});
    }
  };

  // True viewport reset (the old footer button only cleared filters).
  const resetMapView = () => {
    mapRef.current?.setView([22, 8], 2);
  };

  const dynamicCatCount = useMemo(() => {
    try {
      return getCategories().length;
    } catch {
      return 10;
    }
  }, [getCategories, FLAGS]);

  const addSearchTag = (tagToAdd?: string) => {
    const val = (tagToAdd !== undefined ? tagToAdd : search).trim();
    if (val && !searchTags.includes(val)) {
      setSearchTags((prev) => [...prev, val]);
      setSearch('');
    }
  };

  const toggleCategory = (cat: Category | 'All') => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
      setSelectedSubOptions({});
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.includes('All')) return [cat];
      const exists = prev.includes(cat);
      if (exists) {
        const next = prev.filter((c) => c !== cat);
        setSelectedSubOptions((prevSub) => {
          const newSub = { ...prevSub };
          delete newSub[cat];
          return newSub;
        });
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, cat];
        if (next.length === dynamicCatCount) {
          setSelectedSubOptions({});
          return ['All'];
        }
        return next;
      }
    });
  };

  const toggleSubOption = (category: string, option: string) => {
    setSelectedSubOptions((prev) => {
      const currentList = prev[category] || [];
      const updatedList = currentList.includes(option)
        ? currentList.filter((o) => o !== option)
        : [...currentList, option];
      return { ...prev, [category]: updatedList };
    });
    setSelectedCategories((prev) => {
      if (prev.includes('All')) {
        return [category as Category];
      }
      if (!prev.includes(category as Category)) {
        return [...prev, category as Category];
      }
      return prev;
    });
  };

  const handleClearSubOptions = (cat: string) => {
    setSelectedSubOptions((prev) => {
      const newSub = { ...prev };
      delete newSub[cat];
      return newSub;
    });
  };

  const toggleMastery = (level: MasteryLevel) => {
    setSelectedMastery((prev) => {
      if (prev.includes('all') || prev.length === 0) {
        return [level];
      }
      const exists = prev.includes(level);
      if (exists) {
        const next = prev.filter((m) => m !== level);
        return next.length === 0 ? ['all'] : next;
      } else {
        const next = [...prev, level];
        return next.length === 4 ? ['all'] : next;
      }
    });
  };

  const selectAllMastery = () => {
    setSelectedMastery(['all']);
  };

  const clearAllSubmenuFilters = () => {
    setSelectedSubOptions({});
    setSelectedContinents(['All']);
    setSelectedStatuses(['All']);
    setSearchTags([]);
    setSelectedMastery(['all']);
  };

  const toggleContinent = (cont: Continent) => {
    setSelectedContinents((prev) => {
      if (prev.includes('All')) {
        return [cont];
      }
      const exists = prev.includes(cont);
      if (exists) {
        const next = prev.filter((c) => c !== cont);
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, cont];
        if (next.length === ALL_CONTINENTS.length) {
          return ['All'];
        }
        return next;
      }
    });
  };

  const toggleStatus = (st: FlagStatus | 'unspecified') => {
    setSelectedStatuses((prev) => {
      if (prev.includes('All')) {
        return [st];
      }
      const exists = prev.includes(st);
      if (exists) {
        const next = prev.filter((s) => s !== st);
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, st];
        if (next.length === ALL_STATUSES.length + 1) {
          return ['All'];
        }
        return next;
      }
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories(['All']);
    setSelectedSubOptions({});
  };
  const selectAllContinents = () => setSelectedContinents(['All']);
  const selectAllStatuses = () => setSelectedStatuses(['All']);

  const clearAllFilters = () => {
    setSearch('');
    setSearchTags([]);
    setSelectedCategories(['All']);
    setSelectedContinents(['All']);
    setSelectedStatuses(['All']);
    setSelectedSubOptions({});
    setSelectedMastery(['all']);
    setShowFavoritesOnly(false);
  };

  const isMasteryCustom = !selectedMastery.includes('all') && selectedMastery.length > 0 && selectedMastery.length < 4;

  const hasCustomFilters =
    search.trim() !== '' ||
    searchTags.length > 0 ||
    !selectedCategories.includes('All') ||
    !selectedContinents.includes('All') ||
    !selectedStatuses.includes('All') ||
    isMasteryCustom ||
    Object.values(selectedSubOptions as Record<string, string[]>).some((arr) => arr.length > 0) ||
    showFavoritesOnly;

  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const focusOn = useCallback((f: Flag) => {
    setSelected(f);
    setPanelCollapsed(false);
    setFocusNonce(`${f.id}@${Date.now()}`);
  }, []);

  // Jump here from Dictionary cards / FlagModal "Show on map".
  useEffect(() => onAtlasFocus((flagId) => {
    const f = FLAGS.find((x) => x.id === flagId);
    if (f) focusOn(f);
    else setPendingFocus(flagId); // cloud flag not in cache yet — retry below
  }), [FLAGS, focusOn]);

  // "Show on map" often fires while Atlas is still lazy-loading, so the event
  // above is missed. The id is stashed in atlasBus — consume it on mount and
  // whenever the flag list grows (cloud fetch landing after mount).
  useEffect(() => {
    const id = consumePendingFocus();
    if (!id) return;
    const f = FLAGS.find((x) => x.id === id);
    if (f) focusOn(f);
    else setPendingFocus(id);
  }, [FLAGS, focusOn]);

  // Keep the selection fresh after edits (admin sets coordinates in editor).
  useEffect(() => {
    if (!selected) return;
    const fresh = FLAGS.find((x) => x.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [FLAGS, selected]);

  // Base pool restricted by Category & Sub-options (mirrors Dictionary).
  const categoryFlagsPool = useMemo(() => {
    return FLAGS.filter((flag) => {
      const matchesCat = selectedCategories.includes('All') || selectedCategories.includes(flag.category);
      if (!matchesCat) return false;

      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Pirate Flags', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSubOptions = selectedSubOptions[flag.category] || [];
        if (activeSubOptions.length > 0) {
          if (!flag.country || !activeSubOptions.includes(flag.country)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [selectedCategories, selectedSubOptions, FLAGS]);

  // Full Dictionary-equivalent filtering, then geocoded for the map.
  const filteredFlags = useMemo(() => {
    const liveQuery = debouncedSearch.trim().toLowerCase();
    const activeTerms = [
      ...searchTags.filter(Boolean).map((t) => t.toLowerCase()),
      ...(liveQuery ? [liveQuery] : []),
    ];

    const activeMasteryList = selectedMastery.filter((m): m is MasteryLevel => m !== 'all');
    const isMasteryActive = activeMasteryList.length > 0 && activeMasteryList.length < 4;

    return FLAGS.filter((flag) => {
      if (showFavoritesOnly && !favoritesSet.has(flag.id)) {
        return false;
      }

      const matchesSearch =
        activeTerms.length === 0 ||
        activeTerms.every((q) => {
          return (
            (flag.name && flag.name.toLowerCase().includes(q)) ||
            (flag.code && flag.code.toLowerCase().includes(q)) ||
            (flag.continent && flag.continent.toLowerCase().includes(q)) ||
            (flag.category && flag.category.toLowerCase().includes(q)) ||
            (flag.status && flag.status.toLowerCase().includes(q)) ||
            (flag.country && flag.country.toLowerCase().includes(q)) ||
            (flag.creator && flag.creator.toLowerCase().includes(q)) ||
            (flag.aliases && flag.aliases.some((alias) => alias && alias.toLowerCase().includes(q))) ||
            (flag.tags && flag.tags.some((tag) => tag && tag.toLowerCase().includes(q)))
          );
        });

      const matchesCat = selectedCategories.includes('All') || selectedCategories.includes(flag.category);
      const isGlobalCat = flag.category === 'Fictional' || flag.category === 'LGBTQI+' || flag.category === 'Languages' || flag.category === 'Pirate Flags' || flag.category === 'Organizations' || flag.category === 'Concepts';
      const matchesCont = selectedContinents.includes('All') || isGlobalCat || (flag.continent ? selectedContinents.includes(flag.continent) : false);

      const matchesStatus =
        selectedStatuses.includes('All') ||
        selectedStatuses.length === 0 ||
        (Boolean(flag.status) && selectedStatuses.includes(flag.status as string)) ||
        (!flag.status && selectedStatuses.includes('unspecified'));

      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Pirate Flags', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSubOptions = selectedSubOptions[flag.category] || [];
        if (activeSubOptions.length > 0) {
          if (!flag.country || !activeSubOptions.includes(flag.country)) {
            return false;
          }
        }
      }

      if (isMasteryActive) {
        const flagLevel = getFlagMasteryLevel(flag.id, progress);
        if (!activeMasteryList.includes(flagLevel)) {
          return false;
        }
      }

      return matchesSearch && matchesCat && matchesCont && matchesStatus;
    });
  }, [debouncedSearch, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedSubOptions, selectedMastery, showFavoritesOnly, favoritesSet, progress, FLAGS]);

  const buckets = useGeoBuckets(filteredFlags);
  const { points, unmapped } = useMemo(() => {
    const pts: GeoPoint[] = [
      ...buckets.mapped.map((e) => ({ flag: e.flag, lat: e.geo.lat, lon: e.geo.lon, approx: false as const, level: e.geo.geoLevel })),
      ...(showApprox ? buckets.approx.map((e) => ({ flag: e.flag, lat: e.geo.lat, lon: e.geo.lon, approx: true as const, level: e.geo.geoLevel })) : []),
    ];
    return { points: pts, unmapped: buckets.unmapped };
  }, [buckets, showApprox]);

  // Nearby panel: true nearest-8 by distance to the selection, not first-8.
  const nearby = useMemo(() => {
    if (!selected) return [];
    const self = points.find((p) => p.flag.id === selected.id);
    if (!self) return points.slice(0, 8);
    return points
      .filter((p) => p.flag.id !== self.flag.id)
      .map((p) => ({ p, d: haversineKm(self.lat, self.lon, p.lat, p.lon) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map((x) => x.p);
  }, [points, selected]);

  const tileUrl = atlasTileUrl(isDark);

  // The aside only exists for a selection or pending locations — otherwise
  // the map takes the full width. The user can also collapse it manually.
  const showAside = selected !== null || unmapped.length > 0;
  const asideVisible = showAside && !panelCollapsed;

  const mappedCount = points.filter((p) => !p.approx).length;
  const approxCount = points.filter((p) => p.approx).length;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MapIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Atlas
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {mappedCount} pinned · {approxCount} approximate · {unmapped.length} need location · tiles by OpenStreetMap/CARTO
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={showApprox} onChange={(e) => setShowApprox(e.target.checked)} className="accent-indigo-600" />
            <CircleDashed className="w-3.5 h-3.5" /> Show approximate
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer" title="Hide the numbered group bubbles — grouped flags stay invisible until you zoom in">
            <input type="checkbox" checked={showClusters} onChange={(e) => setShowClusters(e.target.checked)} className="accent-indigo-600" />
            <Layers className="w-3.5 h-3.5" /> Group bubbles
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={searchTags.length > 0 ? 'Add descriptor or term (e.g. green, bird, star)...' : 'Search by name, code, alias, or tag...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSearchTag();
                }
              }}
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  title="Clear text input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => addSearchTag()}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                  title="Add as stacked filter tag"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 ${
              showFavoritesOnly
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </button>

          {hasCustomFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer"
              title="Clear all active filters and search terms"
            >
              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Clear All
            </button>
          )}
        </div>

        <CategoryFilterChips
          selectedCategories={selectedCategories as any}
          onToggleCategory={toggleCategory}
          onSelectAllCategories={selectAllCategories}
          selectedSubOptions={selectedSubOptions}
          onToggleSubOption={toggleSubOption}
          onClearSubOptions={handleClearSubOptions}
          flagsPool={FLAGS}
          title="Categories"
          showAllOption={true}
        />

        <AdditionalFiltersBar
          flagsPool={categoryFlagsPool}
          selectedContinents={selectedContinents as any}
          onToggleContinent={toggleContinent}
          onSelectAllContinents={selectAllContinents}
          selectedStatuses={selectedStatuses as any}
          onToggleStatus={toggleStatus}
          onSelectAllStatuses={selectAllStatuses}
          selectedTags={searchTags}
          onToggleTag={(tag) => setSearchTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))}
          onClearTags={() => setSearchTags([])}
          selectedMastery={selectedMastery}
          onToggleMastery={toggleMastery}
          onSelectAllMastery={selectAllMastery}
          progress={progress}
          selectedSubOptions={selectedSubOptions}
          onRemoveSubOption={(cat, opt) => {
            setSelectedSubOptions((prev) => {
              const newOpts = (prev[cat] || []).filter((o) => o !== opt);
              return { ...prev, [cat]: newOpts };
            });
          }}
          onClearAllSubmenuFilters={clearAllSubmenuFilters}
        />
      </div>

      <div className={`grid grid-cols-1 ${asideVisible ? 'lg:grid-cols-3' : ''} gap-4`}>
        <div ref={mapWrapRef} className={`vexilla-fs ${asideVisible ? 'lg:col-span-2' : ''} rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm relative ${mapFs ? 'bg-white dark:bg-zinc-900 border-0 rounded-none' : ''}`}>
          <MapContainer
            ref={mapRef}
            center={[22, 8]}
            zoom={2}
            minZoom={2}
            worldCopyJump
            style={{ height: mapFs ? '100vh' : '62vh', minHeight: mapFs ? 0 : 380, width: '100%', zIndex: 0 }}
          >
            <TileLayer attribution={TILE_ATTRIBUTION} url={tileUrl} />
            <ResizeFix dep={asideVisible} />
            <ClusterLayer points={points} selectedId={selected?.id || null} focusNonce={focusNonce} dark={isDark} showClusters={showClusters} onSelect={focusOn} />
          </MapContainer>
          {/* In-map controls sit at z-20: above the Leaflet canvas (own
              stacking context) but below open filter menus — those live in
              z-30 chip wrappers, and ties/above would paint over them. */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              onClick={resetMapView}
              title="Reset map view"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/95 dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset view</span>
            </button>
            <button
              onClick={toggleMapFs}
              title={mapFs ? 'Exit fullscreen (Esc)' : 'Fullscreen map'}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/95 dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors"
            >
              {mapFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{mapFs ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
          {showAside && (
            <button
              onClick={() => setPanelCollapsed((v) => !v)}
              title={panelCollapsed ? 'Show side panel' : 'Hide side panel'}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 py-3 px-1 rounded-l-xl bg-white/95 dark:bg-zinc-800/95 border border-r-0 border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {panelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        {asideVisible && (
          <aside className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm p-4 flex flex-col min-h-[380px] max-h-[62vh] overflow-hidden">
            {selected && (
              <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{selected.name}</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{selected.category}{selected.country ? ` • ${selected.country}` : ''}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 shrink-0" title="Clear selection">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-full aspect-[3/2] bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-zinc-100 dark:border-zinc-700">
                  <FlagImage flag={selected} alt={selected.name} className="max-w-full max-h-full object-contain rounded" />
                </div>
                {selected.geoApprox && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2">
                    Approximate location (parent region). Admins can set an exact pin in the flag editor.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewing(selected)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View details
                  </button>
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(selected.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> OSM
                  </a>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-700/60 pt-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5">Nearest places ({nearby.length})</p>
                  <div className="flex flex-col gap-1">
                    {nearby.map((p) => (
                      <PlaceRow key={p.flag.id} p={p} active={p.flag.id === selected.id} onPick={focusOn} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {unmapped.length > 0 && (
              <div className={`${selected ? 'border-t border-zinc-100 dark:border-zinc-700/60 mt-3 pt-2 shrink-0' : 'flex flex-col flex-1 min-h-0 overflow-hidden'}`}>
                <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1 shrink-0">
                  Location needed ({unmapped.length})
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 shrink-0">
                  {isAdmin ? 'Open a flag and set its coordinates in the editor.' : 'Mostly city flags awaiting coordinates — nothing is faked on the map.'}
                </p>
                <div className={`flex flex-col gap-1 overflow-y-auto pr-1 ${selected ? 'max-h-36' : 'flex-1 min-h-0'}`}>
                  {unmapped.slice(0, 30).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setViewing(f)}
                      className="w-full flex items-center gap-2 min-h-[30px] px-2 py-1.5 rounded-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                      <span className="block truncate min-w-0 flex-1 text-[12px] leading-5 text-zinc-600 dark:text-zinc-400">
                        {f.name}
                      </span>
                    </button>
                  ))}
                  {unmapped.length > 30 && (
                    <p className="text-[11px] text-zinc-400 italic px-2 py-1">+ {unmapped.length - 30} more — refine search to narrow down.</p>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <LocateFixed className="w-3.5 h-3.5 shrink-0" />
        <span>Pins reuse the already-loaded flag list — no extra database reads. Pin thumbnails are 80px to keep tile + image bandwidth light.</span>
      </div>

      {viewing && (
        <FlagModal
          flag={viewing}
          flagsList={FLAGS}
          progress={progress}
          onClose={() => setViewing(null)}
          onSelectFlag={setViewing}
          onEdit={(flag) => {
            setViewing(null);
            setEditing(flag);
          }}
        />
      )}

      {/* Admin editor (same as Dictionary) — this is what makes the Edit
          button appear in the flag modal for Location-needed flags too. */}
      <AnimatePresence>
        {editing && (
          <FlagEditorModal
            key={editing.id}
            flagToEdit={editing}
            initialTab="flag"
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
