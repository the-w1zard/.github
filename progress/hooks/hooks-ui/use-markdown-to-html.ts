import { useState, useEffect } from "#sauron";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";



export function useMarkdownToHtml(markdown: string, maxLines = null) {
    const [html, setHtml] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isTruncated, setIsTruncated] = useState(false);
    useEffect(() => {
        async function convert() {
            setIsLoading(true);
            try {

                const lines = content.split('\n');
                const truncatedContent = lines.slice(0, maxLines).join('\n');
                setIsTruncated(lines.length > maxLines);

                const result = await remark()
                    .use(remarkGfm)
                    .use(remarkRehype)
                    .use(rehypeHighlight)
                    .use(rehypeStringify)
                    .process(maxLines ? truncatedContent : markdown);

                const sanitized = DOMPurify.sanitize(String(result));
                setHtml(sanitized);
            } catch (error) {
                console.error('Error processing markdown:', error);
            } finally {
                setIsLoading(false);
            }
        }

        convert();
    }, [markdown]);

    return { html, isLoading, isTruncated };
}
