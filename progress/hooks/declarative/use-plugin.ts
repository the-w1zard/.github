export function usePlugin() {
  return null
}

/**import { createHook } from "#the-cloud"
import { _sid } from "#sauron"
import { type Plugin, createPlugin, plugins as corePlugins } from "./core-bundler"

const pluginRegistry = new Map<string, Plugin>()

export interface PluginAPI {
  use: (plugin: Plugin | (() => Plugin)) => void
  getAll: () => Plugin[]
  remove: (name: string) => void
  clear: () => void
  builtins: typeof corePlugins
}

export function usePlugin(): PluginAPI {
  return createHook(
    "usePlugin",
    _sid(),

    () => ({
      registry: pluginRegistry
    }),

    () => {
      const use = (plugin: Plugin | (() => Plugin)) => {
        const resolved = typeof plugin === "function" ? plugin() : plugin
        pluginRegistry.set(resolved.name, resolved)
      }

      const getAll = (): Plugin[] => {
        return Array.from(pluginRegistry.values())
      }

      const remove = (name: string) => {
        pluginRegistry.delete(name)
      }

      const clear = () => {
        pluginRegistry.clear()
      }

      return {
        use,
        getAll,
        remove,
        clear,
        builtins: corePlugins
      }
    }
  )
}
 */
