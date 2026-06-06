import { useState, useEffect } from 'react'
import ReactPlayer from 'react-player'
import ProxyLoader, { setActiveChannelTrackingId } from '../lib/proxyLoader'

function formatPlayerViewers(n) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function VideoPlayer({ channel, isLoading, liveViewerCount = 0 }) {
  const [isPlayerLoading, setIsPlayerLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(channel?.url)
  
  // Track user playing state internally to handle the 3-5 second autoplay bug
  const [isPlaying, setIsPlaying] = useState(true)

  // Update our global loader variable whenever the active channel updates
  useEffect(() => {
    if (channel?.id) {
      setActiveChannelTrackingId(channel.id)
    }
  }, [channel?.id])

  if (channel?.url !== currentUrl) {
    setCurrentUrl(channel?.url)
    setIsPlayerLoading(true)
    setHasError(false)
    setIsPlaying(true) // Always auto-play when a user explicitly switches channels
  }

  if (isLoading && !channel) {
    return (
      <article className="rounded-2xl border border-neutral-800/80 bg-neutral-900/70 p-3 backdrop-blur sm:p-4 lg:p-5">
        <div className="aspect-video animate-pulse rounded-xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800" />
      </article>
    )
  }

  if (!channel) {
    return (
      <article className="rounded-2xl border border-neutral-800/80 bg-neutral-900/70 p-3 backdrop-blur sm:p-4 lg:p-5">
        <div className="grid aspect-video place-items-center rounded-xl border border-neutral-800 bg-black text-center text-sm text-neutral-400">
          No channel available.
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-neutral-800/80 bg-neutral-900/70 p-3 shadow-[0_20px_65px_-25px_rgba(6,182,212,0.45)] backdrop-blur sm:p-4 lg:p-5">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-black">
        
        {/* Live Indicator Overlay */}
        <div className="absolute -top-2 -left-2 z-10 flex items-center overflow-hidden rounded-md bg-black/60 backdrop-blur-md shadow-lg border border-white/10 select-none">
          <div className="flex items-center gap-1.5 rounded-md bg-neutral-950/80 px-2.5 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-medium text-emerald-400">
              {formatPlayerViewers(liveViewerCount)} watching
            </span>
          </div>
        </div>

        {!hasError && (
          <ReactPlayer
            key={channel.url} // 💡 Crucial Fix: Forces player remount when channel changes
            src={channel.url}
            width="100%"
            height="100%"
            controls
            playing={isPlaying}
            playsInline
            onReady={() => setIsPlayerLoading(false)}
            onPlay={() => {
              setIsPlayerLoading(false)
              setIsPlaying(true)
            }}
            onPause={() => {
              setIsPlaying(false) // Blocks background playlist loops from auto-replaying
            }}
            onPlaying={() => setIsPlayerLoading(false)}
            onBuffer={() => setIsPlayerLoading(true)}
            onBufferEnd={() => setIsPlayerLoading(false)}
            onError={() => {
              setIsPlayerLoading(false)
              setHasError(true)
            }}
            config={{
              file: {
                forceHLS: true,
                hlsOptions: {
                  enableWorker: true,
                  loader: ProxyLoader,
                  liveSyncDurationCount: 3,
                  liveMaxLatencyDurationCount: 6,
                  maxBufferLength: 30,
                  backBufferLength: 30
                },
              },
            }}
          />
        )}

        {isPlayerLoading && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800" />
        )}

        {hasError && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-center">
            <div>
              <p className="mb-2 text-base font-semibold text-red-300 sm:text-lg">
                Stream currently unavailable
              </p>
              <p className="text-sm text-neutral-400">
                This HLS source may be broken or blocked by CORS restrictions.
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default VideoPlayer