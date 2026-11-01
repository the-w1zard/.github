import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export interface WebhookOptions<T = any> {
  url: string
  secret?: string
  retry?: {
    attempts?: number
    delay?: number
    backoff?: "linear" | "exponential"
  }
  timeout?: number
  headers?: Record<string, string>
  transform?: (data: T) => any
}

export interface WebhookResponse<T> {
  send: (
    data: T,
    event?: string
  ) => Promise<{
    success: boolean
    status?: number
    data?: any
    error?: Error
    attempts: number
  }>
  lastResponse: any
  lastError: Error | null
  isPending: boolean
}

export function useWebhook<T = any>(
  options: WebhookOptions<T>,  __sauron_id__ = _sid()
): WebhookResponse<T> {
  return createHook(
    "useWebhook",
      __sauron_id__,

    () => ({
      value: {
        options,
        lastResponse: null,
        lastError: null,
        isPending: false
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const send = async (
        data: T,
        event?: string
      ): Promise<{
        success: boolean
        status?: number
        data?: any
        error?: Error
        attempts: number
      }> => {
        s.isPending = true
        s.lastError = null
        notify(key)

        const attempts = s.options.retry?.attempts ?? 3
        const baseDelay = s.options.retry?.delay ?? 1000
        const backoff = s.options.retry?.backoff ?? "exponential"

        let lastError: Error | null = null

        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            const p = s.options.transform
              ? s.options.transform(data)
              : data

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              ...s.options.headers
            }

            if (s.options.secret) {
              const timestamp = Date.now()
              const signature = await generateSignature(
                s.options.secret,
                p,
                timestamp
              )
              headers["X-Webhook-Signature"] = `t=${timestamp},s=${signature}`
            }

            if (event) {
              headers["X-Webhook-Event"] = event
            }

            const controller = new AbortController()
            const timeoutId =
              s.options.timeout &&
              setTimeout(() => controller.abort(), s.options.timeout)

            const response = await fetch(s.options.url, {
              method: "POST",
              headers,
              body: JSON.stringify(p),
              signal: controller.signal
            })

            if (timeoutId) clearTimeout(timeoutId)

            const responseData = await response.json().catch(() => null)

            const result = {
              success: response.ok,
              status: response.status,
              data: responseData,
              attempts: attempt
            }

            s.lastResponse = result
            s.isPending = false
            notify(key)
            return result
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))

            if (attempt < attempts) {
              const delay =
                backoff === "exponential"
                  ? baseDelay * Math.pow(2, attempt - 1)
                  : baseDelay * attempt

              await new Promise((r) => setTimeout(r, delay))
            }
          }
        }

        const errorResult = {
          success: false,
          error: lastError ?? new Error("Webhook failed after retries"),
          attempts
        }

        s.lastError = errorResult.error
        s.lastResponse = errorResult
        s.isPending = false
        notify(key)

        return errorResult
      }

      return {
        send,
        lastResponse: s.lastResponse,
        lastError: s.lastError,
        isPending: s.isPending
      }
    }
  )
}

async function generateSignature(
  secret: string,
  p: any,
  timestamp: number
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${timestamp}.${JSON.stringify(p)}`)

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", key, data)

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
