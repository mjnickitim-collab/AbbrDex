import React from "react";
import { AdSlot } from "../types";

interface AdPlaceholderProps {
  slotName: string;
  adSlots: AdSlot[];
  isDbLoaded?: boolean;
}

export default function AdPlaceholder({ slotName, adSlots, isDbLoaded = true }: AdPlaceholderProps) {
  if (!isDbLoaded) return null;

  const slot = adSlots.find((s) => s.name.toLowerCase() === slotName.toLowerCase());

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

  // Render the real AdSense container if code is saved using standard React dangerouslySetInnerHTML or safe link
  if (slot.adsenseCode) {
    const isHtml = /<[a-z][\s\S]*>/i.test(slot.adsenseCode);

    if (isHtml) {
      return (
        <div 
          className={`my-6 text-center flex flex-col items-center justify-center overflow-hidden ${sizeClasses}`}
          dangerouslySetInnerHTML={{ __html: slot.adsenseCode }}
        />
      );
    }

    const isUrl = slot.adsenseCode.startsWith("http") || slot.adsenseCode.startsWith("www");
    const hrefUrl = isUrl ? slot.adsenseCode : `https://${slot.adsenseCode}`;

    return (
      <div className={`my-6 text-center flex flex-col items-center justify-center overflow-hidden ${sizeClasses}`}>
        <a
          href={hrefUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo font-bold hover:underline text-xs block p-4 text-center border border-indigo/20 rounded-lg bg-indigo/5 transition w-full"
        >
          Sponsored Link: {slot.adsenseCode}
        </a>
      </div>
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

