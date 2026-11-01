import { createHook, state as  HookState, notifyHook } from '#the-cloud'
import { useSQL } from '#sauron'
import { signal } from '#the-cloud'

export interface CodeMigration<T = any> {
  version: number
  name: string
  describe?: string
  up: (context: MigrationContext<T>) => Promise<void>
  down?: (context: MigrationContext<T>) => Promise<void>
  validate?: (context: MigrationContext<T>) => Promise<boolean>
}

export interface MigrationContext<T = any> {
  db: ReturnType<typeof useSQL>
  data: T
  setData: (data: T) => void
  query: <R = any>(sql: string, params?: any[]) => Promise<R[]>
  get: <R = any>(sql: string, params?: any[]) => Promise<R | undefined>
  run: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid: number }>
  transaction: <R>(fn: () => Promise<R>) => Promise<R>
  log: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export function useCodeMigration<T = any>(
  migrations: CodeMigration<T>[],
  options: {
    tableName?: string
    dataTable?: string
    autoMigrate?: boolean
    onProgress?: (version: number, name: string, status: 'start' | 'complete' | 'error') => void
  } = {},
  __sauron_id__ = _sid()
) {
  const {
    tableName = '_code_migrations',
    dataTable = '_migration_data',
    autoMigrate = false,
    onProgress
  } = options

  return createHook(
    'useCodeMigration',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const sorted = migrations.slice().sort((a, b) => a.version - b.version)

      return {
        value: {
          migrations: sorted,
          tableName,
          dataTable,
          db: null as ReturnType<typeof useSQL> | null,
          currentData: null as T | null,
          applied: [] as { version: number; name: string; applied_at: number; checksum: string }[],
          status: signal<'idle' | 'migrating' | 'error'>('idle'),
          error: signal<Error | null>(null),
          subscribers: new Set<() => void>()
        },
        cleanup() {
          const v = (this as any).value
          v.subscribers.clear()
        }
      }
    },

    // ───────────────────────────────────────── updater
    async (hook, key) => {
      const v = hook.value

      const init = (db: ReturnType<typeof useSQL>) => {
        v.db = db
        notifyHook(key)
      }

      const setup = async () => {
        if (!v.db) throw new Error('Database not connected')

        await v.db.exec(`
          CREATE TABLE IF NOT EXISTS ${v.tableName} (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at INTEGER NOT NULL,
            checksum TEXT NOT NULL,
            execution_time INTEGER
          )
        `)

        await v.db.exec(`
          CREATE TABLE IF NOT EXISTS ${v.dataTable} (
            key TEXT PRIMARY KEY,
            value TEXT,
            version INTEGER,
            updated_at INTEGER
          )
        `)

        v.applied = await v.db.query(
          `SELECT version, name, applied_at, checksum FROM ${v.tableName} ORDER BY version ASC`
        )

       const row = await v.db.get(
  `SELECT value FROM ${v.dataTable} WHERE key = 'data'`
) as { value: string } | undefined


        if (row) {
          try {
            v.currentData = JSON.parse(row.value)
          } catch {}
        }

        notifyHook(key)
      }

      const checksum = (migration: CodeMigration<T>): string => {
        const content = migration.up.toString() + (migration.down?.toString() || '')
        let hash = 0
        for (let i = 0; i < content.length; i++) {
          const c = content.charCodeAt(i)
          hash = ((hash << 5) - hash) + c
          hash |= 0
        }
        return hash.toString(16)
      }

      const createContext = (): MigrationContext<T> => ({
        db: v.db!,
        data: v.currentData as T,
        setData: (data: T) => {
          v.currentData = data
        },
        query: v.db!.query.bind(v.db),
        get: v.db!.get.bind(v.db),
        run: v.db!.run.bind(v.db),
        transaction: v.db!.transaction.bind(v.db),
        log: (m) => console.log('[Migration]', m),
        warn: (m) => console.warn('[Migration]', m),
        error: (m) => console.error('[Migration]', m)
      })

      const apply = async (migration: CodeMigration<T>) => {
        if (!v.db) throw new Error('Database not connected')

        const start = Date.now()
        const sum = checksum(migration)

        onProgress?.(migration.version, migration.name, 'start')
        v.status.value = 'migrating'
        notifyHook(key)
        v.subscribers.forEach(cb => cb())

        try {
          const ctx = createContext()

          if (migration.validate) {
            const ok = await migration.validate(ctx)
            if (!ok) throw new Error(`Validation failed for migration ${migration.version}`)
          }

          await migration.up(ctx)

          if (ctx.data !== v.currentData) {
            v.currentData = ctx.data
            await v.db.run(
              `INSERT OR REPLACE INTO ${v.dataTable} (key, value, version, updated_at) VALUES (?, ?, ?, ?)`,
              ['data', JSON.stringify(ctx.data), migration.version, Date.now()]
            )
          }

          await v.db.run(
            `INSERT INTO ${v.tableName} (version, name, applied_at, checksum, execution_time) VALUES (?, ?, ?, ?, ?)`,
            [migration.version, migration.name, start, sum, Date.now() - start]
          )

          v.applied.push({
            version: migration.version,
            name: migration.name,
            applied_at: start,
            checksum: sum
          })

          v.status.value = 'idle'
          v.error.value = null

          onProgress?.(migration.version, migration.name, 'complete')
          notifyHook(key)
          v.subscribers.forEach(cb => cb())
        } catch (err) {
          v.status.value = 'error'
          v.error.value = err as Error
          onProgress?.(migration.version, migration.name, 'error')
          notifyHook(key)
          v.subscribers.forEach(cb => cb())
          throw err
        }
      }

      const revert = async (migration: CodeMigration<T>) => {
        if (!v.db) throw new Error('Database not connected')
        if (!migration.down) throw new Error(`Migration ${migration.version} has no down()`)

        onProgress?.(migration.version, migration.name, 'start')
        v.status.value = 'migrating'
        notifyHook(key)

        try {
          const ctx = createContext()
          await migration.down(ctx)

          if (ctx.data !== v.currentData) {
            v.currentData = ctx.data
            await v.db.run(
              `INSERT OR REPLACE INTO ${v.dataTable} (key, value, version, updated_at) VALUES (?, ?, ?, ?)`,
              ['data', JSON.stringify(ctx.data), migration.version, Date.now()]
            )
          }

          await v.db.run(`DELETE FROM ${v.tableName} WHERE version = ?`, [migration.version])

          v.applied = v.applied.filter(a => a.version !== migration.version)
          v.status.value = 'idle'
          v.error.value = null

          onProgress?.(migration.version, migration.name, 'complete')
          notifyHook(key)
          v.subscribers.forEach(cb => cb())
        } catch (err) {
          v.status.value = 'error'
          v.error.value = err as Error
          onProgress?.(migration.version, migration.name, 'error')
          notifyHook(key)
          throw err
        }
      }

      const up = async (target?: number) => {
        if (!v.db) throw new Error('Database not connected')
        await setup()

        const appliedSet = new Set(v.applied.map(a => a.version))
        const pending = v.migrations
          .filter(m => !appliedSet.has(m.version))
          .filter(m => !target || m.version <= target)

        for (const m of pending) {
          await apply(m)
        }
      }

      const down = async (steps = 1) => {
        if (!v.db) throw new Error('Database not connected')
        await setup()

        const toRevert = v.applied
          .slice()
          .sort((a, b) => b.version - a.version)
          .slice(0, steps)

        for (const rec of toRevert) {
          const m = v.migrations.find(x => x.version === rec.version)
          if (m) await revert(m)
        }
      }

      if (autoMigrate && v.db) {
        await setup()
        const appliedSet = new Set(v.applied.map(a => a.version))
        const pending = v.migrations.filter(m => !appliedSet.has(m.version))
        if (pending.length > 0) await up()
      }

      const useStatus = () => {
        return createHook(
          'useCodeMigrationStatus',
          _sid(),
          (): HookState => ({
            value: {
              applied: v.applied,
              pending: v.migrations.filter(m => !v.applied.some(a => a.version === m.version)),
              data: v.currentData,
              status: v.status.value,
              error: v.error.value
            },
            cleanup() {}
          }),
          (statusHook, statusKey) => {
            const update = () => {
              statusHook.value.applied = v.applied
              statusHook.value.pending = v.migrations.filter(m => !v.applied.some(a => a.version === m.version))
              statusHook.value.data = v.currentData
              statusHook.value.status = v.status.value
              statusHook.value.error = v.error.value
              notifyHook(statusKey)
            }

            v.subscribers.add(update)

            return [{
              applied: statusHook.value.applied,
              pending: statusHook.value.pending,
              data: statusHook.value.data,
              status: statusHook.value.status,
              error: statusHook.value.error
            }]
          }
        )
      }

      return {
        applied: v.applied,
        pending: v.db ? v.migrations.filter(m => !v.applied.some(a => a.version === m.version)) : [],
        data: v.currentData,
        status: v.status.value,
        error: v.error.value,

        init,
        setup,
        up,
        down,

        run: async (version: number) => {
          const m = v.migrations.find(x => x.version === version)
          if (!m) throw new Error(`Migration ${version} not found`)
          await apply(m)
        },

        reset: async () => {
          if (!v.db) throw new Error('Database not connected')

          v.currentData = null
          await v.db.run(`DELETE FROM ${v.dataTable} WHERE key = 'data'`)
          await v.db.run(`DELETE FROM ${v.tableName}`)
          v.applied = []

          await up()
        },

        subscribe: (cb: () => void) => {
          v.subscribers.add(cb)
          return () => v.subscribers.delete(cb)
        },

        useStatus
      }
    }
  )
}
