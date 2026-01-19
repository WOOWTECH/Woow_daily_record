// src/core/components/markdown-renderer.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    maxLines?: number; // For preview mode
}

export function MarkdownRenderer({ content, className, maxLines }: MarkdownRendererProps) {
    const html = useMemo(() => {
        if (!content) return "";

        // Basic Markdown to HTML conversion
        return content
            // Headers
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-brand-black dark:text-brand-white">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-brand-black dark:text-brand-white">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-brand-black dark:text-brand-white">$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
            .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
            // Strikethrough
            .replace(/~~(.*?)~~/g, '<del class="line-through text-brand-deep-gray">$1</del>')
            // Code blocks (inline)
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-brand-gray/50 dark:bg-white/10 text-sm font-mono text-brand-blue">$1</code>')
            // Unordered lists
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
            // Ordered lists
            .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
            // Blockquotes
            .replace(/^> (.*$)/gm, '<blockquote class="pl-4 border-l-4 border-brand-blue/50 italic text-brand-deep-gray my-2">$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gm, '<hr class="my-4 border-brand-gray dark:border-white/20" />')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-blue hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
            // Line breaks
            .replace(/\n\n/g, '</p><p class="mb-3">')
            .replace(/\n/g, '<br />');
    }, [content]);

    if (!content) {
        return null;
    }

    return (
        <div
            className={cn(
                "prose prose-sm dark:prose-invert max-w-none",
                "text-brand-black dark:text-brand-white",
                "[&_p]:mb-3 [&_li]:my-1",
                maxLines && `line-clamp-${maxLines}`,
                className
            )}
            dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${html}</p>` }}
        />
    );
}
