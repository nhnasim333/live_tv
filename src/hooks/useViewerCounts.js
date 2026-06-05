import { useEffect, useRef, useState } from 'react'

const WORKER_BASE = 'https://summer-night-8a15.mdnasimhosen333.workers.dev'

export function useViewerCounts(channels, activeChannelId = null) {
  const [counts, setCounts] = useState({})
  const heartbeatRef = useRef(null)

  // Fetch all viewer counts every 15 seconds
  useEffect(() => {
    if (!channels || channels.length === 0) return

    async function fetchCounts() {
      try {
        const res = await fetch(`${WORKER_BASE}/api/viewers`)
        if (!res.ok) throw new Error('Network error')
        const data = await res.json()
        // data is already { channelId: count } with prefix stripped by worker
        setCounts(data)
      } catch (err) {
        console.error('Failed fetching viewer counts:', err)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 15000)
    return () => clearInterval(interval)
  }, [channels])

  // Send heartbeat for the active channel every 30 seconds
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }

    if (!activeChannelId) return

    async function sendHeartbeat() {
      try {
        await fetch(
          `${WORKER_BASE}/api/heartbeat?channel_id=${encodeURIComponent(activeChannelId)}`,
          { method: 'POST' }
        )
      } catch (err) {
        // Silently ignore — not critical
        console.error('Failed sending heartbeat:', err)
      }
    }

    // Send immediately on channel switch, then every 30s
    sendHeartbeat()
    heartbeatRef.current = setInterval(sendHeartbeat, 60000)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [activeChannelId])

  return counts
}