import { createHook } from'#the-cloud' 

export interface MachineConfig {
  initial: string
  context?: Record<string, any>
  states: Record<
    string,
    {
      on?: Record<
        string,
        {
          target: string
          actions?: ((ctx: any) => void)[]
        }
      >
    }
  >
}

export function useMachine(
  machineConfig: MachineConfig,
  __sauron_id__ = _sid()
) {
  return createHook(
    'useMachine',
    __sauron_id__,

    () => ({
      value: {
        state: machineConfig.initial,
        context: machineConfig.context || {},
        machine: machineConfig
      }
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const send = (event: string) => {
        const current = s.machine.states[s.state]
        const transition = current?.on?.[event]
        if (!transition) return

        s.state = transition.target

        if (transition.actions) {
          for (const action of transition.actions) {
            action?.(s.context)
          }
        }

        notify(key)
      }

      const matches = (...states: string[]) => states.includes(s.state)
      const getState = () => s.state
      const getContext = () => s.context

      return [
        {
          state: s.state,
          context: s.context,
          matches,
          send
        },
        getState,
        getContext
      ]
    }
  )
}
