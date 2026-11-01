 
import { useState } from "#sauron" 

// @dev app/components/midgardr/hooks/use-client.tsx:use-client

export function useClient() {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleClick = (callback?: () => void | Promise<void>) => {
    setIsLoading(true)
    if (callback) {
      Promise.resolve(callback()).finally(() => {
        setIsLoading(false)
      })
    } else {
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    }
  }

  return {
    isLoading,
    setIsLoading,
    handleClick,
  }
}


