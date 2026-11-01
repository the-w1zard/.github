import path from 'path'
import fs from 'fs/promises'
import * as t from '@babel/types'

interface AutoImportOptions {
  directories?: Record<string, string>
  modules?: Record<string, string>
  extensions?: string[]
  exclude?: RegExp[]
  generateMap?: boolean
  cache?: boolean
  lazy?: boolean
  scan?: boolean
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
  modules: Record<string, string>
  extensions: string[]
  exclude: RegExp[]
  importMap: ImportMap
  moduleCache: Map<string, any>
  generateMap: boolean
  cache: boolean
  lazy: boolean
  scan: boolean
}

export function useAutoImport(options: AutoImportOptions = {}, __sauron_id__ = _sid()) {
  const {
    directories = {},
    modules = {},
    extensions = ['.ts', '.tsx', '.js', '.jsx'],
    exclude = [/\.test\./, /\.spec\./, /node_modules/],
    generateMap = true,
    cache = true,
    lazy = true,
    scan = false
  } = options

  return createHook('useAutoImport', __sauron_id__, (): AutoImportHookState => ({ value: undefined, directories, modules, extensions, exclude, importMap: {}, moduleCache: new Map(), generateMap, cache, lazy, scan }), (s: AutoImportHookState) => {
    const resolvePath = (modulePath: string) => path.resolve(process.cwd(), modulePath)

    const registerModule = (name: string, modulePath: string, exportName?: string) => {
      const resolvedPath = resolvePath(modulePath)
      s.importMap[name] = { path: resolvedPath, exports: [], ...(exportName ? { export: exportName } : {}) }
    }

    Object.entries(s.modules).forEach(([name, modulePath]) => { registerModule(name, modulePath) })

    const scanDirectory = async (dirPath: string, baseDir: string) => {
      try {
        const files = await fs.readdir(dirPath)

        for (const file of files) {
          const fullPath = path.join(dirPath, file)
          const stat = await fs.stat(fullPath)// async
          if (stat.isDirectory()) { await scanDirectory(fullPath, baseDir); continue; }
          const ext = path.extname(file)
          if (!s.extensions.includes(ext)) continue
          const relativePath = path.relative(baseDir, fullPath)
          if (s.exclude.some(pattern => { pattern.lastIndex = 0; return pattern.test(relativePath) })) { continue }
          const name = path.basename(file, ext)
          s.importMap[name] = { path: fullPath, exports: [], size: stat.size }
        }
      } catch {
      }
    }

    const scanAll = async () => {
      await Promise.all(Object.values(s.directories).map(dirPath => { const abs = resolvePath(dirPath); return scanDirectory(abs, abs) }))
      return s.importMap
    }

    const importModule = async (name: string) => {
      if (s.cache && s.moduleCache.has(name)) { return s.moduleCache.get(name) }
      const info = s.importMap[name]
      if (!info) { throw new Error(`Module not found: ${name}`) }
      if (!s.lazy) { return null }
      const mod = await import(info.path)
      const result = info.export ? mod[info.export] : (mod.default ?? mod[name] ?? mod)
      if (s.cache) { s.moduleCache.set(name, result) }
      return result
    }

    const createProxy = () => new Proxy({} as Record<string, any>, { get: (_, prop: string) => importModule(prop), has: (_, prop: string) => prop in s.importMap })

    const generateImportMap = async (outputPath: string) => {
      await fs.writeFile(outputPath, JSON.stringify({ generated: new Date().toISOString(), imports: s.importMap }, null, 2))
      return outputPath
    }
    
    if (s.scan) { void scanAll() }

    return {
      import: createProxy(),
      importModule,
      listImports: () => Object.keys(s.importMap),
      getImportInfo: (name: string) => s.importMap[name],
      scan: scanAll,
      generateMap: generateImportMap,
      clearCache: () => s.moduleCache.clear(),
      preload: async (names: string[]) => { await Promise.all(names.map(importModule)) }
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
          const exists = program.node.body.find((node: any) => node.type === 'ImportDeclaration' && node.source.value === imports[name])
          if (!exists) {
            program.node.body.unshift(t.importDeclaration([t.importSpecifier(t.identifier(name), t.identifier(name))], t.stringLiteral(imports[name])))
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
          ImportDeclaration(node: any) { node.specifiers.forEach((spec: any) => imports.add(spec.local.name)) },

          'Program:exit'() {
            const unused = new Set(imports)

            context.getScope().references.forEach((ref: any) => unused.delete(ref.identifier.name))

            unused.forEach((name: string) => {
              context.report({
                node: context.getScope().block,
                message: `Unused import: ${name}`,
                fix(fixer: any) {
                  return fixer.removeRange([])
                }
              })
            })
          }
        }
      }
    }
  }
}
