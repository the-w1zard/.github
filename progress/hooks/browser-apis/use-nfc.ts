import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export function useNFC(__sauron_id__ = _sid()) {
  return createHook(
    "useNFC",
    __sauron_id__,
    () => ({
      scanning: false,
      message: null,
      error: null,
      supported:
        typeof window !== "undefined" &&
        typeof (window as any).NDEFReader !== "undefined"
    }),

    (hookState, key, notify) => {
      const s = hookState.value
      let reader: any = null

      //
      // Attach cleanup once
      //
      if (!hookState.cleanup) {
        hookState.cleanup = () => {
          if (reader) {
            try { reader.stop?.() } catch {}
            reader = null
          }
        }
      }

      //
      // Start scanning
      //
      const scan = async () => {
        if (!s.supported) {
          s.error = "NFC not supported"
          notify(key)
          return
        }

        try {
          reader = new (window as any).NDEFReader()
          s.scanning = true
          notify(key)

          const onReading = (event: any) => {
            s.message = {
              serialNumber: event.serialNumber,
              records: event.message.records.map((record: any) => ({
                recordType: record.recordType,
                data: record.data,
                encoding: record.encoding,
                lang: record.lang
              }))
            }
            notify(key)
          }

          const onReadingError = (err: any) => {
            s.error = err
            notify(key)
          }

          reader.addEventListener("reading", onReading)
          reader.addEventListener("readingerror", onReadingError)

          await reader.scan()
        } catch (err) {
          s.error = err
          s.scanning = false
          notify(key)
        }
      }

      //
      // Stop scanning
      //
      const stop = () => {
        if (reader) {
          try { reader.stop?.() } catch {}
          reader = null
        }
        s.scanning = false
        notify(key)
      }

      //
      // Write to NFC tag
      //
      const write = async (message: any) => {
        if (!s.supported) return false

        try {
          const writer = new (window as any).NDEFWriter()
          await writer.write(message)
          return true
        } catch (err) {
          console.error("NFC write failed:", err)
          return false
        }
      }

      return [
        {
          scanning: s.scanning,
          message: s.message,
          error: s.error,
          supported: s.supported
        },
        { scan, stop, write }
      ]
    }
  )
}
