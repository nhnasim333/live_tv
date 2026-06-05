import { buildProxyUrl } from './playlist'

// Global variable tracking the active channel context across loader instances
export let ACTIVE_CHANNEL_TRACKING_ID = null;

export function setActiveChannelTrackingId(id) {
  ACTIVE_CHANNEL_TRACKING_ID = id;
}

function proxifyUrl(resourceUrl, baseUrl, channelId) {
  try {
    const absoluteUrl = new URL(resourceUrl, baseUrl).toString()
    let proxied = buildProxyUrl(absoluteUrl)
    
    if (channelId) {
      proxied += `&channel_id=${encodeURIComponent(channelId)}`
    }
    return proxied
  } catch {
    return resourceUrl
  }
}

function rewriteManifest(content, baseUrl, channelId) {
  return content
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#EXTM3U')) {
        return line
      }

      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/gi, (_, uri) => {
          return `URI="${proxifyUrl(uri, baseUrl, channelId)}"`
        })
      }

      return proxifyUrl(trimmed, baseUrl, channelId)
    })
    .join('\n')
}

export default class ProxyLoader {
  constructor() {
    this.context = null
    this.callbacks = null
    this.controller = null
    this.stats = {
      aborted: false,
      loaded: 0,
      retry: 0,
      total: 0,
      chunkCount: 0,
      bwEstimate: 0,
      loading: { start: 0, first: 0, end: 0, timeout: 0 },
      parsing: { start: 0, end: 0 },
      buffering: { start: 0, first: 0, end: 0 },
    }
  }

  destroy() {
    this.abort()
    this.context = null
    this.callbacks = null
  }

  abort() {
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
    this.stats.aborted = true
  }

  async load(context, config, callbacks) {
    this.context = context
    this.callbacks = callbacks
    this.controller = new AbortController()
    this.stats.loading.start = performance.now()

    // 💡 ULTIMATE FALLBACK FIX: Extract channel ID safely from everywhere
    const channelId = 
      ACTIVE_CHANNEL_TRACKING_ID || 
      config?.currentChannelTrackingId || 
      config?.config?.hlsOptions?.currentChannelTrackingId || 
      null;

    let proxiedUrl = buildProxyUrl(context.url)
    if (channelId) {
      proxiedUrl += `&channel_id=${encodeURIComponent(channelId)}`
    }

    try {
      const response = await fetch(proxiedUrl, {
        signal: this.controller.signal,
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Proxy request failed with status ${response.status}`)
      }

      const data = context.responseType === 'arraybuffer'
        ? await response.arrayBuffer()
        : await response.text()

      const contentType = response.headers.get('content-type') || ''
      const shouldRewriteManifest =
        typeof data === 'string' &&
        (contentType.toLowerCase().includes('mpegurl') ||
          data.trimStart().startsWith('#EXTM3U'))

      const responseData = shouldRewriteManifest
        ? rewriteManifest(data, context.url, channelId)
        : data

      this.stats.loading.end = performance.now()
      this.stats.loaded =
        typeof responseData === 'string' ? responseData.length : responseData.byteLength
      this.stats.total = this.stats.loaded

      callbacks.onSuccess(
        {
          url: proxiedUrl,
          data: responseData,
          code: response.status,
          text: typeof responseData === 'string' ? responseData : undefined,
        },
        this.stats,
        context,
        null,
      )
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }
      this.stats.loading.end = performance.now()
      callbacks.onError(
        {
          code: 0,
          text: error instanceof Error ? error.message : 'Request failed',
        },
        context,
        null,
        this.stats,
      )
    }
  }
}