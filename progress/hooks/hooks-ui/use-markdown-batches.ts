import { useState, useEffect } from "#sauron";
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import DOMPurify from 'dompurify';

// Create processor ONCE and reuse it
const createMarkdownProcessor = () => {
    return remark()
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeHighlight)
        .use(rehypeStringify);
};

// Singleton processor instance
let sharedProcessor: ReturnType<typeof createMarkdownProcessor> | null = null;

const getProcessor = () => {
    if (!sharedProcessor) {
        sharedProcessor = createMarkdownProcessor();
    }
    return sharedProcessor;
};

// useMarkdownBatch.tsx
export function useMarkdownBatches(markdownSections: Array<{ id: string; content: string; maxLines?: number }>) {
    const [results, setResults] = useState<Array<{
        html: string;
        isLoading: boolean;
        isTruncated: boolean;
    }>>({});

    useEffect(() => {
        async function processBatch() {
            const processor = getProcessor();

            // Set all to loading initially
            const initialResults: typeof results = {};
            markdownSections.forEach(({ id }) => {
                initialResults[id] = {
                    html: '',
                    isLoading: true,
                    isTruncated: false
                };
            });
            setResults(initialResults);

            // Process in batches of 5 to avoid overwhelming
            const batchSize = 5;
            for (let i = 0; i < markdownSections.length; i += batchSize) {
                const batch = markdownSections.slice(i, i + batchSize);

                const promises = batch.map(async ({ id, content, maxLines }) => {
                    try {
                        let contentToProcess = content;
                        let isTruncated = false;

                        if (maxLines) {
                            const lines = content.split('\n');
                            if (lines.length > maxLines) {
                                contentToProcess = lines.slice(0, maxLines).join('\n');
                                isTruncated = true;
                            }
                        }

                        const cacheKey = maxLines
                            ? `${contentToProcess}|${maxLines}`
                            : contentToProcess;

                        if (markdownCache.has(cacheKey)) {
                            return {
                                id,
                                html: markdownCache.get(cacheKey)!,
                                isTruncated,
                                error: null
                            };
                        }

                        const result = await processor.process(contentToProcess);
                        const html = DOMPurify.sanitize(String(result));
                        markdownCache.set(cacheKey, html);

                        return { id, html, isTruncated, error: null };
                    } catch (error) {
                        return {
                            id,
                            html: '<p>Error rendering markdown</p>',
                            isTruncated: false,
                            error
                        };
                    }
                });

                const batchResults = await Promise.all(promises);

                // Update state with batch results
                setResults(prev => {
                    const updated = { ...prev };
                    batchResults.forEach(result => {
                        updated[result.id] = {
                            html: result.html,
                            isLoading: false,
                            isTruncated: result.isTruncated
                        };
                    });
                    return updated;
                });
            }
        }

        processBatch();
    }, [markdownSections]);

    return results;
}

// Usage:
