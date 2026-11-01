 
import * as React from "#sauron"


/**
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ useCopyToClipboard Hook ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ★ ━━━━ ☆ ━━━━  ━━━━ ☆ ━━━━ ★
* useCopyToClipboard: A React hook for copying text to clipboard with timeout and callbacks
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Basic Usage ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* const { isCopied, copyToClipboard } = useCopyToClipboard()
* 
* return (
*   <button onClick={() => copyToClipboard('Hello World')}>
*     {isCopied ? 'Copied!' : 'Copy Text'}
*   </button>
* )
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ With Custom Timeout ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // 2 second timeout
* const { copyToClipboard } = useCopyToClipboard({ 
*   timeout: 2000 
* })
* 
* // 10 second timeout (for important info)
* const { copyToClipboard } = useCopyToClipboard({ 
*   timeout: 10000 
* })
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ With Callback ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* const { copyToClipboard } = useCopyToClipboard({
*   onCopy: () => {
*     // Show success toast
*     toast.success('Copied to clipboard!')
*     
*     // Track analytics event
*     analytics.track('text_copied')
*     
*     // Update UI state
*     setShowCopiedFeedback(true)
*   }
* })
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ In Component Examples ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // Copy button component
* function CopyButton({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   return (
*     <button
*       onClick={() => copyToClipboard(text)}
*       className={isCopied ? 'copied' : ''}
*     >
*       {isCopied ? '✓ Copied' : 'Copy'}
*     </button>
*   )
* }
* 
* // Code snippet with copy
* function CodeSnippet({ code }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard({
*     timeout: 3000,
*     onCopy: () => console.log('Code copied:', code)
*   })
*   
*   return (
*     <div className="code-block">
*       <pre>{code}</pre>
*       <button onClick={() => copyToClipboard(code)}>
*         {isCopied ? 'Copied!' : 'Copy Code'}
*       </button>
*     </div>
*   )
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Multiple Copy Instances ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // Track which item was copied
* function CopyList({ items }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   return (
*     <ul>
*       {items.map((item) => (
*         <li key={item.id}>
*           {item.text}
*           <button 
*             onClick={() => copyToClipboard(item.text)}
*             aria-label={`Copy ${item.name}`}
*           >
*             {isCopied === item.text ? '✓' : 'Copy'}
*           </button>
*         </li>
*       ))}
*     </ul>
*   )
* }
* 
* // Compare current copied text
* function isCurrentlyCopied(text) {
*   return isCopied === text
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ With UI Feedback Patterns ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // Tooltip feedback
* function CopyWithTooltip({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   return (
*     <Tooltip content={isCopied ? 'Copied!' : 'Click to copy'}>
*       <button onClick={() => copyToClipboard(text)}>
*         {text}
*       </button>
*     </Tooltip>
*   )
* }
* 
* // Icon feedback
* function CopyIconButton({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   return (
*     <button onClick={() => copyToClipboard(text)}>
*       {isCopied ? <CheckIcon /> : <CopyIcon />}
*     </button>
*   )
* }
* 
* // Toast notification
* function CopyWithToast({ text }) {
*   const { copyToClipboard } = useCopyToClipboard({
*     onCopy: () => toast('Copied to clipboard!')
*   })
*   
*   return (
*     <button onClick={() => copyToClipboard(text)}>
*       Copy
*     </button>
*   )
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Hook Return Values ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```typescript
* interface UseCopyToClipboardReturn {
*   // The currently copied text (null if nothing copied or timeout expired)
*   isCopied: string | null
*   
*   // Function to copy text to clipboard
*   copyToClipboard: (value: string) => void
* }
* 
* // Usage example
* const { isCopied, copyToClipboard } = useCopyToClipboard(options)
* 
* // Check if specific text is currently copied
* const isThisCopied = isCopied === 'specific text'
* 
* // Check if anything is copied
* const hasCopied = isCopied !== null
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Hook Options ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```typescript
* interface UseCopyToClipboardOptions {
*   // Time in milliseconds before resetting copied state (default: 4000)
*   timeout?: number
*   
*   // Callback function triggered after successful copy
*   onCopy?: () => void
* }
* 
* // Examples of different configurations
* const defaultOptions = {} // Uses default 4000ms timeout
* 
* const shortFeedback = { timeout: 1000 } // Quick feedback
* 
* const withAnalytics = {
*   timeout: 5000,
*   onCopy: () => trackEvent('copy_action')
* }
* 
* const withMultipleCallbacks = {
*   onCopy: () => {
*     showToast()
*     trackAnalytics()
*     updateUIState()
*   }
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Error Handling ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // Safe copy with error handling
* function SafeCopyButton({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   const handleCopy = () => {
*     try {
*       copyToClipboard(text)
*     } catch (error) {
*       console.error('Failed to copy:', error)
*       // Show error message to user
*       toast.error('Failed to copy to clipboard')
*     }
*   }
*   
*   return (
*     <button onClick={handleCopy}>
*       {isCopied ? 'Copied!' : 'Copy'}
*     </button>
*   )
* }
* 
* // Check clipboard API support
* function CopyButton({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   const isClipboardSupported = 
*     typeof window !== 'undefined' && 
*     navigator?.clipboard?.writeText
*   
*   if (!isClipboardSupported) {
*     return <span>Clipboard not supported in this browser</span>
*   }
*   
*   return (
*     <button onClick={() => copyToClipboard(text)}>
*       {isCopied ? 'Copied!' : 'Copy'}
*     </button>
*   )
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Advanced Usage Patterns ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // Debounced copy (prevent rapid clicks)
* function DebouncedCopyButton({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   const [isDebouncing, setIsDebouncing] = useState(false)
*   
*   const handleCopy = () => {
*     if (isDebouncing) return
*     
*     setIsDebouncing(true)
*     copyToClipboard(text)
*     
*     setTimeout(() => {
*       setIsDebouncing(false)
*     }, 1000)
*   }
*   
*   return (
*     <button 
*       onClick={handleCopy}
*       disabled={isDebouncing}
*     >
*       {isDebouncing ? 'Copying...' : isCopied ? 'Copied!' : 'Copy'}
*     </button>
*   )
* }
* 
* // Copy with confirmation
* function CopyWithConfirmation({ text }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   const [showConfirm, setShowConfirm] = useState(false)
*   
*   const handleCopy = () => {
*     if (text.length > 1000) {
*       setShowConfirm(true)
*     } else {
*       copyToClipboard(text)
*     }
*   }
*   
*   return (
*     <>
*       <button onClick={handleCopy}>
*         Copy
*       </button>
*       
*       {showConfirm && (
*         <ConfirmationDialog
*           onConfirm={() => {
*             copyToClipboard(text)
*             setShowConfirm(false)
*           }}
*           onCancel={() => setShowConfirm(false)}
*         />
*       )}
*     </>
*   )
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Integration Examples ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* ```jsx
* // In a form field
* function CopyableInput({ value }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   return (
*     <div className="input-group">
*       <input type="text" value={value} readOnly />
*       <button 
*         onClick={() => copyToClipboard(value)}
*         className={isCopied ? 'success' : ''}
*       >
*         {isCopied ? '✓' : 'Copy'}
*       </button>
*     </div>
*   )
* }
* 
* // In a data table
* function DataTable({ rows }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   return (
*     <table>
*       <tbody>
*         {rows.map(row => (
*           <tr key={row.id}>
*             <td>{row.value}</td>
*             <td>
*               <button 
*                 onClick={() => copyToClipboard(row.value)}
*                 aria-label={`Copy ${row.name}`}
*               >
*                 {isCopied === row.value ? 'Copied' : 'Copy'}
*               </button>
*             </td>
*           </tr>
*         ))}
*       </tbody>
*     </table>
*   )
* }
* 
* // With rich text/html
* function CopyHTMLContent({ html }) {
*   const { isCopied, copyToClipboard } = useCopyToClipboard()
*   
*   const handleCopyHTML = async () => {
*     // Convert HTML to plain text for clipboard
*     const plainText = html.replace(/<[^>]*>/g, '')
*     copyToClipboard(plainText)
*   }
*   
*   return (
*     <div>
*       <div dangerouslySetInnerHTML={{ __html: html }} />
*       <button onClick={handleCopyHTML}>
*         {isCopied ? 'Copied as text' : 'Copy text content'}
*       </button>
*     </div>
*   )
* }
* ```
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Browser Support Notes ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* - **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
* - **HTTPS Requirement**: Clipboard API requires secure context (HTTPS)
* - **User Permission**: Some browsers may require user permission
* - **Fallback Consideration**: Consider fallback for older browsers
* 
* ★ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━ Best Practices ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ☆ ━━━━━━━━━━━━━━ ★                  
* 1. **Provide Visual Feedback**: Always show when text is copied
* 2. **Use Appropriate Timeout**: Match timeout to user reading speed
* 3. **Handle Empty Values**: Check for empty or null text
* 4. **Add Accessibility**: Include ARIA labels for screen readers
* 5. **Consider Context**: Show what was copied (especially in lists)
* 6. **Error Recovery**: Provide fallback options if clipboard fails
* 7. **Security**: Be cautious with sensitive data in clipboard
* 
*/


export function useCopyToClipboard({
  timeout = 4000,
  onCopy,
}: {
  timeout?: number
  onCopy?: () => void
} = {}) {
  const [isCopied, setIsCopied] =React.useState<string | null>(null)

  const copyToClipboard = (value: string) => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      return
    }

    if (!value) return

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(value)

      if (onCopy) {
        onCopy()
      }

      setTimeout(() => {
        setIsCopied(null)
      }, timeout)
    }, console.error)
  }

  return { isCopied, copyToClipboard }
}
