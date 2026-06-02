import { useMemo, useState } from 'react'

function ChannelCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
      <div className="h-12 w-12 animate-pulse rounded-lg bg-neutral-700" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-700" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-neutral-800" />
      </div>
    </div>
  )
}

function ChannelList({ channels, activeChannel, onSelectChannel, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = [
    'All',
    'Sports',
    'News',
    'Movies',
    'Music',
    'Entertainment',
    'Kids',
    'Documentary',
    'Religious',
    'Live',
  ]

  const filteredChannels = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return channels.filter((channel) => {
      const categoryMatch =
        activeCategory === 'All' || channel.category === activeCategory
      const searchMatch = channel.name.toLowerCase().includes(query)

      return categoryMatch && searchMatch
    })
  }, [activeCategory, channels, searchTerm])

  return (
    <section className="h-full rounded-2xl border border-neutral-800/80 bg-neutral-900/70 p-3 backdrop-blur sm:p-4">
      <header className="mb-3 flex items-center justify-between sm:mb-4">
        <h3 className="font-display text-lg text-white sm:text-xl">Channels</h3>
        <p className="text-xs text-neutral-400">{channels.length} available</p>
      </header>

      <div className="mb-3 grid gap-2 sm:mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search channel"
          className="w-full rounded-xl border border-neutral-700 bg-neutral-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-cyan-400/70"
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActiveCategory = activeCategory === category

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActiveCategory
                    ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => <ChannelCardSkeleton key={idx} />)
          : filteredChannels.map((channel) => {
              const isActive = activeChannel?.id === channel.id

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                  className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    isActive
                      ? 'border-cyan-400/50 bg-cyan-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <img
                    src={channel.logo}
                    alt={`${channel.name} logo`}
                    className="h-12 w-12 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{channel.name}</p>
                    <p className="text-xs text-neutral-400">{channel.category} • Tap to play</p>
                  </div>
                </button>
              )
            })}

        {!isLoading && filteredChannels.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 text-center text-sm text-neutral-400">
            No channel found for this search/category.
          </div>
        )}
      </div>
    </section>
  )
}

export default ChannelList
