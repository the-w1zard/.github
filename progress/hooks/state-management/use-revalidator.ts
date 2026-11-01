import { createHook, getSauron } from '#the-cloud'
import {  useNavigateY, useRouteY } from '#sauron'

export function useRevalidator() {
  return createHook(
    "useRevalidator",
    _sid(),

    () => ({
      state: "idle" as "idle" | "loading"
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const revalidate = () => {
        s.state = "loading"
        notify(key)

        const loc = useRouteY()
        if (loc) {
          const navigate = useNavigateY();
          navigate.navigate(loc.pathname + loc.search + loc.hash,)
        }

        s.state = "idle"
        notify(key)
      }

      return {
        state: s.state,
        revalidate
      } as const
    }
  )
}
