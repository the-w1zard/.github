import { useEffect } from "#sauron"

interface UseGoogleFontOptions {
  weights?: string[]
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
}

function useGoogleFont(
  fontFamily: string,
  options: UseGoogleFontOptions = {}
) {
  const { weights = ['400', '500', '600', '700'], display = 'swap' } = options

  useEffect(() => {
    const fontId = `google-font-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`
    
    if (document.getElementById(fontId)) {
      return
    }

    const link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${weights.join(';')}&display=${display}`
    
    document.head.appendChild(link)

    return () => {
      const existingLink = document.getElementById(fontId)
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
    }
  }, [fontFamily, weights, display])
}

 

export { useGoogleFont  }
