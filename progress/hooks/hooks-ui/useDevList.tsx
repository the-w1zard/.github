import { useState, useEffect, useCallback } from "#sauron"
import { useFetcher } from '@remix-run/react'
import { useFetcherContext } from '#midgardr'

interface DevListItem {
  id: string
  name: string
  category: string
  tags: string[]
  component: React.ReactNode
  description: string
  framework: string
  dateAdded: string
}

interface UseDevListReturn {
  items: DevListItem[]
  addItem: (item: Omit<DevListItem, 'id' | 'dateAdded'>) => void
  removeItem: (id: string) => void
  clearList: () => void
  isLoading: boolean
  error: string | null
}

export const LOCAL_STORAGE_KEY = 'DevList'

export function useDevList(user?: User | null, DevList?: DevListItem[] ): UseDevListReturn {
  const [items, setItems] = useState<DevListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetcher, isLoading: fetcherLoading, error: fetcherError } = useFetcherContext()
  // Load items on mount
  useEffect(() => {
    if (!user) {
      try {
        const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY)
        const parsedItems = storedItems ? JSON.parse(storedItems) : []
        setItems(Array.isArray(parsedItems) ? parsedItems : []) // Ensure it's an array
      } catch (err) {
        console.error('Failed to load dev list from localStorage:', err)
        setItems([]) // Set to empty array on error
      }
      setIsLoading(false)
    } else {
      setItems(Array.isArray(DevList) ? DevList : []) // Ensure it's an array
      setIsLoading(false)
    }
  }, [user, DevList])

    useEffect(() => {
    if (fetcherError) {
      setError(fetcherError)
    }
  }, [fetcherError])

  // Save to localStorage
  const saveToLocalStorage = useCallback((newItems: DevListItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems))
    } catch (err) {
      console.error('Failed to save to localStorage:', err)
    }
  }, [])

  // Save to database using Remix fetcher
  const saveToDatabase = useCallback((action: 'add' | 'remove' | 'clear', itemData?: any) => {
    try {
      const formData = new FormData()
      formData.append('intent', action)
      
      if (action === 'add' && itemData) {
        // Serialize the item data for database storage
        const dbItem = {
          ...itemData,
          component: undefined, // Remove React component before sending to DB
          componentData: JSON.stringify(itemData.component) // Store serialized component data
        }
        formData.append('name', itemData.name)
        formData.append('value', itemData.value)
        formData.append('category', itemData.category)
        formData.append('itemData', JSON.stringify(dbItem))
      } else if (action === 'remove' && itemData?.id) {
        formData.append('id', itemData.id)
        formData.append('name', itemData.name)
      }
      
      fetcher.submit(formData, { method: 'post' })
    } catch (err) {
      console.error('Failed to save to database:', err)
      setError(err instanceof Error ? err.message : 'Failed to update dev list')
    }
  }, [fetcher])

  // Migration: When user logs in, migrate localStorage items to database
  useEffect(() => {
    const migrateLocalItemsToDatabase = (localItems: DevListItem[]) => {
      try {
        const formData = new FormData()
        formData.append('intent', 'migrate')
        formData.append('items', JSON.stringify(localItems.map(item => ({
          ...item,
          component: undefined, // Remove React component before sending to DB
          componentData: JSON.stringify(item.component) // Store serialized component data
        }))))
        fetcher.submit(formData, { method: 'post' })
      } catch (err) {
        console.error('Failed to migrate items:', err)
        setError('Failed to migrate items to your account')
      }
    }

    if (user && items.length === 0) {
      try {
        const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (storedItems) {
          const localItems = JSON.parse(storedItems)
          if (localItems.length > 0) {
            // Migrate items to database
            migrateLocalItemsToDatabase(localItems)
            // Clear localStorage after migration
            localStorage.removeItem(LOCAL_STORAGE_KEY)
          }
        }
      } catch (err) {
        console.error('Failed to migrate localStorage items:', err)
      }
    }
  }, [user, items.length, fetcher])

  // Add item
  const addItem = useCallback((itemData: Omit<DevListItem, 'id' | 'dateAdded'>) => {
    const newItem: DevListItem = {
      ...itemData,
      id: crypto.randomUUID(),
    }

    // Ensure items is always treated as an array
    const currentItems = Array.isArray(items) ? items : []
    const newItems = [newItem, ...currentItems]
    setItems(newItems)

    if (!user) {
      saveToLocalStorage(newItems)
    } else {
      saveToDatabase('add', newItem)
    }
  }, [items, user, saveToLocalStorage, saveToDatabase])

  // Remove item
 const removeItem = useCallback((id: string) => {
  const currentItems = Array.isArray(items) ? items : []
  const itemToRemove = currentItems.find(item => item.id === id)
  const newItems = currentItems.filter(item => item.id !== id)
  setItems(newItems)

    if (!user) {
      saveToLocalStorage(newItems)
    } else {
      saveToDatabase('remove', { id, name: itemToRemove?.name })
    }
  }, [items, user, saveToLocalStorage, saveToDatabase])

  // Clear list
  const clearList = useCallback(() => {
    setItems([])

    if (!user) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } else {
      saveToDatabase('clear')
    }
  }, [user, saveToDatabase])

   const combinedIsLoading = isLoading || fetcherLoading

  return {
    items,
    addItem,
    removeItem,
    clearList,
     isLoading: combinedIsLoading,
    error: error || fetcherError,
    fetcher
  }
}
