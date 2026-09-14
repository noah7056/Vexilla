import { useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import { TILE_ATTRIBUTION, atlasTileUrl, quizTileUrl } from '../../lib/mapTiles';

const round4 = (n: number) => Math.round(n * 10000) / 10000;

function useDark(): boolean {
  const [isDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  return isDark;
}

const guessIcon = L.divIcon({
  className: 'vexilla-quiz-guess',
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#4f46e5;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const trueIcon = L.divIcon({
  className: 'vexilla-quiz-true',
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#10b981;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const promptIcon = L.divIcon({
  className: 'vexilla-quiz-prompt',
  html: '<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#4f46e5;color:#fff;font-weight:800;font-size:16px;border:2px solid #fff;box-shadow:0 1px 8px rgba(0,0,0,.5)">?</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function ClickToGuess({ onPick, disabled }: { onPick: (lat: number, lon: number) => void; disabled: boolean }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onPick(round4(e.latlng.lat), round4(e.latlng.lng));
    },
  });
  return null;
}

export interface LatLon {
  lat: number;
  lon: number;
}

interface GuessMapProps {
  guess: LatLon | null;
  truth: LatLon | null;
  revealed: boolean;
  onPick: (lat: number, lon: number) => void;
}

/**
 * Interactive world map for flag-to-map / name-to-map: tap to place a
 * guess pin, then the parent reveals the true pin + connector line.
 */
export function QuizGuessMap({ guess, truth, revealed, onPick }: GuessMapProps) {
  const isDark = useDark();
  return (
    <MapContainer
      center={[22, 8]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      style={{ height: 340, width: '100%', zIndex: 0 }}
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={atlasTileUrl(isDark)} />
      <ClickToGuess disabled={revealed} onPick={onPick} />
      {guess && (
        <Marker
          position={[guess.lat, guess.lon]}
          icon={guessIcon}
          draggable={!revealed}
          eventHandlers={{
            dragend(e) {
              if (revealed) return;
              const ll = (e.target as L.Marker).getLatLng();
              onPick(round4(ll.lat), round4(ll.lng));
            },
          }}
        />
      )}
      {revealed && truth && (
        <>
          <Marker position={[truth.lat, truth.lon]} icon={trueIcon} interactive={false} />
          {guess && (
            <Polyline
              positions={[[guess.lat, guess.lon], [truth.lat, truth.lon]]}
              pathOptions={{ color: '#6366f1', weight: 2, dashArray: '6 5' }}
            />
          )}
        </>
      )}
    </MapContainer>
  );
}

interface PromptMapProps {
  truth: LatLon;
}

/**
 * Non-interactive label-free map for map-to-flag: shows a mystery pin
 * without country/city labels giving the answer away.
 */
export function QuizPromptMap({ truth }: PromptMapProps) {
  const isDark = useDark();
  return (
    <MapContainer
      center={[truth.lat, truth.lon]}
      zoom={4}
      minZoom={2}
      worldCopyJump
      dragging={false}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false}
      style={{ height: 260, width: '100%', zIndex: 0 }}
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={quizTileUrl(isDark)} />
      <Marker position={[truth.lat, truth.lon]} icon={promptIcon} interactive={false} />
    </MapContainer>
  );
}
