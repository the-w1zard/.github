import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export interface SignatureVerificationOptions {
  secret: string
  tolerance?: number
  algorithm?: "sha256" | "sha512"
}

export function useWebhookSignature(options: SignatureVerificationOptions,  __sauron_id__ = _sid()) {
  return createHook(
    "useWebhookSignature",
     __sauron_id__,

    () => ({
      value: {
        options
      }
    }),

    (hookState) => {
      const s = hookState.value as { options: SignatureVerificationOptions }

      const sign = async (
        p: any,
        timestamp: number = Date.now()
      ): Promise<string> => {
        const encoder = new TextEncoder()
        const data = encoder.encode(`${timestamp}.${JSON.stringify(p)}`)

        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(s.options.secret),
          {
            name: "HMAC",
            hash: s.options.algorithm === "sha512" ? "SHA-512" : "SHA-256"
          },
          false,
          ["sign"]
        )

        const signature = await crypto.subtle.sign("HMAC", key, data)

        return Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      }

      const verify = async (
        p: any,
        signature: string,
        timestamp?: number
      ): Promise<boolean> => {
        if (timestamp && s.options.tolerance) {
          const now = Date.now()
          if (Math.abs(now - timestamp) > s.options.tolerance) {
            return false
          }
        }

        const expected = await sign(p, timestamp)
        return signature === expected
      }

      const extractFromHeaders = (
        headers: Record<string, string>
      ): { signature: string; timestamp: number } | null => {
        const header =
          headers["x-webhook-signature"] ||
          headers["x-signature"] ||
          headers["signature"]

        if (!header) return null

        const match = header.match(/t=(\d+),s=([a-f0-9]+)/)
        if (match) {
          return {
            timestamp: parseInt(match[1], 10),
            signature: match[2]
          }
        }

        return {
          timestamp: Date.now(),
          signature: header
        }
      }

      return {
        verify,
        sign,
        extractFromHeaders
      }
    }
  )
}
