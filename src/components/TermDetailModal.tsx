import React from "react";
import { Term } from "../types";
import { CATEGORIES } from "../data/seedData";
import { X, Info, Star } from "lucide-react";

interface TermDetailModalProps {
  term: Term | null;
  onClose: () => void;
}

export default function TermDetailModal({ term, onClose }: TermDetailModalProps) {
  if (!term) return null;

  const catMeta = CATEGORIES.find((c) => c.id === term.cat) || CATEGORIES[0];

  return (
    <div className="overlay" onClick={onClose}>
      <div 
        className="modal relative max-w-sm w-full bg-card p-8 rounded-2xl border border-line shadow-2xl flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()} // stop close on inner click
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-soft hover:text-ink text-2xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Tag & Category */}
        <div className="flex items-center justify-between">
          <span className={`tag ${catMeta.tag} text-[10px] font-bold px-2.5 py-1 rounded-full`}>
            {catMeta.name}
          </span>
          {term.trending && (
            <span className="flex items-center gap-1 text-[10px] text-yellow-ink bg-yellow/20 px-2 py-0.5 rounded border border-yellow/20 font-bold">
              <Star className="w-3 h-3 fill-yellow text-yellow" />
              <span>TRENDING</span>
            </span>
          )}
        </div>

        {/* Term Title */}
        <div className="flex items-center justify-between border-b border-line pb-4 pt-1">
          <h3 className={term.cat === "emoji" ? "text-6xl select-none" : "font-mono font-bold text-4xl text-indigo tracking-wider"}>
            {term.code}
          </h3>
        </div>

        {/* Meaning Info Block */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Meaning:</span>
          <div className="text-lg font-display font-bold text-ink leading-snug">
            {term.full}
          </div>
        </div>

        {/* Example Block */}
        {term.ex && (
          <div className="space-y-1.5 bg-paper p-4 rounded-xl border border-line">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Example Usage</span>
            </span>
            <p className="text-xs text-ink-soft italic leading-relaxed">
              "{term.ex}"
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className="text-[10px] text-center text-ink-soft pt-2">
          whatsthatmean live abbreviation database index
        </div>
      </div>
    </div>
  );
}
