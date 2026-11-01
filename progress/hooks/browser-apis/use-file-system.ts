import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useFileSystem — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic state updates, stable actions
// ───────────────────────────────────────────────

export function useFileSystem(__sauron_id__ = _sid()) {
  return createHook(
    'useFileSystem',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        handle: null as FileSystemFileHandle | null,
        file: null as File | null,
        contents: null as string | null,
        error: null as any,
        supported: typeof window !== 'undefined' &&
          typeof (window as any).showOpenFilePicker === 'function'
      }
    }),

    // ───────────────────────────────────────── updater
    (hook, key) => {
      const s = hook.value

      const open = async (options: any = {}) => {
        if (!s.supported) {
          s.error = 'File System Access API not supported'
          notifyHook(key)
          return
        }

        try {
          const [handle] = await (window as any).showOpenFilePicker(options)
          s.handle = handle

          const file = await handle.getFile()
          s.file = file

          const contents = await file.text()
          s.contents = contents

          notifyHook(key)
          return { handle, file, contents }
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            s.error = err
            notifyHook(key)
          }
        }
      }

      const save = async (contents: string, options: any = {}) => {
        if (!s.supported) return

        try {
          const handle = await (window as any).showSaveFilePicker(options)
          const writable = await handle.createWritable()
          await writable.write(contents)
          await writable.close()

          s.handle = handle
          s.contents = contents

          notifyHook(key)
          return handle
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            s.error = err
            notifyHook(key)
          }
        }
      }

      const read = async (handle: FileSystemFileHandle) => {
        try {
          const file = await handle.getFile()
          const contents = await file.text()

          s.handle = handle
          s.file = file
          s.contents = contents

          notifyHook(key)
          return { file, contents }
        } catch (err: any) {
          s.error = err
          notifyHook(key)
        }
      }

      return [
        {
          handle: s.handle,
          file: s.file,
          contents: s.contents,
          error: s.error,
          supported: s.supported
        },
        { open, save, read }
      ]
    }
  )
}
