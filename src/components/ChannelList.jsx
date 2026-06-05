import { useMemo, useState } from 'react'
import { PLAYLIST_SOURCES } from '../data/channels'
import { useViewerCounts } from '../hooks/useViewerCounts'

function ChannelCardSkeleton() {
  return (
    <div className="w-[88px] flex-shrink-0 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/70 p-2">
      <div className="mx-auto mb-2 h-9 w-9 rounded-lg bg-neutral-700" />
      <div className="mx-auto mb-1 h-2 w-3/4 rounded bg-neutral-700" />
      <div className="mx-auto h-2 w-1/2 rounded bg-neutral-800" />
    </div>
  )
}

function formatViewers(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const CATEGORIES = [
  'All', 'Sports', 'News', 'Movies', 'Music',
  'Entertainment', 'Kids', 'Documentary', 'Religious', 'Live',
]

function ChannelList({
  channels,
  activeChannel,
  activeSourceId,
  onSelectChannel,
  onSelectSource,
  isLoading,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const viewerCounts = useViewerCounts(channels)

  const filteredChannels = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return channels.filter((channel) => {
      const categoryMatch = activeCategory === 'All' || channel.category === activeCategory
      const searchMatch = channel.name.toLowerCase().includes(query)
      return categoryMatch && searchMatch
    })
  }, [activeCategory, channels, searchTerm])

  return (
    <section className="w-full rounded-2xl border border-neutral-800/80 bg-neutral-900/70 p-3 backdrop-blur sm:p-4">

      {/* Playlist source selector */}
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Playlist
        </span>
        {PLAYLIST_SOURCES.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => onSelectSource(source.id)}
            title={source.description}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeSourceId === source.id
                ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200'
                : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            {source.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-500">
          {channels.length} channels
        </span>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search channels…"
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-cyan-400/70"
        />
      </div>

      {/* Category pills */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeCategory === cat
                ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200'
                : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Channel grid */}
      <div className="flex flex-wrap gap-2">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <ChannelCardSkeleton key={i} />)
          : filteredChannels.length === 0
          ? (
            <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-6 text-center text-sm text-neutral-400">
              No channels found.
            </div>
          )
          : filteredChannels.map((channel) => {
              const isActive = activeChannel?.id === channel.id
              const viewers = viewerCounts[channel.id] ?? 0

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                  className={`relative flex w-[88px] flex-shrink-0 flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition ${
                    isActive
                      ? 'border-cyan-400/50 bg-cyan-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  {/* Dynamic Viewer Count Tag in the top corner of each card */}
                  <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded bg-black/80 px-1 py-0.5 text-[8px] font-semibold text-neutral-300">
                    <span className={`h-1 w-1 rounded-full ${viewers > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
                    {formatViewers(viewers)}
                  </span>

                  <img
                    src={channel.logo}
                    alt={`${channel.name} logo`}
                    className="h-9 w-9 rounded-lg object-cover mt-2"
                    loading="lazy"
                  />
                  <p className="w-full truncate text-[10px] font-medium leading-tight text-white">
                    {channel.name}
                  </p>
                  <p className="text-[9px] leading-none text-neutral-500">
                    {channel.category}
                  </p>
                </button>
              )
            })}
      </div>

    </section>
  )
}

export default ChannelList