import { useExportMarkdown } from "~/components/midgardr"
import { Download } from "lucide-react"

export function UseExportMarkdownDemo() {
  const [markdownContent, setMarkdownContent] = React.useState(`# Welcome to My Document

## Introduction
This is a sample markdown document.

### Features
- Easy to write
- Simple syntax
- Portable format

**Bold text** and *italic text*

\`\`\`javascript
// Code block
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`
`)
  
  const exportMarkdown = useExportMarkdown()

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0]
    exportMarkdown(markdownContent, `document-${timestamp}.md`)
  }

  const handleExportWithCustomName = () => {
    const customName = prompt('Enter filename (without .md extension):', 'my-document')
    if (customName) {
      exportMarkdown(markdownContent, customName)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Markdown Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportWithCustomName}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Save As...
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Markdown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit Markdown
          </label>
          <textarea
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Write your markdown content here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div className="h-96 p-4 border border-gray-300 rounded-md overflow-y-auto prose max-w-none">
            {/* In a real app, you'd use a markdown parser like react-markdown */}
            <pre className="whitespace-pre-wrap text-sm">
              {markdownContent}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Word count: {markdownContent.split(/\s+/).filter(Boolean).length}</p>
        <p>Character count: {markdownContent.length}</p>
      </div>
    </div>
  )
}