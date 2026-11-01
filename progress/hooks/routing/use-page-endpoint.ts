import { createHook } from '#the-cloud'

export interface PageEndpoint<LoaderData = any, ActionData = any> {
  loader?: (request: Request, params: Record<string, string>) => Promise<LoaderData>
  action?: (request: Request, params: Record<string, string>) => Promise<ActionData>
  component?: (props: { data?: LoaderData; actionData?: ActionData }) => any
}

const pageEndpointRegistry = new Map<string, PageEndpoint>()

export function definePageEndpoint(path: string, endpoint: PageEndpoint) {
  pageEndpointRegistry.set(path, endpoint)
}

export function usePageEndpoint(path: string) {
  return createHook(
    "usePageEndpoint",
    _sid(),

    () => ({
      path,
      endpoint: pageEndpointRegistry.get(path) || null,
      data: null,
      actionData: null
    }),

    (hookState, key, notify) => {
      const s = hookState.value

      const loadData = async (params?: Record<string, string>) => {
        if (!s.endpoint?.loader) return null

        const url =
          `${s.path}/data` +
          (params ? `?${new URLSearchParams(params)}` : "")

        const res = await fetch(url)
        const json = await res.json()

        s.data = json
        notify(key)
        return json
      }

      const submitAction = async (
        formData: FormData,
        params?: Record<string, string>
      ) => {
        if (!s.endpoint?.action) return null

        const url =
          `${s.path}/action` +
          (params ? `?${new URLSearchParams(params)}` : "")

        const res = await fetch(url, {
          method: "POST",
          body: formData
        })

        const json = await res.json()
        s.actionData = json
        notify(key)
        return json
      }

      return {
        loadData,
        submitAction,
        Component: s.endpoint?.component || null
      }
    }
  )
}
