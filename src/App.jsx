import { useEffect, useMemo, useState } from 'react'
import ChannelList from './components/ChannelList'
import VideoPlayer from './components/VideoPlayer'
import { useViewerCounts } from './hooks/useViewerCounts'
import {
  DEFAULT_PLAYLIST_SOURCE_ID,
  PLAYLIST_SOURCES,
  SOURCE_STORAGE_KEY,
  getChannelStorageKey,
} from './data/channels'
import { parsePlaylist } from './lib/playlist'

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
    if (!channels.length) return null
    return (
      channels.find((channel) => channel.url === activeChannelUrl) ||
      channels[0] ||
      null
    )
  }, [activeChannelUrl, channels])

  // Pass activeChannel?.id so the hook knows to send heartbeats for it
  const viewerCounts = useViewerCounts(channels, activeChannel?.id)

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
            if (response.ok) break
          } catch {
            response = null
          }
        }

        if (!response?.ok) {
          throw new Error(`Playlist request failed with status ${response?.status}`)
        }

        const content = await response.text()
        const parsedChannels = parsePlaylist(content)

        if (!isMounted) return

        setChannels(parsedChannels)

        const restoredChannel = parsedChannels.find(
          (channel) =>
            channel.url === localStorage.getItem(getChannelStorageKey(activeSource.id)),
        )

        setActiveChannelUrl(restoredChannel?.url || parsedChannels[0]?.url || '')
      } catch {
        if (!isMounted) return
        setLoadError('Unable to load live playlist right now. Please try again in a moment.')
        setChannels([])
      } finally {
        if (isMounted) setIsChannelListLoading(false)
      }
    }

    loadPlaylist()
    return () => { isMounted = false }
  }, [activeSource])

  useEffect(() => {
    localStorage.setItem(SOURCE_STORAGE_KEY, activeSourceId)
    if (activeChannel?.url) {
      localStorage.setItem(getChannelStorageKey(activeSource.id), activeChannel.url)
    }
  }, [activeChannel, activeSource.id, activeSourceId])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(239,68,68,0.12),transparent_28%)]" />

      <div className="relative flex flex-1 flex-col">

        <header className="px-4 pt-4 pb-3 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            Live Streaming Platform
          </p>
        </header>

        {loadError && (
          <div className="mx-4 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:mx-6">
            {loadError}
          </div>
        )}

        <main className="flex items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-5xl">
            <VideoPlayer
              key={activeChannel?.url || 'player-empty'}
              channel={activeChannel}
              isLoading={isChannelListLoading}
              liveViewerCount={viewerCounts[activeChannel?.id] ?? 0}
            />
          </div>
        </main>

        <div className="mt-3 px-4 pb-6 sm:px-6">
          <ChannelList
            channels={channels}
            activeChannel={activeChannel}
            activeSourceId={activeSourceId}
            onSelectChannel={(channel) => setActiveChannelUrl(channel.url)}
            onSelectSource={(id) => setActiveSourceId(id)}
            isLoading={isChannelListLoading}
            viewerCounts={viewerCounts}
          />
        </div>

      </div>
    </div>
  )
}

export default App