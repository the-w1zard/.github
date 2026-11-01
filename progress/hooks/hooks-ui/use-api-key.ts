import { useCallback, useEffect, useState } from "#sauron"

type ApiKeyListener = () => void

class ApiKeyManager {
  private listeners: Set<ApiKeyListener> = new Set()

  subscribe(listener: ApiKeyListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.listeners.forEach((listener) => listener())
  }

  getApiKey(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("OPENAI_API_KEY")
  }

  setApiKey(key: string) {
    if (typeof window === "undefined") return
    localStorage.setItem("OPENAI_API_KEY", key)
    this.notify()
  }

  removeApiKey() {
    if (typeof window === "undefined") return
    localStorage.removeItem("OPENAI_API_KEY")
    this.notify()
  }
}

const apiKeyManager = new ApiKeyManager()

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(false)

  const updateState = useCallback(() => {
    const key = apiKeyManager.getApiKey()
    setApiKey(key)
    setHasApiKey(!!key)
  }, [])

  useEffect(() => {
    // Initial state
    updateState()

    // Subscribe to manager updates
    const unsubscribe = apiKeyManager.subscribe(updateState)

    // Listen for cross-tab storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "OPENAI_API_KEY") {
        updateState()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [updateState])

  const saveApiKey = useCallback((key: string) => {
    apiKeyManager.setApiKey(key)
  }, [])

  const deleteApiKey = useCallback(() => {
    apiKeyManager.removeApiKey()
  }, [])

  return {
    apiKey,
    hasApiKey,
    saveApiKey,
    deleteApiKey,
    getApiKey: apiKeyManager.getApiKey,
  }
}
 
export { apiKeyManager }


export function UseApiKeyDemo() {
  const { apiKey, hasApiKey, saveApiKey, deleteApiKey } = useApiKey()
  const [inputKey, setInputKey] = useState("")

  const handleSave = () => {
    if (inputKey.trim()) {
      saveApiKey(inputKey.trim())
      setInputKey("")
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">API Key Management</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-background">
            <p className="font-medium">Current Status:</p>
            <p className={hasApiKey ? "text-green-600" : "text-red-600"}>
              {hasApiKey ? "API Key Configured" : "No API Key Set"}
            </p>
            {hasApiKey && (
              <p className="text-sm text-muted-foreground mt-2">
                Key: {apiKey?.substring(0, 8)}...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Set New API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter your API key"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={handleSave}
                disabled={!inputKey.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {hasApiKey && (
            <button
              onClick={deleteApiKey}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
            >
              Remove API Key
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

 