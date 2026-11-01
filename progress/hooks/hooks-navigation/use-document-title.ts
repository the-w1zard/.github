import   { useEffect, useState } from "#sauron"
import { cn } from 'utils'

function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title
    }
  }, [title])
}



export { useDocumentTitle }
