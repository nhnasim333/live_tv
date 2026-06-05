import { useEffect, useState } from 'react'

export function useViewerCounts(channels) {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (!channels || channels.length === 0) return

    async function fetchRealCounts() {
      try {
        const res = await fetch('https://summer-night-8a15.mdnasimhosen333.workers.dev/?url=api/viewers')
        if (!res.ok) throw new Error('Network error')
        const data = await res.json()
        
        console.log("Raw Worker Data Structure:", data)
        
        const verifiedCounts = {}
        
        channels.forEach((ch) => {
          // Check for the count using both the plain URL key and the URI-encoded URL key
          const count = data[ch.id] || data[encodeURIComponent(ch.id)] || 0
          verifiedCounts[ch.id] = count
        })

        setCounts(verifiedCounts)
      } catch (error) {
        console.error("Failed fetching live concurrent analytics:", error)
      }
    }

    fetchRealCounts()
    const interval = setInterval(fetchRealCounts, 15000)
    return () => clearInterval(interval)
  }, [channels])

  return counts
}