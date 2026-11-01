import { _sid, createHook, HookState, notifyHook } from '#the-cloud'

// ───────────────────────────────────────────────
// useGeolocation — Sauron‑native rewrite
// No React, no useEffect, no hookSystem
// Deterministic watcher lifecycle, stable state updates
// ───────────────────────────────────────────────

export function useGeolocation(
  options: PositionOptions = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    'useGeolocation',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => {
      const supported =
        typeof navigator !== 'undefined' &&
        navigator.geolocation &&
        typeof navigator.geolocation.watchPosition === 'function'

      const state = {
        loading: true,
        error: supported ? null : 'Geolocation not supported',
        position: null as null | {
          lat: number
          lng: number
          accuracy: number
          altitude: number | null
          heading: number | null
          speed: number | null
        },
        watcherId: null as number | null,
        supported
      }

      if (supported) {
        const success = (pos: GeolocationPosition) => {
          state.position = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed
          }
          state.error = null
          state.loading = false
          notifyHook(__sauron_id__)
        }

        const fail = (err: GeolocationPositionError) => {
          state.error = err.message
          state.loading = false
          notifyHook(__sauron_id__)
        }

        state.watcherId = navigator.geolocation.watchPosition(
          success,
          fail,
          options
        )
      }

      return { value: state }
    },

    // ───────────────────────────────────────── updater
    (hook) => {
      const s = hook.value

      const getPosition = () => s.position
      const getError = () => s.error
      const isLoading = () => s.loading

      return [
        s.position,
        s.loading,
        s.error,
        getPosition,
        isLoading,
        getError
      ]
    }
  )
}
