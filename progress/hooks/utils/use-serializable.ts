import { createHook } from '#the-cloud'

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | { [key: string]: SerializableValue }

type TransportFormat = "json" | "base64" | "urlencoded" | "binary"

interface SerializeOptions {
  format?: TransportFormat
  compress?: boolean
  encrypt?: boolean
  encryptionKey?: string
}

const encode: Record<TransportFormat, (v: SerializableValue) => any> = {
  json: (v) => JSON.stringify(v),

  base64: (v) => {
    const json = JSON.stringify(v)
    if (typeof btoa !== "undefined")
      return btoa(unescape(encodeURIComponent(json)))
    return Buffer.from(json).toString("base64")
  },

  urlencoded: (v) => {
    const flatten = (obj: any, prefix = ""): string =>
      Object.entries(obj)
        .map(([k, val]) => {
          const key = prefix ? `${prefix}[${k}]` : k
          if (val && typeof val === "object" && !Array.isArray(val))
            return flatten(val, key)
          if (Array.isArray(val))
            return val
              .map(
                (item, i) =>
                  `${key}[${i}]=${encodeURIComponent(String(item))}`
              )
              .join("&")
          return `${encodeURIComponent(key)}=${encodeURIComponent(
            String(val)
          )}`
        })
        .join("&")

    return typeof v === "object" && v !== null
      ? flatten(v)
      : encodeURIComponent(String(v))
  },

  binary: (v) => {
    const json = JSON.stringify(v)
    if (typeof TextEncoder !== "undefined")
      return new TextEncoder().encode(json)
    return Buffer.from(json)
  }
}

const decode: Record<TransportFormat, (v: any) => any> = {
  json: (v) => JSON.parse(v),

  base64: (v) => {
    let json: string
    if (typeof atob !== "undefined")
      json = decodeURIComponent(escape(atob(v)))
    else json = Buffer.from(v, "base64").toString("utf-8")
    return JSON.parse(json)
  },

urlencoded: (v: string) => {
  const result: Record<string, any> = {}
  if (!v) return result

  const pairs = v.split("&")

  for (const pair of pairs) {
    if (!pair) continue

    const [rawKey, rawVal] = pair.split("=")
    const key = decodeURIComponent(rawKey || "")
    const val = decodeURIComponent(rawVal || "")

    // Parse nested keys WITHOUT regex
    // Example: "user[address][street]" → ["user", "address", "street"]
    const keys: string[] = []
    let buffer = ""
    let insideBracket = false

    for (const char of key) {
      if (char === "[") {
        if (buffer) keys.push(buffer)
        buffer = ""
        insideBracket = true
      } else if (char === "]") {
        if (buffer) keys.push(buffer)
        buffer = ""
        insideBracket = false
      } else {
        buffer += char
      }
    }

    if (buffer) keys.push(buffer)

    // Build nested structure
    let cur: any = result
    keys.forEach((k, i) => {
      const last = i === keys.length - 1
      if (last) {
        cur[k] = val
      } else {
        if (cur[k] == null || typeof cur[k] !== "object") {
          cur[k] = {}
        }
        cur = cur[k]
      }
    })
  }

  return result
},


  binary: (v) => {
    const json =
      typeof TextDecoder !== "undefined"
        ? new TextDecoder().decode(v)
        : (v as Buffer).toString("utf-8")
    return JSON.parse(json)
  }
}

const simpleXor = (data: string, key: string): string =>
  data
    .split("")
    .map((c, i) =>
      String.fromCharCode(
        c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
      )
    )
    .join("")

export function useSerializable<T extends SerializableValue>(
  initial: T,
  options: SerializeOptions = {},
  __sauron_id__ = _sid()
) {
  const {
    format = "json",
    compress = false,
    encrypt = false,
    encryptionKey = ""
  } = options

  return createHook(
    "useSerializable",
    __sauron_id__,

    () => ({
      value: {
        value: initial,
        serialized: null as any,
        error: null as string | null
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const serialize = (v: T): any => {
        let val: SerializableValue = v

        if (encrypt && encryptionKey) {
          const json = JSON.stringify(val)
          val = simpleXor(json, encryptionKey)
        }

        if (compress && typeof val === "string") {
          val = val.replace(/(.)\1{2,}/g, (match, char) => {
            return `${char}×${match.length}`
          })
        }

        return encode[format](val)
      }

      const deserialize = (raw: any): T => {
        let val = decode[format](raw)

        if (compress && typeof val === "string") {
          val = val.replace(
            /(.?)×(\d+)/g,
            (_: string, char: string, count: string) =>
              char.repeat(Number(count))
          )
        }

        if (encrypt && encryptionKey && typeof val === "string") {
          val = JSON.parse(simpleXor(val, encryptionKey))
        }

        return val as T
      }

      const set = (v: T) => {
        try {
          s.value = v
          s.serialized = serialize(v)
          s.error = null
          notify(key)
        } catch (e: any) {
          s.error = e?.message ?? "Serialization failed"
          notify(key)
        }
      }

      const hydrate = (raw: any): T | null => {
        try {
          const v = deserialize(raw)
          s.value = v
          s.serialized = raw
          s.error = null
          notify(key)
          return v
        } catch (e: any) {
          s.error = e?.message ?? "Deserialization failed"
          notify(key)
          return null
        }
      }

      const transport = () => ({
        p: s.serialized ?? serialize(s.value),
        format,
        version: 1,
        timestamp: Date.now()
      })

      return [
        s.value,
        {
          set,
          hydrate,
          serialize,
          deserialize,
          transport,
          error: s.error
        }
      ] as const
    }
  )
}
