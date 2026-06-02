import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import ProxyLoader from '../lib/proxyLoader'

function VideoPlayer({ channel, isLoading }) {
  const [isPlayerLoading, setIsPlayerLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsPlayerLoading(true)
    setHasError(false)
  }, [channel?.url])

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
      <header className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
            Now Playing
          </p>
          <h2 className="max-w-[75vw] truncate font-display text-lg text-white sm:max-w-[32rem] sm:text-xl" title={channel.name}>
            {channel.name}
          </h2>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300">
          LIVE
        </span>
      </header>

      <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-black">
        {!hasError && (
          <ReactPlayer
            key={channel.url}
            src={channel.url}
            width="100%"
            height="100%"
            controls
            playing
            playsInline
            onReady={() => setIsPlayerLoading(false)}
            onPlay={() => setIsPlayerLoading(false)}
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
                  backBufferLength: 30,
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