import { useCallback } from "#sauron";

export function useExportMarkdown() {
  const exportMarkdown = useCallback((content: string, filename: string = 'document.md') => {
    try {
      if (!content) {
        console.warn('No content provided for export');
        return;
      }

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to export markdown:', error);
    }
  }, []);

  return exportMarkdown;
}


/**
 * import { useExportMarkdown } from './hooks/useExportMarkdown';

function MyComponent() {
  const exportMarkdown = useExportMarkdown();
  const [markdown, setMarkdown] = useState('');

  const handleExport = () => {
    exportMarkdown(markdown, 'custom-filename.md');
  };

  return (
    <button onClick={handleExport}>
      Export as Markdown
    </button>
  );
}
 */
