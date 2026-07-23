import React from "react";
import AdPlaceholder from "../components/AdPlaceholder";
import { AdSlot } from "../types";
import { ExternalLink } from "lucide-react";

/**
 * Parses blog body markdown-like syntax into beautiful React elements.
 * Supports:
 * - Double newline (\n\n) as paragraph separators
 * - Headings: # (H1), ## (H2), ### (H3)
 * - Images: ![alt](url)
 * - Links: [text](url)
 * - Bold: **text**
 * - Italic: *text*
 * - Lists: lines starting with "- " or "* "
 * - Custom Tag: [AD] or [ad] for explicit in-article ad slot placement
 */
export function renderBlogPostContent(body: string, adSlots?: AdSlot[]): React.ReactNode {
  if (!body) return null;

  // Split content by double newlines for paragraphs
  const blocks = body.split(/\n\s*\n/);

  // Determine if there is any explicit ad container
  const hasExplicitAd = blocks.some(block => block.trim().toUpperCase() === "[AD]");
  
  // If no explicit ad tag is defined, we'll auto-insert the ad after the middle block
  // (only if there are at least 3 blocks to keep a balanced read)
  const adIndex = !hasExplicitAd && blocks.length >= 3 ? Math.floor(blocks.length / 2) - 1 : -1;

  return (
    <div className="space-y-5 text-ink leading-relaxed font-sans text-sm md:text-base">
      {blocks.map((block, blockIdx) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        // 1. Explicit AD block
        if (trimmedBlock.toUpperCase() === "[AD]") {
          return (
            <div key={`ad-${blockIdx}`} className="my-6">
              <AdPlaceholder slotName="In-article blog banner" adSlots={adSlots || []} />
            </div>
          );
        }

        // Check if it's a list block (all lines start with "- " or "* ")
        const lines = trimmedBlock.split("\n");
        const isList = lines.every(line => line.trim().startsWith("- ") || line.trim().startsWith("* "));

        let renderedElement: React.ReactNode = null;

        if (isList) {
          renderedElement = (
            <ul className="list-disc pl-6 space-y-2 my-4">
              {lines.map((line, lineIdx) => {
                const cleanLine = line.trim().substring(2); // remove "- " or "* "
                return (
                  <li key={`list-item-${lineIdx}`} className="text-ink">
                    {parseInlineStyles(cleanLine)}
                  </li>
                );
              })}
            </ul>
          );
        } else {
          // Check if this block is just a single image block
          const imgRegex = /^!\[([^\]]*?)\]\(([^)]+?)\)$/;
          const imgMatch = trimmedBlock.match(imgRegex);
          if (imgMatch) {
            const alt = imgMatch[1];
            const url = imgMatch[2];
            renderedElement = (
              <div className="my-6 max-w-full overflow-hidden rounded-xl border border-line bg-paper/50 p-1 flex flex-col items-center">
                <img 
                  src={url} 
                  alt={alt} 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[420px] object-contain rounded-lg" 
                />
                {alt && (
                  <span className="text-xs text-ink-soft mt-2 text-center italic">{alt}</span>
                )}
              </div>
            );
          } else if (trimmedBlock.startsWith("> ")) {
            // 2. Blockquote support for texting dialogues / examples
            renderedElement = (
              <blockquote className="border-l-4 border-indigo bg-indigo/5 px-4 py-3 my-4 italic text-ink-soft rounded-r-lg">
                {parseInlineStyles(trimmedBlock.substring(2))}
              </blockquote>
            );
          } else if (trimmedBlock.startsWith("[info]")) {
            // 3. Educational alert banner support
            renderedElement = (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl my-4 text-ink flex gap-3 text-sm">
                <span className="text-amber-500 font-bold">💡 Tip:</span>
                <div>{parseInlineStyles(trimmedBlock.substring(6).trim())}</div>
              </div>
            );
          } else if (trimmedBlock.startsWith("# ")) {
            // Heading 1 (rendered as elegant high-contrast display heading)
            renderedElement = (
              <h3 className="font-display font-bold text-2xl md:text-3xl text-ink pt-6 pb-2 border-b border-line mt-8 mb-3 tracking-tight">
                {parseInlineStyles(trimmedBlock.substring(2))}
              </h3>
            );
          } else if (trimmedBlock.startsWith("## ")) {
            // Heading 2 (primary subheading)
            renderedElement = (
              <h4 className="font-display font-bold text-xl md:text-2xl text-ink pt-4 mt-8 mb-2 tracking-tight">
                {parseInlineStyles(trimmedBlock.substring(3))}
              </h4>
            );
          } else if (trimmedBlock.startsWith("### ")) {
            // Heading 3 (nested section)
            renderedElement = (
              <h5 className="font-display font-bold text-lg text-ink pt-2 mt-6 mb-1">
                {parseInlineStyles(trimmedBlock.substring(4))}
              </h5>
            );
          } else {
            // Standard paragraph
            renderedElement = (
              <p className="text-ink leading-relaxed mb-4">
                {parseInlineStyles(trimmedBlock)}
              </p>
            );
          }
        }

        // If this is the index for automatic ad injection, render the block and follow with an ad banner
        if (blockIdx === adIndex && adSlots) {
          return (
            <div key={`block-ad-${blockIdx}`}>
              {renderedElement}
              <div className="my-6">
                <AdPlaceholder slotName="In-article blog banner" adSlots={adSlots} />
              </div>
            </div>
          );
        }

        return <div key={`block-${blockIdx}`}>{renderedElement}</div>;
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
              loading="lazy"
              referrerPolicy="no-referrer"
              className="max-w-full h-auto max-h-[300px] rounded-lg object-contain border border-line" 
            />
            {label && <span className="block text-[11px] text-ink-soft text-center italic mt-1">{label}</span>}
          </span>
        );
      } else {
        const isInternal = 
          url.startsWith("/") || 
          url.startsWith("https://whatsthatmean.com") || 
          url.startsWith("https://www.whatsthatmean.com") ||
          url.startsWith("http://whatsthatmean.com") ||
          url.startsWith("http://www.whatsthatmean.com") ||
          (!url.includes("://") && !url.startsWith("mailto:") && !url.startsWith("tel:"));

        let finalUrl = url;
        const domains = [
          "https://whatsthatmean.com",
          "https://www.whatsthatmean.com",
          "http://whatsthatmean.com",
          "http://www.whatsthatmean.com"
        ];
        for (const dom of domains) {
          if (url.startsWith(dom)) {
            finalUrl = url.substring(dom.length);
            break;
          }
        }
        if (isInternal && !finalUrl.startsWith("/") && !finalUrl.startsWith("mailto:") && !finalUrl.startsWith("tel:")) {
          finalUrl = "/" + finalUrl;
        }

        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          if (isInternal) {
            e.preventDefault();
            // Dispatch custom SPA navigation event
            const navEvent = new CustomEvent("spa-navigate", { detail: { path: finalUrl } });
            window.dispatchEvent(navEvent);
          }
        };

        elements.push(
          <a 
            key={`link-${key++}`} 
            href={url} 
            target={isInternal ? "_self" : "_blank"} 
            rel={isInternal ? "" : "noopener noreferrer"}
            onClick={handleClick}
            className={`inline-flex items-center gap-0.5 font-semibold transition ${
              isInternal 
                ? "text-indigo hover:text-indigo-dark underline" 
                : "text-blue-600 dark:text-blue-400 hover:underline inline-baseline"
            }`}
            title={isInternal ? `Internal Link: ${finalUrl}` : `External Reference: ${url}`}
          >
            <span>{parseInlineStyles(label)}</span>
            {!isInternal && <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80 ml-0.5" />}
          </a>
        );
      }
    } else if (match[4] !== undefined) {
      // It's bold: [5] is the text
      elements.push(
        <strong key={`bold-${key++}`} className="font-bold text-ink">
          {parseInlineStyles(match[5])}
        </strong>
      );
    } else if (match[6] !== undefined) {
      // It's italic: [7] is the text
      elements.push(
        <em key={`italic-${key++}`} className="italic text-ink">
          {parseInlineStyles(match[7])}
        </em>
      );
    }

    currentIndex = regex.lastIndex;
  }

  if (currentIndex < text.length) {
    elements.push(text.substring(currentIndex));
  }

  if (elements.length === 0) return text;
  if (elements.length === 1) return elements[0];

  return (
    <React.Fragment>
      {elements.map((el, i) => (
        typeof el === "string" ? <span key={`tok-${i}`}>{el}</span> : el
      ))}
    </React.Fragment>
  );
}
