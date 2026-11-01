import { useMutationObserver } from "~/modules/hooks/use-mutation-observer"

export function UseMutationObserverDemo() {
  const contentRef =  useRef<HTMLDivElement>(null)
  const [changeCount, setChangeCount] =  useState(0)
  const [lastChange, setLastChange] =  useState<string>('')

  const handleMutations: MutationCallback = (mutations) => {
    setChangeCount(prev => prev + mutations.length)
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        setLastChange('Children modified')
      } else if (mutation.type === 'attributes') {
        setLastChange(`Attribute ${mutation.attributeName} changed`)
      } else if (mutation.type === 'characterData') {
        setLastChange('Text content modified')
      }
    })
  }

  useMutationObserver(contentRef, handleMutations)

  const addItem = () => {
    if (contentRef.current) {
      const newItem = document.createElement('div')
      newItem.className = 'p-2 bg-blue-100 rounded mb-2'
      newItem.textContent = `New item ${Date.now()}`
      contentRef.current.appendChild(newItem)
    }
  }

  const toggleAttribute = () => {
    if (contentRef.current) {
      const hasDataTracked = contentRef.current.hasAttribute('data-tracked')
      if (hasDataTracked) {
        contentRef.current.removeAttribute('data-tracked')
      } else {
        contentRef.current.setAttribute('data-tracked', 'true')
      }
    }
  }

  const updateContent = () => {
    if (contentRef.current && contentRef.current.firstChild) {
      const firstChild = contentRef.current.firstChild as HTMLElement
      if (firstChild.textContent) {
        firstChild.textContent = `Updated: ${Date.now()}`
      }
    }
  }

  return (
    <div className="p-6 bg-background rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Mutation Observer Demo</h2>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={addItem}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Item
        </button>
        <button
          onClick={toggleAttribute}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Toggle Attribute
        </button>
        <button
          onClick={updateContent}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Update Content
        </button>
      </div>

      <div className="mb-4 p-3 bg-yellow-100 rounded">
        <p className="text-sm font-medium">Changes detected: <span className="font-bold">{changeCount}</span></p>
        <p className="text-sm">Last change: <span className="font-mono">{lastChange || 'None'}</span></p>
      </div>

      <div
        ref={contentRef}
        className="p-4 bg-white border border-gray-200 rounded min-h-[100px]"
      >
        <div className="p-2 bg-gray-100 rounded mb-2">Initial content</div>
        <div className="p-2 bg-gray-100 rounded">Watch me for changes!</div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        This area tracks DOM mutations including: added/removed children, attribute changes, and text content modifications.
      </div>
    </div>
  )
}
