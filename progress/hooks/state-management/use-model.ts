import { createHook,  } from '#the-cloud'

export type Msg<M> = { type: string; p?: any } & M

interface ModelHookState<Model, MsgType> extends HookState {
  model:  Model
  update: (model: Model, msg: Msg<MsgType>) => Model
}

export function useModel<Model, MsgType>(
  initialModel: Model | (() => Model),
  update:       (model: Model, msg: Msg<MsgType>) => Model,
  __sauron_id__ = _sid()
): [Model, (msg: Msg<MsgType>) => void] {
  return createHook(
    'useModel',
    __sauron_id__,
    (): ModelHookState<Model, MsgType> => ({
      value:  undefined,
      model:  typeof initialModel === 'function' ? (initialModel as () => Model)() : { ...(initialModel as any) } as Model,
      update
    }),
    (s:  key, notify) => {
      const state = s as ModelHookState<Model, MsgType>

      const dispatch = (msg: Msg<MsgType>) => {
        const next = state.update(state.model, msg)
        if (next !== state.model) {
          state.model = next
          notify(key)
        }
      }

      return [state.model, dispatch]
    }
  )
}
