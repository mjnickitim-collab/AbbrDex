import React from "react";

/**
 * Parses blog body markdown-like syntax into beautiful React elements.
 * Supports:
 * - Double newline (\n\n) as paragraph separators
 * - Images: ![alt](url)
 * - Links: [text](url)
 * - Bold: **text**
 * - Italic: *text*
 * - Lists: lines starting with "- " or "* "
 */
export function renderBlogPostContent(body: string): React.ReactNode {
  if (!body) return null;

  // Split content by double newlines for paragraphs
  const blocks = body.split(/\n\s*\n/);

  return (
    <div className="space-y-5 text-ink leading-relaxed font-sans text-sm md:text-base">
      {blocks.map((block, blockIdx) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        // Check if it's a list block (all lines start with "- " or "* ")
        const lines = trimmedBlock.split("\n");
        const isList = lines.every(line => line.trim().startsWith("- ") || line.trim().startsWith("* "));

        if (isList) {
          return (
            <ul key={blockIdx} className="list-disc pl-6 space-y-2 my-4">
              {lines.map((line, lineIdx) => {
                const cleanLine = line.trim().substring(2); // remove "- " or "* "
                return (
                  <li key={lineIdx} className="text-ink">
                    {parseInlineStyles(cleanLine)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if this block is just a single image block
        const imgRegex = /^!\[([^\]]*?)\]\(([^)]+?)\)$/;
        const imgMatch = trimmedBlock.match(imgRegex);
        if (imgMatch) {
          const alt = imgMatch[1];
          const url = imgMatch[2];
          return (
            <div key={blockIdx} className="my-6 max-w-full overflow-hidden rounded-xl border border-line bg-paper/50 p-1 flex flex-col items-center">
              <img 
                src={url} 
                alt={alt} 
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[420px] object-contain rounded-lg" 
              />
              {alt && (
                <span className="text-xs text-ink-soft mt-2 text-center italic">{alt}</span>
              )}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={blockIdx} className="text-ink leading-relaxed">
            {parseInlineStyles(trimmedBlock)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineStyles(text: string): React.ReactNode {
  // We'll tokenize the string to handle images, links, bold, and italic
  // Let's use a combined regex to find matches in order
  const regex = /(!?\[)([^\]]*?)\]\(([^)]+?)\)|(\*\*|__)(.*?)\4|(\*|_)(.*?)\6/g;
  
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    // Add plain text before match
    if (matchIndex > currentIndex) {
      elements.push(text.substring(currentIndex, matchIndex));
    }

    if (match[1] !== undefined) {
      // It's a link or image: [2] is alt/label, [3] is url
      const isImage = match[1] === "![";
      const label = match[2];
      const url = match[3];

      if (isImage) {
        elements.push(
          <span key={`img-${key++}`} className="inline-block my-2 max-w-full">
            <img 
              src={url} 
              alt={label} 
              referrerPolicy="no-referrer"
              className="max-w-full h-auto max-h-[300px] rounded-lg object-contain border border-line" 
            />
            {label && <span className="block text-[11px] text-ink-soft text-center italic mt-1">{label}</span>}
          </span>
        );
      } else {
        elements.push(
          <a 
            key={`link-${key++}`} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo hover:text-indigo-dark underline font-semibold transition"
          >
            {label}
          </a>
        );
      }
    } else if (match[4] !== undefined) {
      // It's bold: [5] is the text
      elements.push(
        <strong key={`bold-${key++}`} className="font-bold text-ink">
          {match[5]}
        </strong>
      );
    } else if (match[6] !== undefined) {
      // It's italic: [7] is the text
      elements.push(
        <em key={`italic-${key++}`} className="italic text-ink">
          {match[7]}
        </em>
      );
    }

    currentIndex = regex.lastIndex;
  }

  if (currentIndex < text.length) {
    elements.push(text.substring(currentIndex));
  }

  return elements.length > 0 ? elements : text;
}
