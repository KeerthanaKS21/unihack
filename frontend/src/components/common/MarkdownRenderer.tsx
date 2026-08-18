'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Safely parses inline markdown syntax (**bold**, *italic*, `code`, [link](url)) into React nodes.
 * Does NOT use dangerouslySetInnerHTML.
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex to match:
  // 1. Links: [text](url)
  // 2. Bold: **text** or __text__
  // 3. Inline code: `code`
  // 4. Italic: *text* or _text_
  const tokenRegex = /(\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;

  const parts = text.split(tokenRegex);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    // Link: [text](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, linkText, linkUrl] = match;
        const safeUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('/') || linkUrl.startsWith('#')
          ? linkUrl
          : '#';
        elements.push(
          <a
            key={index}
            href={safeUrl}
            target={safeUrl.startsWith('http') ? '_blank' : undefined}
            rel={safeUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-blue-600 hover:text-blue-800 font-semibold underline decoration-blue-300 underline-offset-2 inline-flex items-center gap-0.5"
          >
            <span>{parseInlineMarkdown(linkText)}</span>
            {safeUrl.startsWith('http') && <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />}
          </a>
        );
        return;
      }
    }

    // Bold: **text** or __text__
    if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)) {
      const innerText = part.slice(2, -2);
      elements.push(
        <strong key={index} className="font-bold text-slate-900">
          {parseInlineMarkdown(innerText)}
        </strong>
      );
      return;
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const innerText = part.slice(1, -1);
      elements.push(
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200/80 font-semibold"
        >
          {innerText}
        </code>
      );
      return;
    }

    // Italic: *text* or _text_
    if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2 && !part.startsWith('__'))) {
      const innerText = part.slice(1, -1);
      elements.push(
        <em key={index} className="italic text-slate-700">
          {parseInlineMarkdown(innerText)}
        </em>
      );
      return;
    }

    // Plain text
    elements.push(<React.Fragment key={index}>{part}</React.Fragment>);
  });

  return elements;
}

/**
 * Parses markdown blocks (headings, tables, code blocks, lists, blockquotes, paragraphs) into React elements safely.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const rawLines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  let i = 0;
  let blockKey = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Block: ```...```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      if (i < rawLines.length && rawLines[i].trim().startsWith('```')) {
        i++; // skip closing ```
      }
      blocks.push(
        <div key={blockKey++} className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-[11px] shadow-sm">
          {lang && (
            <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {lang}
            </div>
          )}
          <pre className="p-3 overflow-x-auto leading-relaxed whitespace-pre font-mono">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 3. Markdown Table: lines starting and containing |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].slice(1, -1).split('|').map(c => c.trim());
        const isSeparator = tableLines[1].includes('---') || tableLines[1].includes('-|-');
        const dataRows = isSeparator ? tableLines.slice(2) : tableLines.slice(1);

        blocks.push(
          <div key={blockKey++} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2 text-[11px] font-bold text-slate-700">
                      {parseInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {dataRows.map((rowStr, rIdx) => {
                  const cells = rowStr.slice(1, -1).split('|').map(c => c.trim());
                  return (
                    <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-700">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Headings: #, ##, ###, ####
    if (trimmed.startsWith('#### ')) {
      blocks.push(
        <h5 key={blockKey++} className="font-bold text-xs text-slate-900 mt-3 mb-1.5 tracking-tight">
          {parseInlineMarkdown(trimmed.slice(5).trim())}
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={blockKey++} className="font-bold text-xs text-slate-900 mt-3.5 mb-1.5 pb-1 border-b border-slate-100 tracking-tight flex items-center gap-1.5">
          {parseInlineMarkdown(trimmed.slice(4).trim())}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={blockKey++} className="font-bold text-sm text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200 tracking-tight">
          {parseInlineMarkdown(trimmed.slice(3).trim())}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={blockKey++} className="font-bold text-base text-slate-900 mt-4 mb-2 tracking-tight">
          {parseInlineMarkdown(trimmed.slice(2).trim())}
        </h2>
      );
      i++;
      continue;
    }

    // 5. Bullet List: lines starting with •, -, or *
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.startsWith('** '))) {
      const listItems: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        (rawLines[i].trim().startsWith('• ') ||
         rawLines[i].trim().startsWith('- ') ||
         (rawLines[i].trim().startsWith('* ') && !rawLines[i].trim().startsWith('** ')))
      ) {
        const itemText = rawLines[i].trim().replace(/^([•\-*]\s+)/, '');
        listItems.push(itemText);
        i++;
      }

      blocks.push(
        <ul key={blockKey++} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div className="flex-1">{parseInlineMarkdown(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Numbered List: lines starting with 1., 2., etc.
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && rawLines[i].trim() && /^\d+\.\s+/.test(rawLines[i].trim())) {
        const itemText = rawLines[i].trim().replace(/^\d+\.\s+/, '');
        listItems.push(itemText);
        i++;
      }

      blocks.push(
        <ol key={blockKey++} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
              <span className="font-mono font-bold text-blue-600 text-[11px] w-4 shrink-0 text-right">
                {idx + 1}.
              </span>
              <div className="flex-1">{parseInlineMarkdown(item)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular Paragraph Block
    const paragraphLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('```') &&
      !rawLines[i].trim().startsWith('|') &&
      !rawLines[i].trim().startsWith('• ') &&
      !rawLines[i].trim().startsWith('- ') &&
      !(rawLines[i].trim().startsWith('* ') && !rawLines[i].trim().startsWith('** ')) &&
      !/^\d+\.\s+/.test(rawLines[i].trim())
    ) {
      paragraphLines.push(rawLines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push(
        <p key={blockKey++} className="text-xs leading-relaxed text-slate-700 my-1">
          {parseInlineMarkdown(paragraphLines.join('\n'))}
        </p>
      );
    }
  }

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};
