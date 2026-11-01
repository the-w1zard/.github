import { createHook } from '#the-cloud'

export interface ProxyTarget {
  url: string
  weight?: number
  timeout?: number
  headers?: Record<string, string>
}

export interface ProxyOptions {
  targets: ProxyTarget[]
  strategy?: "round-robin" | "random" | "least-connections" | "ip-hash"
  timeout?: number
  retries?: number
  retryDelay?: number
  preserveHost?: boolean
  stripPath?: string
  appendPath?: boolean
  modifyResponse?: (response: Response, req: Request) => Promise<Response>
}

export function useReverseProxy(
  options: ProxyOptions,
  __sauron_id__ = _sid()
) {
  return createHook(
    "useReverseProxy",
    __sauron_id__,

    () => ({
      value: {
        options,
        currentIndex: 0,
        connections: new Map<string, number>()
      }
    }),

    (state) => {
      const s = state.value

      const selectTarget = (request: Request): ProxyTarget => {
        const targets = s.options.targets

        switch (s.options.strategy) {
          case "round-robin": {
            const t = targets[s.currentIndex % targets.length]
            s.currentIndex++
            return t
          }

          case "random":
            return targets[Math.floor(Math.random() * targets.length)]

          case "least-connections":
            return targets.reduce((prev, curr) => {
              const a = s.connections.get(prev.url) || 0
              const b = s.connections.get(curr.url) || 0
              return a < b ? prev : curr
            })

          case "ip-hash": {
            const ip =
              request.headers.get("x-forwarded-for") ||
              request.headers.get("x-real-ip") ||
              "unknown"
            const hash = Array.from(ip).reduce(
              (acc, c) => acc + c.charCodeAt(0),
              0
            )
            return targets[hash % targets.length]
          }

          default:
            return targets[0]
        }
      }

      const buildUrl = (target: ProxyTarget, request: Request): string => {
        const url = new URL(request.url)
        let targetUrl = target.url

        if (s.options.stripPath) {
          const path = url.pathname.replace(s.options.stripPath, "")
          targetUrl += path
        } else if (s.options.appendPath !== false) {
          targetUrl += url.pathname
        }

        if (url.search) targetUrl += url.search

        return targetUrl
      }

      const forward = async (request: Request): Promise<Response> => {
        const target = selectTarget(request)
        const targetUrl = buildUrl(target, request)

        const current = s.connections.get(target.url) || 0
        s.connections.set(target.url, current + 1)

        try {
          const headers = new Headers(request.headers)

          if (!s.options.preserveHost) {
            const host = new URL(target.url).host
            headers.set("Host", host)
          }

          if (target.headers) {
            for (const [k, v] of Object.entries(target.headers)) {
              headers.set(k, v)
            }
          }

          const controller = new AbortController()
          const timeout = target.timeout || s.options.timeout || 30000
          const timeoutId = setTimeout(() => controller.abort(), timeout)

          let response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body:
              request.method !== "GET" && request.method !== "HEAD"
                ? request.body
                : undefined,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (s.options.modifyResponse) {
            response = await s.options.modifyResponse(response, request)
          }

          return response
        } catch (err) {
          if (s.options.retries && s.options.retries > 0) {
  const retryCount = parseInt(
    request.headers.get("x-retry-count") || "0"
  )

  if (retryCount < s.options.retries) {
    // Convert Headers to a plain object properly
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    
    const retryRequest = new Request(request, {
      headers: new Headers({
        ...headersObj,
        "x-retry-count": String(retryCount + 1)
      })
    })

    await new Promise((r) =>
      setTimeout(r, s.options.retryDelay || 1000)
    )

    return forward(retryRequest)
  }
}

          throw err
        } finally {
          const current = s.connections.get(target.url) || 0
          s.connections.set(target.url, Math.max(0, current - 1))
        }
      }

      return forward
    }
  )
}

export function createProxyHandler(
  proxy: ReturnType<typeof useReverseProxy>
) {
  return async (request: Request) => {
    try {
      return await proxy(request)
    } catch (err: any) {
      return new Response("Proxy Error: " + err.message, {
        status: 502,
        headers: { "Content-Type": "text/plain" }
      })
    }
  }
}
