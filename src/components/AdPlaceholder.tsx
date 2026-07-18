import React, { useEffect, useRef } from "react";
import { AdSlot } from "../types";

interface AdPlaceholderProps {
  slotName: string;
  adSlots: AdSlot[];
  isDbLoaded?: boolean;
}

export default function AdPlaceholder({ slotName, adSlots, isDbLoaded = true }: AdPlaceholderProps) {
  if (!isDbLoaded) return null;

  const slot = adSlots.find((s) => s.name.toLowerCase() === slotName.toLowerCase());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slot && slot.on && slot.adsenseCode && containerRef.current) {
      // Clear container and inject custom code or link
      containerRef.current.innerHTML = "";
      
      const isHtml = /<[a-z][\s\S]*>/i.test(slot.adsenseCode);
      if (isHtml) {
        try {
          const range = document.createRange();
          range.selectNode(containerRef.current);
          const documentFragment = range.createContextualFragment(slot.adsenseCode);
          containerRef.current.appendChild(documentFragment);
        } catch (e) {
          console.error("Failed to inject HTML AdSense code:", e);
          // Fallback to text injection
          containerRef.current.innerText = slot.adsenseCode;
        }
      } else {
        // Render simple link
        const link = document.createElement("a");
        const isUrl = slot.adsenseCode.startsWith("http") || slot.adsenseCode.startsWith("www");
        link.href = isUrl ? slot.adsenseCode : `https://${slot.adsenseCode}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "text-indigo font-bold hover:underline text-xs block p-4 text-center border border-indigo/20 rounded-lg bg-indigo/5 transition";
        link.textContent = `Sponsored Link: ${slot.adsenseCode}`;
        containerRef.current.appendChild(link);
      }
    }
  }, [slot]);

  if (!slot || !slot.on) return null;

  // Determine size styles based on description
  let sizeClasses = "w-full min-h-[90px] max-w-[728px] mx-auto";
  if (slotName.toLowerCase().includes("after hero")) {
    sizeClasses = "w-full max-w-[336px] min-h-[200px] mx-auto";
  } else if (slotName.toLowerCase().includes("sidebar")) {
    sizeClasses = "w-[300px] min-h-[500px] hidden lg:block flex-shrink-0";
  } else if (slotName.toLowerCase().includes("between quiz")) {
    sizeClasses = "w-full max-w-[320px] min-h-[50px] mx-auto my-4";
  }

  // Render the real AdSense container if code is saved
  if (slot.adsenseCode) {
    return (
      <div 
        ref={containerRef} 
        className={`my-6 text-center flex flex-col items-center justify-center overflow-hidden ${sizeClasses}`}
      />
    );
  }

  // Fallback beautiful card representation
  return (
    <div className={`my-6 p-4 bg-card border-1.5 border-dashed border-indigo/25 rounded-xl text-center flex flex-col items-center justify-center relative overflow-hidden bg-indigo/[0.02] shadow-inner select-none ${sizeClasses}`}>
      <span className="text-[9px] font-bold text-indigo bg-indigo/10 px-2 py-0.5 rounded border border-indigo/25 tracking-wider absolute top-2 right-2">
        {slot.network || "AdSense"} SPONSOR
      </span>
      <div className="space-y-1 py-4">
        <div className="text-xs font-semibold text-ink-soft">Advertisement Container</div>
        <div className="font-mono text-[10px] text-indigo/70 font-bold uppercase tracking-wider">
          {slot.name} ({slot.desc.split(",")[0]})
        </div>
      </div>
    </div>
  );
}
