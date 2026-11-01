import React, { useEffect, useState } from "#sauron"
import { cn } from 'utils'

type UseReadLocalStorageOptions<T> = {
  deserializer?: (value: string) => T
  initializeWithValue?: boolean
}

function useReadLocalStorage<T>(
  key: string,
  options: UseReadLocalStorageOptions<T> = {}
): T | null | undefined {
  const { deserializer = JSON.parse, initializeWithValue = true } = options

  const readValue = (): T | null => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserializer(item) : null
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return null
    }
  }

  const [storedValue, setStoredValue] = useState<T | null | undefined>(() => {
    if (initializeWithValue) {
      return readValue()
    }
    return undefined
  })

  useEffect(() => {
    if (!initializeWithValue) {
      setStoredValue(readValue())
    }
  }, [])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== window.localStorage) {
        return
      }

      if (event.newValue === null) {
        setStoredValue(null)
      } else {
        try {
          setStoredValue(deserializer(event.newValue))
        } catch (error) {
          console.warn(`Error deserializing localStorage key "${key}":`, error)
          setStoredValue(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, deserializer])

  return storedValue
}




export { useReadLocalStorage }
