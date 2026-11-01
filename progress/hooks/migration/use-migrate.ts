export function useMigrate() {
  return null
}


/**import { createHook, HookState } from '#the-cloud'
import { _sid } from './_sid'
import { useSQL } from '#sauron'

// Extract the raw database instance layout from the Promise type
type SQLDatabase = useSQL extends (...args: any[]) => Promise<infer T> ? T : ReturnType<typeof useSQL>;

export interface Migration {
  version: number
  name:    string
  up:      string | ((db: SQLDatabase) => Promise<void>)
  down?:   string | ((db: SQLDatabase) => Promise<void>)
}

interface MigrateHookState extends HookState {
  // Await/unwrap the Promise layout so the properties are directly accessible
  db:          SQLDatabase
  migrations:  Migration[]
  tableName:   string
  applied:     { version: number; name: string; applied_at: number }[]
  pending:     Migration[]
  status:      'idle' | 'migrating' | 'error' | 'loading'
  error:       Error | null
  subscribers: Set<() => void>
  initialized: boolean // Anti-infinite-loop guard toggle
}

export function useMigrate(
  dbPromise:  ReturnType<typeof useSQL>, // Keeps consumer signature clean
  options: { migrations: Migration[] | string; tableName?: string; autoMigrate?: boolean } = { migrations: [] },
  __sauron_id__ = _sid()
) {
  const { migrations, tableName = '_migrations', autoMigrate = false } = options

  return createHook(
    'useMigrate',
    __sauron_id__,
    (): MigrateHookState => {
      const s: MigrateHookState = {
        value:       undefined,
        db:          null as any, // Resolved inside the initializer/updater phase
        migrations:  [],
        tableName,
        applied:     [],
        pending:     [],
        status:      'loading',
        error:       null,
        subscribers: new Set(),
        initialized: false
      }
      s.cleanup = () => s.subscribers.clear()
      return s
    },
    (s: HookState, key, notify) => {
      const state = s as MigrateHookState

      const init = async () => {
        // Guard clause to block the downstream re-evaluation loop cascades
        if (state.initialized) return
        state.initialized = true

        try {
          // Cleanly unwrap the db Promise instance right away 
          state.db = await dbPromise

          await state.db.exec(`
            CREATE TABLE IF NOT EXISTS ${state.tableName} (
              version INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              applied_at INTEGER NOT NULL,
              checksum TEXT
            )
          `)

          const loadMigrations = async (): Promise<Migration[]> => {
            if (Array.isArray(migrations)) return migrations
            try {
              if (typeof Deno !== 'undefined') {
                const files: string[] = []
                for await (const entry of (Deno as any).readDir(migrations)) {
                  if (entry.isFile && /\.(sql|ts|js)$/.test(entry.name)) files.push(entry.name)
                }
                files.sort()
                const loaded: Migration[] = []
                for (const file of files) {
                  const content = await (Deno as any).readTextFile(`${migrations}/${file}`)
                  const match   = file.match(/^(\d+)_(.+)\.(sql|ts|js)$/)
                  if (!match) continue
                  loaded.push({ version: parseInt(match[1]), name: match[2], up: content })
                }
                return loaded
              } else if (typeof process !== 'undefined') {
                const fs   = await import('fs/promises')
                const path = await import('path')
                const files = (await fs.readdir(migrations as string)).filter(f => /\.(sql|ts|js)$/.test(f)).sort()
                const loaded: Migration[] = []
                for (const file of files) {
                  const content = await fs.readFile(path.join(migrations as string, file), 'utf-8')
                  const match   = file.match(/^(\d+)_(.+)\.(sql|ts|js)$/)
                  if (!match) continue
                  loaded.push({ version: parseInt(match[1]), name: match[2], up: content })
                }
                return loaded
              }
            } catch (e) { console.error('Failed to load migrations:', e) }
            return []
          }

          state.migrations = await loadMigrations()
          state.applied    = await state.db.query<{ version: number; name: string; applied_at: number }>(
            `SELECT version, name, applied_at FROM ${state.tableName} ORDER BY version ASC`
          )
          const appliedVersions = new Set(state.applied.map(a => a.version))
          state.pending = state.migrations.filter(m => !appliedVersions.has(m.version)).sort((a, b) => a.version - b.version)
          state.status = 'idle'
          notify(key)

          if (autoMigrate && state.pending.length > 0) {
            for (const m of state.pending) await apply(m)
          }
        } catch (e) {
          state.status = 'error'
          state.error = e as Error
          notify(key)
        }
      }

      const apply = async (migration: Migration) => {
        state.status = 'migrating'
        notify(key)
        try {
          if (typeof migration.up === 'string') {
            const stmts = migration.up.split(';').map(s => s.trim()).filter(Boolean)
            await state.db.transaction(async () => { for (const stmt of stmts) await state.db.exec(stmt) })
          } else {
            await migration.up(state.db)
          }
          await state.db.run(`INSERT INTO ${state.tableName} (version, name, applied_at) VALUES (?, ?, ?)`, [migration.version, migration.name, Date.now()])
          state.applied.push({ version: migration.version, name: migration.name, applied_at: Date.now() })
          state.pending = state.pending.filter(m => m.version !== migration.version)
          state.status  = 'idle'
          state.subscribers.forEach(cb => cb())
          notify(key)
          console.log(`✅ Applied ${migration.version}_${migration.name}`)
        } catch (e) {
          state.status = 'error'
          state.error  = e as Error
          notify(key)
          throw e
        }
      }

      init()

      return {
        get applied()  { return state.applied },
        get pending()  { return state.pending },
        get status()   { return state.status },
        get error()    { return state.error },

        up: async (target?: number) => {
          const toApply = target ? state.pending.filter(m => m.version <= target) : state.pending
          for (const m of toApply) await apply(m)
        },

        down: async (steps = 1) => {
          const toRevert = state.applied.slice(-steps).reverse()
          for (const record of toRevert) {
            const migration = state.migrations.find(m => m.version === record.version)
            if (!migration?.down) throw new Error(`Migration ${record.version} has no down migration`)
            state.status = 'migrating'
            notify(key)
            try {
              if (typeof migration.down === 'string') {
                const stmts = migration.down.split(';').map(s => s.trim()).filter(Boolean)
                await state.db.transaction(async () => { for (const stmt of stmts) await state.db.exec(stmt) })
              } else {
                await migration.down(state.db)
              }
              await state.db.run(`DELETE FROM ${state.tableName} WHERE version = ?`, [record.version])
              state.applied = state.applied.filter(a => a.version !== record.version)
              state.pending = [migration, ...state.pending].sort((a, b) => a.version - b.version)
              state.status  = 'idle'
              state.subscribers.forEach(cb => cb())
              notify(key)
              console.log(`↩️ Reverted ${record.version}_${record.name}`)
            } catch (e) {
              state.status = 'error'
              state.error  = e as Error
              notify(key)
              throw e
            }
          }
        },

        create: async (name: string) => {
          const nextVersion = state.migrations.length > 0 ? Math.max(...state.migrations.map(m => m.version)) + 1 : 1
          const filename    = `${String(nextVersion).padStart(3, '0')}_${name}.sql`
          const template    = `-- Migration: ${name}\n-- Created at: ${new Date().toISOString()}\n\n-- UP\n\n\n-- DOWN\n`
          if (typeof migrations === 'string') {
            if (typeof Deno !== 'undefined') await (Deno as any).writeTextFile(`${migrations}/${filename}`, template)
            else if (typeof process !== 'undefined') {
              const fs = await import('fs/promises'); const path = await import('path')
              await fs.writeFile(path.join(migrations as string, filename), template)
            }
          }
          return filename
        },

        subscribe: (cb: () => void) => {
          state.subscribers.add(cb)
          return () => state.subscribers.delete(cb)
        }
      }
    }
  )
} */
