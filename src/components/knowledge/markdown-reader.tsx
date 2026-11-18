'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownReader({ markdown }: { markdown: string }) {
  return <div className="knowledge-markdown"><ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={{
    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" referrerPolicy="no-referrer" />,
    table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
  }}>{markdown}</ReactMarkdown></div>
}
