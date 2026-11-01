import { createHook } from '#the-cloud'

export const Priority = {
  IMMEDIATE: 0,
  USER_BLOCKING: 1,
  NORMAL: 2,
  LOW: 3,
  IDLE: 4
} as const

export function useScheduler() {
  return createHook(
    "useScheduler",
    _sid(),

    () => ({
      tasks: new Map<string, { task: () => void; priority: number }>(),
      running: false,
      queue: {
        [Priority.IMMEDIATE]: [] as string[],
        [Priority.USER_BLOCKING]: [] as string[],
        [Priority.NORMAL]: [] as string[],
        [Priority.LOW]: [] as string[],
        [Priority.IDLE]: [] as string[]
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const schedule = (
        task: () => void,
        priority: number = Priority.NORMAL,
        id: string = _sid()
      ) => {
        s.tasks.set(id, { task, priority })
        s.queue[priority].push(id)

        if (!s.running) {
          s.running = true
          processQueue()
        }

        notify(key)
        return id
      }

      const cancel = (id: string) => {
        const t = s.tasks.get(id)
        if (!t) return

        s.queue[t.priority] = s.queue[t.priority].filter(x => x !== id)
        s.tasks.delete(id)
        notify(key)
      }

      const processQueue = () => {
        queueMicrotask(() => {
          for (const priority of Object.values(Priority)) {
            const q = s.queue[priority]
            while (q.length > 0) {
              const id = q.shift()!
              const t = s.tasks.get(id)
              if (t) {
                t.task()
                s.tasks.delete(id)
              }
            }
          }
          s.running = false
          notify(key)
        })
      }

      const getTaskCount = () => s.tasks.size

      return [schedule, cancel, getTaskCount] as const
    }
  )
}
