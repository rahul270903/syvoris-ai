'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export interface HlsVideoBackgroundProps {
  /** HLS stream URL (.m3u8) or direct video URL */
  src?: string;
  /** Fallback video URL (.mp4/.webm) if HLS stream fails */
  fallbackSrc?: string;
  /** Poster image shown while loading */
  poster?: string;
  /** Extra CSS classes */
  className?: string;
  /** Opacity of the video (0-1), default 0.35 */
  opacity?: number;
}

// High-reliability public ambient dark technology / network HLS stream
const DEFAULT_HLS_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
// Fallback ambient dark video
const DEFAULT_FALLBACK_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-996-large.mp4';

export function HlsVideoBackground({
  src = DEFAULT_HLS_STREAM,
  fallbackSrc = DEFAULT_FALLBACK_VIDEO,
  poster,
  className = '',
  opacity = 0.35,
}: HlsVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const startPlayback = () => {
      video.play().then(() => setIsPlaying(true)).catch(() => {
        // Autoplay policy or offline fallback
        setIsPlaying(false);
      });
    };

    if (src && src.endsWith('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari, iOS)
        video.src = src;
        video.addEventListener('loadedmetadata', startPlayback);
      } else if (Hls.isSupported()) {
        // MediaSource Extensions via hls.js (Chrome, Firefox, Edge)
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          startPlayback();
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Network error, fall back to direct video
                setHasError(true);
                if (fallbackSrc) {
                  video.src = fallbackSrc;
                  startPlayback();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                setHasError(true);
                break;
            }
          }
        });
      } else if (fallbackSrc) {
        video.src = fallbackSrc;
        startPlayback();
      }
    } else if (fallbackSrc || src) {
      video.src = src || fallbackSrc;
      startPlayback();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.removeEventListener('loadedmetadata', startPlayback);
      }
    };
  }, [src, fallbackSrc]);

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        poster={poster}
        style={{ opacity: isPlaying ? opacity : 0 }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 filter brightness-[0.7] contrast-[1.2] saturate-[0.8]"
      />
      {/* Dark gradient vignette ensuring text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08264D] via-[#08264D]/60 to-[#08264D]/80" />
      <div className="absolute inset-0 bg-radial-[at_bottom_left] from-transparent via-[#08264D]/50 to-[#08264D]/90" />
    </div>
  );
}

export default HlsVideoBackground;
