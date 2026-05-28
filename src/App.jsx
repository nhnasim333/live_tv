import { useEffect, useMemo, useState } from 'react'
import ChannelList from './components/ChannelList'
import VideoPlayer from './components/VideoPlayer'
import { PLAYLIST_URL, STORAGE_KEY } from './data/channels'
import { buildProxyUrl, parsePlaylist } from './lib/playlist'

function App() {
  const [channels, setChannels] = useState([])
  const [activeChannelUrl, setActiveChannelUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })
  const [isChannelListLoading, setIsChannelListLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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
        const response = await fetch(buildProxyUrl(PLAYLIST_URL), {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`Playlist request failed with status ${response.status}`)
        }

        const content = await response.text()
        const parsedChannels = parsePlaylist(content)

        if (!isMounted) {
          return
        }

        setChannels(parsedChannels)

        const restoredChannel = parsedChannels.find(
          (channel) => channel.url === localStorage.getItem(STORAGE_KEY),
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
  }, [])

  useEffect(() => {
    if (activeChannel?.url) {
      localStorage.setItem(STORAGE_KEY, activeChannel.url)
    }
  }, [activeChannel])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-neutral-950 text-neutral-100 lg:h-dvh">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(239,68,68,0.12),transparent_28%)]" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-1 border-b border-neutral-800/80 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            Live Streaming Platform
          </p>
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
