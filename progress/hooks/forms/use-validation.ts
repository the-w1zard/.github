import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

interface ValidationState {
  errors: Record<string, string>
  dirty: Record<string, boolean>
  touched: Record<string, boolean>
  valid: boolean
}

export function useValidation(state: Record<string, any>, rules: Record<string, any[]>,  __sauron_id__ = _sid()) {
  return createHook(
    "useValidation",
     __sauron_id__,

    () => ({
      value: {
        errors: {},
        dirty: {},
        touched: {},
        valid: true
      } as ValidationState
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const validate = () => {
        const newErrors: Record<string, string> = {}
        let valid = true

        for (const field in rules) {
          const value = state[field]
          const fieldRules = rules[field]

          for (const rule of fieldRules) {
            if (!rule.validator(value)) {
              newErrors[field] = rule.message
              valid = false
            }
          }
        }

        s.errors = newErrors
        s.valid = valid
        notify(key)
        return valid
      }

      const touch = (field: string) => {
        s.touched[field] = true
        notify(key)
      }

      return [
        {
          errors: s.errors,
          dirty: s.dirty,
          touched: s.touched,
          valid: s.valid
        },
        validate,
        touch
      ] as const
    }
  )
}
