import React, { useState } from "react";
import { Term } from "../types";
import { CATEGORIES } from "../data/seedData";
import { generateTermArticle } from "../utils/termArticleGenerator";
import { 
  X, 
  Info, 
  Star, 
  BookOpen, 
  History, 
  MessageSquare, 
  GitCompare, 
  AlertTriangle, 
  Globe, 
  HelpCircle, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck 
} from "lucide-react";

interface TermDetailModalProps {
  term: Term | null;
  onClose: () => void;
}

export default function TermDetailModal({ term, onClose }: TermDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"article" | "faq">("article");

  if (!term) return null;

  const catMeta = CATEGORIES.find((c) => c.id === term.cat) || CATEGORIES[0];
  const article = generateTermArticle(term);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/term/${encodeURIComponent(term.code.toUpperCase())}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overlay z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <div 
        className="modal relative max-w-3xl w-full bg-card my-auto rounded-2xl border border-line shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-line p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`tag ${catMeta.tag} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5`}>
              <BookOpen className="w-3.5 h-3.5" />
              <span>{catMeta.name}</span>
            </span>
            {term.trending && (
              <span className="flex items-center gap-1 text-xs text-yellow-ink bg-yellow/20 px-2.5 py-1 rounded-full border border-yellow/20 font-bold">
                <Star className="w-3.5 h-3.5 fill-yellow text-yellow" />
                <span>TRENDING</span>
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-ink-soft bg-paper px-2.5 py-1 rounded-md border border-line">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{article.fullWordCount} Words • Encyclopedia Entry</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy link to this term"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line rounded-lg text-xs font-medium text-ink transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied Link!" : "Share Term"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 divide-y divide-line/60">
          
          {/* Main Title & Core Definition Hero */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-line/60 pb-4">
              <div>
                <span className="text-xs font-bold font-mono text-indigo uppercase tracking-wider">Acronym / Abbreviation</span>
                <h1 className={term.cat === "emoji" ? "text-6xl sm:text-7xl select-none" : "font-mono font-black text-4xl sm:text-5xl text-indigo tracking-tight"}>
                  {term.code}
                </h1>
              </div>
              <div className="sm:text-right">
                <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Full Spelled-Out Phrase:</span>
                <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink leading-tight">
                  {term.full}
                </div>
              </div>
            </div>

            {/* Quick Summary Callout */}
            <div className="bg-indigo/5 border border-indigo/20 p-4 sm:p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo font-display font-bold text-sm">
                <Info className="w-4 h-4" />
                <span>Executive Summary & Tone Rating</span>
              </div>
              <p className="text-sm text-ink leading-relaxed">
                {article.overview}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                <span className="bg-card px-2.5 py-1 rounded border border-indigo/20 text-ink-soft">
                  Tone: <strong className="text-ink">{article.formalityLevel}</strong>
                </span>
                <span className="bg-card px-2.5 py-1 rounded border border-indigo/20 text-ink-soft">
                  Category: <strong className="text-ink">{catMeta.name}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Meaning & Etymology (의미의 역사 및 어원) */}
          <div className="pt-8 space-y-3">
            <div className="flex items-center gap-2 text-ink font-display font-bold text-xl">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <h2>1. Etymology, History & Linguistic Origin</h2>
            </div>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed text-justify">
              {article.etymology}
            </p>
          </div>

          {/* Section 2: Real-World Usage Scenarios & Tone Guide (실제 사용 사례 및 어조) */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-2 text-ink font-display font-bold text-xl">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2>2. Real-World Usage Scenarios & Dialogue Examples</h2>
            </div>
            <p className="text-sm text-ink-soft">
              Here are typical situations where <strong className="text-ink">{term.code}</strong> is used in modern conversation, along with dialogue examples:
            </p>

            <div className="grid grid-cols-1 gap-4">
              {article.usageScenarios.map((scenario, idx) => (
                <div key={idx} className="bg-paper p-4 sm:p-5 rounded-xl border border-line space-y-2">
                  <h3 className="font-display font-bold text-sm text-ink">{scenario.title}</h3>
                  <p className="text-xs text-ink-soft leading-relaxed">{scenario.desc}</p>
                  <div className="bg-card p-3 rounded-lg border border-line/60 font-mono text-xs text-ink italic">
                    {scenario.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Similar / Related Terms Comparison (비슷한 약어 비교) */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-2 text-ink font-display font-bold text-xl">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <GitCompare className="w-5 h-5" />
              </div>
              <h2>3. Comparison with Similar Terms & Nuances</h2>
            </div>
            <div className="space-y-3">
              {article.comparisons.map((comp, idx) => (
                <div key={idx} className="bg-paper p-4 rounded-xl border border-line space-y-1.5">
                  <h3 className="font-display font-bold text-sm text-indigo">{comp.term}</h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{comp.difference}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Common Misconceptions & Pitfalls (오해 사례 및 주의점) */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-2 text-ink font-display font-bold text-xl">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2>4. Common Misconceptions & Usage Pitfalls</h2>
            </div>
            <ul className="space-y-2.5">
              {article.pitfalls.map((pf, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-soft leading-relaxed bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                  <span className="text-rose-600 font-bold mt-0.5">•</span>
                  <span>{pf}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5: Cultural Background & Internet Lore (문화적 배경 및 관련 밈) */}
          <div className="pt-8 space-y-3">
            <div className="flex items-center gap-2 text-ink font-display font-bold text-xl">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <h2>5. Cultural Background & Internet Pop Culture</h2>
            </div>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed text-justify">
              {article.culturalLore}
            </p>
          </div>

          {/* Section 6: Frequently Asked Questions (FAQ) */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-2 text-ink font-display font-bold text-xl">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2>6. Frequently Asked Questions (FAQ) about {term.code}</h2>
            </div>

            <div className="space-y-3">
              {article.faqs.map((faq, idx) => (
                <div key={idx} className="bg-paper p-4 rounded-xl border border-line space-y-2">
                  <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                    <span className="text-indigo font-mono">Q.</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed pl-5 border-l-2 border-indigo">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Disclaimer & Verification Footer */}
          <div className="pt-8">
            <div className="bg-paper p-4 rounded-xl border border-line text-center space-y-2">
              <p className="text-xs text-ink-soft">
                Verified lexicographical reference provided by <strong>whatsthatmean</strong> open abbreviation repository.
              </p>
              <div className="flex items-center justify-center gap-4 text-[11px] text-ink-soft pt-1">
                <button onClick={handleCopyLink} className="hover:text-indigo underline cursor-pointer">
                  Copy Direct Permalink
                </button>
                <span>•</span>
                <span className="font-mono">{article.fullWordCount} Words Total</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
