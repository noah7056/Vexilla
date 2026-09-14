import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';
import { TILE_ATTRIBUTION, atlasTileUrl } from '../lib/mapTiles';

const round4 = (n: number) => Math.round(n * 10000) / 10000;

const dotIcon = L.divIcon({
  className: 'vexilla-pick-dot',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#4f46e5;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);cursor:grab"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickToPick({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(round4(e.latlng.lat), round4(e.latlng.lng));
    },
  });
  return null;
}

function ClampLat() {
  const map = useMap();
  useMapEvents({
    // No horizontal bounds (infinite world looping) — only ease the latitude
    // back toward inhabited land after a drag ends.
    moveend() {
      const c = map.getCenter();
      const LIM = 80;
      if (c.lat > LIM || c.lat < -LIM) {
        map.panTo([Math.max(-LIM, Math.min(LIM, c.lat)), c.lng], { animate: false });
      }
    },
  });
  return null;
}

function Recenter({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();
  const [last, setLast] = useState('');
  const key = `${lat ?? ''},${lon ?? ''}`;
  if (key !== last && lat !== undefined && lon !== undefined) {
    setLast(key);
    map.setView([lat, lon], Math.max(map.getZoom(), 5));
  }
  return null;
}

interface MapPickerProps {
  lat?: number;
  lon?: number;
  onPick: (lat: number, lon: number) => void;
}

/** Large click-to-pick map for the flag editor. Lazy-loaded so Leaflet stays out of the main bundle. */
export function MapPicker({ lat, lon, onPick }: MapPickerProps) {
  const [isDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  const hasPos = lat !== undefined && lon !== undefined && Number.isFinite(lat) && Number.isFinite(lon);

  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onFs = () => {
      setIsFs(document.fullscreenElement === wrapRef.current);
      // The fullscreen transition animates layout: revalidate after paint
      // and again once it settles, or tiles render at the old (strip) size.
      requestAnimationFrame(() => mapRef.current?.invalidateSize());
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const toggleFs = () => {
    if (document.fullscreenElement === wrapRef.current) {
      document.exitFullscreen().catch(() => {});
    } else {
      wrapRef.current?.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`vexilla-fs rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 relative ${isFs ? 'bg-white dark:bg-zinc-900 border-0 rounded-none' : ''}`}
    >
      <MapContainer
        ref={mapRef}
        center={hasPos ? [lat as number, lon as number] : [22, 8]}
        zoom={hasPos ? 5 : 2}
        minZoom={2}
        worldCopyJump
        style={{ height: isFs ? 'calc(100vh - 44px)' : 440, width: '100%', zIndex: 0 }}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={atlasTileUrl(isDark)} />
        <ClampLat />
        <ClickToPick onPick={onPick} />
        <Recenter lat={lat} lon={lon} />
        {hasPos && (
          <Marker
            position={[lat as number, lon as number]}
            icon={dotIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const ll = (e.target as L.Marker).getLatLng();
                onPick(round4(ll.lat), round4(ll.lng));
              },
            }}
          />
        )}
      </MapContainer>
      <button
        onClick={toggleFs}
        title={isFs ? 'Exit fullscreen (Esc)' : 'Fullscreen picker'}
        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/95 dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors"
      >
        {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
      <p className="px-3 py-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-700">
        Click anywhere to drop the pin — drag it to fine-tune.
      </p>
    </div>
  );
}
