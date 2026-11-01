import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface StreamState {
  data: any[]
  error: any
  done: boolean
  reading: boolean
  stream: ReadableStream | null
}

export function useStream(
  stream: ReadableStream,
  options: {
    onChunk?: (chunk: any, all: any[]) => void
    onComplete?: (all: any[]) => void
    onError?: (err: any) => void
  } = {},
  __sauron_id__ = _sid()
) {
  const { onChunk, onComplete, onError } = options

  return createHook(
    "useStream",
    __sauron_id__,

    () => ({
      value: {
        data: [],
        error: null,
        done: false,
        reading: false,
        stream
      } as StreamState
    }),

    (state, key, notify) => {
      const s = state.value

      const start = async () => {
        if (s.reading || !s.stream) return

        s.reading = true
        notify(key)

        const reader = s.stream.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            s.data.push(value)
            onChunk?.(value, s.data)
            notify(key)
          }

          s.done = true
          onComplete?.(s.data)
        } catch (err) {
          s.error = err
          onError?.(err)
        } finally {
          s.reading = false
          reader.releaseLock()
          notify(key)
        }
      }

      const stop = () => {}

      const getData = () => s.data

      return [
        {
          data: s.data,
          error: s.error,
          done: s.done,
          reading: s.reading
        },
        start,
        stop,
        getData
      ] as const
    }
  )
}
