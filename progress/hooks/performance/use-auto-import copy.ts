/**
 * #sauron/use-auto-import
 * 
 * Automatically import modules based on usage
 * Zero-config code splitting and lazy loading
 * 
 * ```tsx
 * const auto = useAutoImport({
 *   components: './src/components',
 *   hooks: './src/hooks',
 *   utils: './src/utils'
 * });
 * 
 * // Auto-imports when used
 * const Button = auto.components.Button;
 * const useAuth = auto.hooks.useAuth;
 * ```
 */
import path from 'path'
import fs from 'fs/promises'
import * as t from '@babel/types'

interface AutoImportOptions {
  directories: Record<string, string>
  extensions?: string[]
  exclude?: RegExp[]
  generateMap?: boolean
  cache?: boolean
  lazy?: boolean
}

interface ImportMap {
  [key: string]: {
    path: string
    exports: string[]
    export?: string
    size?: number
  }
}

interface AutoImportHookState extends HookState {
  directories: Record<string, string>
  extensions: string[]
  exclude: RegExp[]
  importMap: ImportMap
  moduleCache: Map<string, any>
  generateMap: boolean
  cache: boolean
  lazy: boolean
}

export function useAutoImport(options: AutoImportOptions, __sauron_id__ = _sid()) {
  const {
    directories,
    extensions = ['.ts', '.tsx', '.js', '.jsx'],
    exclude    = [/\.test\./, /\.spec\./, /node_modules/],
    generateMap = true,
    cache       = true,
    lazy        = true
  } = options

  return createHook(
    'useAutoImport',
    __sauron_id__,
    (): AutoImportHookState => ({
      value:       undefined,
      directories,
      extensions,
      exclude,
      importMap:   {},
      moduleCache: new Map(),
      generateMap,
      cache,
      lazy
    }),
    (s: AutoImportHookState) => {
      const scanDirectory = async (dirPath: string, baseDir: string) => {
        try {
          const files = await fs.readdir(dirPath)
          for (const file of files) {
            const fullPath = path.join(dirPath, file)
            const stat = await fs.stat(fullPath)
            if (stat.isDirectory()) {
              await scanDirectory(fullPath, baseDir)
              continue
            }
            const ext = path.extname(file)
            if (!s.extensions.includes(ext)) continue
            const relativePath = path.relative(baseDir, fullPath)
            if (s.exclude.some(p => p.test(relativePath))) continue
            try {
              const mod = await import(fullPath)
              const exports = Object.keys(mod).filter(k => k !== 'default' && !k.startsWith('_'))
              const name = path.basename(file, ext)
              s.importMap[name] = { path: fullPath, exports, size: stat.size }
              exports.forEach(exp => {
                s.importMap[exp] = { path: fullPath, exports: [], export: exp, size: stat.size }
              })
            } catch {}
          }
        } catch {}
      }

      const scanAll = async () => {
        await Promise.all(
          Object.values(s.directories).map(dirPath => {
            const abs = path.resolve(process.cwd(), dirPath)
            return scanDirectory(abs, abs)
          })
        )
      }

      const importModule = async (name: string) => {
        if (s.cache && s.moduleCache.has(name)) return s.moduleCache.get(name)
        const info = s.importMap[name]
        if (!info) throw new Error(`Module not found: ${name}`)
        if (s.lazy) {
          const mod = await import(info.path)
          const result = info.export ? mod[info.export] : (mod.default ?? mod)
          if (s.cache) s.moduleCache.set(name, result)
          return result
        }
        return null
      }

      const createProxy = () => new Proxy({} as Record<string, any>, {
        get: (_, prop: string) => async (...args: any[]) => {
          const mod = await importModule(prop)
          return typeof mod === 'function' ? mod(...args) : mod
        },
        has: (_, prop: string) => prop in s.importMap
      })

      const generateImportMap = async (outputPath: string) => {
        await fs.writeFile(outputPath, JSON.stringify({ generated: new Date().toISOString(), imports: s.importMap }, null, 2))
        return outputPath
      }

      if (!s.lazy) scanAll()

      return {
        import:        createProxy(),
        importModule,
        listImports:   () => Object.keys(s.importMap),
        getImportInfo: (name: string) => s.importMap[name],
        scan:          scanAll,
        generateMap:   generateImportMap,
        clearCache:    () => s.moduleCache.clear(),
        preload:       async (names: string[]) => { await Promise.all(names.map(importModule)) }
      }
    }
  )
}

export function autoImportBabelPlugin() {
  return {
    name: 'auto-import',
    visitor: {
      Identifier(nodePath: any, state: any) {
        const name = nodePath.node.name
        const imports = state.opts.imports || {}
        if (imports[name] && !nodePath.scope.hasBinding(name)) {
          nodePath.scope.push({ id: nodePath.node, init: null, kind: 'const' })
          const program = nodePath.findParent((p: any) => p.isProgram())
          const exists = program.node.body.find(
            (node: any) => node.type === 'ImportDeclaration' && node.source.value === imports[name]
          )
          if (!exists) {
            program.node.body.unshift(
              t.importDeclaration(
                [t.importSpecifier(t.identifier(name), t.identifier(name))],
                t.stringLiteral(imports[name])
              )
            )
          }
        }
      }
    }
  }
}

export const autoImportESLint = {
  rules: {
    'no-unused-imports': {
      meta: { fixable: 'code' },
      create(context: any) {
        const imports = new Set<string>()
        return {
          ImportDeclaration(node: any) {
            node.specifiers.forEach((spec: any) => imports.add(spec.local.name))
          },
          'Program:exit'() {
            const unused = new Set(imports)
            context.getScope().references.forEach((ref: any) => unused.delete(ref.identifier.name))
            unused.forEach((name: string) => {
              context.report({
                node: context.getScope().block,
                message: `Unused import: ${name}`,
                fix(fixer: any) { return fixer.removeRange([]) }
              })
            })
          }
        }
      }
    }
  }
}
