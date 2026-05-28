import { buildProxyUrl } from './playlist'

function createStats() {
  return {
    aborted: false,
    loaded: 0,
    retry: 0,
    total: 0,
    chunkCount: 0,
    bwEstimate: 0,
    loading: {
      start: 0,
      first: 0,
      end: 0,
      timeout: 0,
    },
    parsing: {
      start: 0,
      end: 0,
    },
    buffering: {
      start: 0,
      first: 0,
      end: 0,
    },
  }
}

export default class ProxyLoader {
  constructor() {
    this.context = null
    this.callbacks = null
    this.controller = null
    this.stats = createStats()
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

    if (this.callbacks?.onAbort && this.context) {
      this.callbacks.onAbort(this.stats, this.context, null)
    }
  }

  async load(context, _config, callbacks) {
    this.context = context
    this.callbacks = callbacks
    this.controller = new AbortController()
    this.stats = createStats()
    this.stats.loading.start = performance.now()

    const proxiedUrl = buildProxyUrl(context.url)

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

      this.stats.loading.end = performance.now()
      this.stats.loaded = typeof data === 'string' ? data.length : data.byteLength
      this.stats.total = this.stats.loaded

      callbacks.onSuccess(
        {
          url: proxiedUrl,
          data,
          code: response.status,
          text: typeof data === 'string' ? data : undefined,
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
