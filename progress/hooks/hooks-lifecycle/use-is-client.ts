import   { useEffect, useState } from '#sauron'
import { cn } from 'utils'

function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}


 
export { useIsClient }
