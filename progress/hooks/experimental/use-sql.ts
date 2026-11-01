import { _sid, createHook, state as HookState, notifyHook, root } from '#the-cloud'

export interface SQLResult {
  changes: number
  lastInsertRowid: number
}

export interface SQLDatabase {
  exec(sql: string): Promise<void>
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>
  run(sql: string, params?: any[]): Promise<SQLResult>
  transaction<T>(fn: () => Promise<T>): Promise<T>
  close(): Promise<void>
}

export interface SQLConfig {
  open: () => Promise<SQLDatabase>
  name?: string
}

export function useSQL(config: SQLConfig, __sauron_id__ = _sid()) {
  return createHook(
    'useSQL',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        db: null as SQLDatabase | null,
        ready: root.SIGNALS.atom(false),
        error: root.SIGNALS.atom<Error | null>(null),
        name: config.name ?? 'default-sql'
      },
      cleanup() {
        const v = (this as any).value
        if (v.db) v.db.close().catch(() => {})
      }
    }),

    // ───────────────────────────────────────── updater
    async (hook, key) => {
      const v = hook.value

      // Initialize DB if not already open
      if (!v.db) {
        try {
          v.db = await config.open()
          v.ready.value = true
          notifyHook(key)
        } catch (err) {
          v.error.value = err as Error
          notifyHook(key)
        }
      }

      if (!v.db) {
        throw new Error('SQL database failed to initialize')
      }

      // Public API
      const exec = async (sql: string) => {
        await v.db!.exec(sql)
      }

const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  return v.db!.query(sql, params) as Promise<T[]>
}

const get = async <T = any>(sql: string, params?: any[]): Promise<T | undefined> => {
  return v.db!.get(sql, params) as Promise<T | undefined>
}


      const run = async (sql: string, params?: any[]): Promise<SQLResult> => {
        return v.db!.run(sql, params)
      }

      const transaction = async <R>(fn: () => Promise<R>): Promise<R> => {
        return v.db!.transaction(fn)
      }

      const close = async () => {
        if (v.db) {
          await v.db.close()
          v.db = null
          v.ready.value = false
          notifyHook(key)
        }
      }

      return {
        ready: v.ready.value,
        error: v.error.value,

        exec,
        query,
        get,
        run,
        transaction,
        close
      }
    }
  )
}
