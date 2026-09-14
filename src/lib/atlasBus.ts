/** Tiny event bus so Dictionary cards / FlagModal can jump to the Atlas without prop drilling. */
export const ATLAS_FOCUS_EVENT = 'vexilla:atlas-focus';

// AtlasView is lazy-loaded: when "Show on map" fires, it often isn't mounted
// yet, so the event alone would be missed. The id is also stashed here and
// AtlasView consumes it on mount (survives the chunk load delay).
let pendingFlagId: string | null = null;

export function requestShowOnMap(flagId: string) {
  pendingFlagId = flagId;
  window.dispatchEvent(new CustomEvent(ATLAS_FOCUS_EVENT, { detail: { flagId } }));
}

export function setPendingFocus(flagId: string) {
  pendingFlagId = flagId;
}

export function consumePendingFocus(): string | null {
  const id = pendingFlagId;
  pendingFlagId = null;
  return id;
}

export function onAtlasFocus(cb: (flagId: string) => void): () => void {
  const handler = (e: Event) => {
    const id = (e as CustomEvent).detail?.flagId;
    if (typeof id === 'string' && id) cb(id);
  };
  window.addEventListener(ATLAS_FOCUS_EVENT, handler);
  return () => window.removeEventListener(ATLAS_FOCUS_EVENT, handler);
}
