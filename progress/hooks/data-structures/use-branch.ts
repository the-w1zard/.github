import { createHook, HookState } from '#the-cloud'
import { _sid } from '../_sid'

interface Commit {
  id:        string
  message:   string
  timestamp: number
  branch:    string
}

interface BranchHookState<T> extends HookState {
  currentBranch: string
  branches:      Map<string, T>
  commits:       Commit[]
}

export function useBranch<T>(initialState: T | (() => T), __sauron_id__ = _sid()): {
  state:    () => T
  branch:   (name: string) => void
  commit:   (message: string) => void
  checkout: (name: string) => void
  merge:    (branch: string, strategy?: 'ours' | 'theirs' | 'smart') => void
  log:      () => Commit[]
  branches: () => string[]
} {
  return createHook(
    'useBranch',
    __sauron_id__,
    (): BranchHookState<T> => {
      const init = typeof initialState === 'function'
        ? (initialState as () => T)()
        : { ...(initialState as any) } as T
      return {
        value:         undefined,
        currentBranch: 'main',
        branches:      new Map<string, T>([['main', { ...(init as any) } as T]]),
        commits:       []
      }
    },
    (s: BranchHookState<T>, key, notify) => {
      const getState = (): T => {
        const b = s.branches.get(s.currentBranch)
        return { ...(b as any) } as T
      }

      const branch = (name: string) => {
        if (!s.branches.has(name)) {
          const cur = s.branches.get(s.currentBranch)!
          s.branches.set(name, { ...(cur as any) } as T)
        }
      }

      const commit = (message: string) => {
        const cur = s.branches.get(s.currentBranch)!
        s.branches.set(s.currentBranch, { ...(cur as any) } as T)
        s.commits.push({ id: Math.random().toString(36).substring(7), message, timestamp: Date.now(), branch: s.currentBranch })
        notify(key)
      }

      const checkout = (name: string) => {
        if (s.branches.has(name)) { s.currentBranch = name; notify(key) }
      }

      const merge = (branchName: string, strategy: 'ours' | 'theirs' | 'smart' = 'smart') => {
        if (!s.branches.has(branchName)) return
        const target = s.branches.get(s.currentBranch)!
        const source = s.branches.get(branchName)!
        const merged: T = strategy === 'ours'   ? { ...(target as any) } as T
                        : strategy === 'theirs' ? { ...(source as any) } as T
                        : { ...(target as any), ...(source as any) } as T
        s.branches.set(s.currentBranch, merged)
        s.commits.push({ id: Math.random().toString(36).substring(7), message: `Merge branch '${branchName}' into ${s.currentBranch}`, timestamp: Date.now(), branch: s.currentBranch })
        notify(key)
      }

      const log     = (): Commit[]  => [...s.commits].reverse()
      const branches = (): string[] => Array.from(s.branches.keys())

      return { state: getState, branch, commit, checkout, merge, log, branches }
    }
  )
}
