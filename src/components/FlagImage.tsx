import { useState, useEffect, Key } from 'react';
import { Flag } from '../types';
import { getFlagImageUrl } from '../data/flags';
import { parseFandomFileUrl, getCachedFandomFileUrl, resolveFandomFileUrl } from '../lib/fandomFiles';

interface FlagImageProps {
  flag: Flag;
  className?: string;
  alt?: string;
  highRes?: boolean;
  draggable?: boolean;
  key?: Key;
}

export function FlagImage({ flag, className = '', alt, highRes = false, draggable = false }: FlagImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => getFlagImageUrl(flag, highRes));
  const [errorCount, setErrorCount] = useState(0);
  // Fandom file-page links can't be turned into <img> sources synchronously
  // (Special:FilePath is 403 for embeds), so resolve them via the API.
  const fandomRef = flag.imageUrl ? parseFandomFileUrl(flag.imageUrl) : null;
  const [fandomUrl, setFandomUrl] = useState<string | null>(() =>
    fandomRef ? getCachedFandomFileUrl(fandomRef) : null
  );
  const [fandomFailed, setFandomFailed] = useState(false);

  // Reset image source if flag or image settings change
  useEffect(() => {
    setImgSrc(getFlagImageUrl(flag, highRes));
    setErrorCount(0);
    const ref = flag.imageUrl ? parseFandomFileUrl(flag.imageUrl) : null;
    if (!ref) {
      setFandomUrl(null);
      setFandomFailed(false);
      return;
    }
    const cached = getCachedFandomFileUrl(ref);
    if (cached) {
      setFandomUrl(cached);
      setFandomFailed(false);
      return;
    }
    let cancelled = false;
    setFandomUrl(null);
    setFandomFailed(false);
    resolveFandomFileUrl(ref).then((u) => {
      if (cancelled) return;
      if (u) setFandomUrl(u);
      else setFandomFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [flag.id, flag.imageUrl, flag.code, highRes]);

  const handleError = () => {
    if (errorCount === 0) {
      // Stage 1: If the image failed and it has a width constraint, try removing it
      if (imgSrc.includes('?width=') || imgSrc.includes('&width=')) {
        setImgSrc(imgSrc.replace(/(\?|&)width=\d+/, ''));
        setErrorCount(1);
        return;
      }
    }
    
    if (errorCount <= 1 && flag.imageUrl) {
      // Stage 2: Desperate fallback for Wikimedia/Wikipedia or raw filenames
      // Try to extract the filename and hit the unscaled Wikimedia Commons endpoint
      let filename = '';
      const trimmed = flag.imageUrl.trim();
      if (!trimmed.startsWith('http')) {
        filename = trimmed;
      } else if (trimmed.includes('wikimedia.org') || trimmed.includes('wikipedia.org')) {
        filename = trimmed.split('/').pop()?.split('?')[0] || '';
      }
      
      if (filename) {
        const fallbackUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
        if (imgSrc !== fallbackUrl) {
          setImgSrc(fallbackUrl);
          setErrorCount(2);
          return;
        }
      }
    }
    
    setErrorCount(3);
  };

  if (fandomRef ? fandomFailed : errorCount >= 3) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-center p-2 border border-zinc-200 dark:border-zinc-700 ${className}`} style={{ fontSize: '0.75rem', lineHeight: '1rem' }}>
        {flag.name}
      </div>
    );
  }

  if (fandomRef && !fandomUrl) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-center p-2 border border-zinc-200 dark:border-zinc-700 animate-pulse ${className}`} style={{ fontSize: '0.75rem', lineHeight: '1rem' }}>
        {flag.name}
      </div>
    );
  }

  return (
    <img
      src={fandomRef ? (fandomUrl as string) : imgSrc}
      alt={alt || flag.name}
      className={className}
      draggable={draggable}
      loading="lazy"
      decoding="async"
      onDragStart={(e) => {
        if (!draggable) e.preventDefault();
      }}
      onError={fandomRef ? () => setFandomFailed(true) : handleError}
    />
  );
}
