import { useEffect, useMemo, useState } from 'react'
import ChannelList from './components/ChannelList'
import VideoPlayer from './components/VideoPlayer'
import {
  DEFAULT_PLAYLIST_SOURCE_ID,
  PLAYLIST_SOURCES,
  SOURCE_STORAGE_KEY,
  getChannelStorageKey,
} from './data/channels'
import { buildProxyUrl, parsePlaylist } from './lib/playlist'

function App() {
  const [channels, setChannels] = useState([])
  const [activeSourceId, setActiveSourceId] = useState(() => {
    return localStorage.getItem(SOURCE_STORAGE_KEY) || DEFAULT_PLAYLIST_SOURCE_ID
  })
  const [activeChannelUrl, setActiveChannelUrl] = useState(() => {
    return localStorage.getItem(getChannelStorageKey(DEFAULT_PLAYLIST_SOURCE_ID)) || ''
  })
  const [isChannelListLoading, setIsChannelListLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const activeSource = useMemo(() => {
    return (
      PLAYLIST_SOURCES.find((source) => source.id === activeSourceId) ||
      PLAYLIST_SOURCES[0]
    )
  }, [activeSourceId])

  const activeChannel = useMemo(() => {
    if (!channels.length) {
      return null
    }

    return (
      channels.find((channel) => channel.url === activeChannelUrl) || channels[0] || null
    )
  }, [activeChannelUrl, channels])

  useEffect(() => {
    let isMounted = true

    async function loadPlaylist() {
      setIsChannelListLoading(true)
      setLoadError('')

      try {
        const candidateUrls = [activeSource.localPath, activeSource.remoteUrl].filter(Boolean)
        let response = null

        for (const playlistUrl of candidateUrls) {
          try {
            response = await fetch(playlistUrl, { cache: 'no-store' })

            if (response.ok) {
              break
            }
          } catch {
            response = null
          }
        }

        if (!response?.ok) {
          throw new Error(`Playlist request failed with status ${response.status}`)
        }

        const content = await response.text()
        const parsedChannels = parsePlaylist(content)

        if (!isMounted) {
          return
        }

        setChannels(parsedChannels)

        const restoredChannel = parsedChannels.find(
          (channel) => channel.url === localStorage.getItem(getChannelStorageKey(activeSource.id)),
        )

        setActiveChannelUrl(restoredChannel?.url || parsedChannels[0]?.url || '')
      } catch {
        if (!isMounted) {
          return
        }

        setLoadError('Unable to load live playlist right now. Please try again in a moment.')
        setChannels([])
      } finally {
        if (isMounted) {
          setIsChannelListLoading(false)
        }
      }
    }

    loadPlaylist()

    return () => {
      isMounted = false
    }
  }, [activeSource])

  useEffect(() => {
    localStorage.setItem(SOURCE_STORAGE_KEY, activeSourceId)

    if (activeChannel?.url) {
      localStorage.setItem(getChannelStorageKey(activeSource.id), activeChannel.url)
    }
  }, [activeChannel, activeSource.id, activeSourceId])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-neutral-950 text-neutral-100 lg:h-dvh">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(239,68,68,0.12),transparent_28%)]" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-1 border-b border-neutral-800/80 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            Live Streaming Platform
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {PLAYLIST_SOURCES.map((source) => {
              const isActiveSource = activeSource.id === source.id

              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setActiveSourceId(source.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActiveSource
                      ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200'
                      : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
                  }`}
                  title={source.description}
                >
                  {source.label}
                </button>
              )
            })}
            <span className="text-xs text-neutral-400">
              {channels.length} channels in {activeSource.label}
            </span>
          </div>
        </header>

        {loadError && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {loadError}
          </div>
        )}

        <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,2fr)_360px]">
          <section className="min-h-0 min-w-0">
            <VideoPlayer
              key={activeChannel?.url || 'player-empty'}
              channel={activeChannel}
              isLoading={isChannelListLoading}
            />
          </section>

          <aside className="min-h-0 min-w-0">
            <ChannelList
              channels={channels}
              activeChannel={activeChannel}
              onSelectChannel={(channel) => setActiveChannelUrl(channel.url)}
              isLoading={isChannelListLoading}
            />
          </aside>
        </main>
      </div>
    </div>
  )
}

export default App
