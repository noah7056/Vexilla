/** CARTO basemap tiles (client-side raster tiles; restrict the key by HTTP
 * referrer in the CARTO dashboard if it gets abused). */
export const CARTO_KEY = 'cb1_3k09_1_92575d244398e4997a3c6249';

export function atlasTileUrl(isDark: boolean): string {
  return isDark
    ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`
    : `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`;
}

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
