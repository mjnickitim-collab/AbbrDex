import React, { useState, useEffect } from "react";
import { Term, AdSlot } from "../types";
import { CATEGORIES } from "../data/seedData";
import { generateTermArticle } from "../utils/termArticleGenerator";
import AdPlaceholder from "./AdPlaceholder";
import { 
  BookOpen, 
  Star, 
  Share2, 
  Check, 
  ArrowLeft, 
  Search, 
  Tag,
  ExternalLink
} from "lucide-react";

interface TermDetailViewProps {
  code: string;
  terms: Term[];
  adSlots?: AdSlot[];
  isDbLoaded?: boolean;
  onSelectTerm: (term: Term) => void;
  onNavigate: (view: string) => void;
}

export default function TermDetailView({ code, terms, adSlots = [], isDbLoaded = true, onSelectTerm, onNavigate }: TermDetailViewProps) {
  const [copied, setCopied] = useState(false);

  // Find the exact term by code (case-insensitive)
  const currentCodeUpper = decodeURIComponent(code).toUpperCase().trim();
  const term = terms.find((t) => t.code.toUpperCase().trim() === currentCodeUpper);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [code]);

  if (!term) {
    return (
      <div className="max-w-[1080px] mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 inline-block font-mono text-xl font-bold">
          Term "{currentCodeUpper}" Not Found
        </div>
        <p className="text-ink-soft text-sm max-w-md mx-auto">
          We couldn't find the requested abbreviation. It may have been renamed or relocated.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={() => onNavigate("home")} 
            className="px-5 py-2.5 bg-indigo text-white font-bold rounded-xl hover:bg-indigo-dark transition text-xs cursor-pointer shadow-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>
          <button 
            onClick={() => onNavigate("browse")} 
            className="px-5 py-2.5 bg-card border border-line text-ink font-bold rounded-xl hover:bg-paper transition text-xs cursor-pointer flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-indigo" />
            <span>Browse Dictionary</span>
          </button>
        </div>
      </div>
    );
  }

  const catMeta = CATEGORIES.find((c) => c.id === term.cat) || CATEGORIES[0];
  const article = generateTermArticle(term);

  // Related terms in same category
  const relatedTerms = terms
    .filter((t) => t.cat === term.cat && t.code.toUpperCase() !== currentCodeUpper)
    .slice(0, 6);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/term/${encodeURIComponent(term.code.toUpperCase())}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Breadcrumb Navigation for SEO & UX */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-soft font-medium flex-wrap">
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); onNavigate("home"); }}
          className="hover:text-indigo transition"
        >
          Home
        </a>
        <span>/</span>
        <a 
          href={`/browse/${term.cat}`} 
          onClick={(e) => { e.preventDefault(); onNavigate("browse"); }}
          className="hover:text-indigo transition"
        >
          {catMeta.name}
        </a>
        <span>/</span>
        <span className="text-ink font-bold font-mono">{term.code}</span>
      </nav>

      {/* Hero Title Header Box */}
      <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
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
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-paper hover:bg-paper-dark border border-line rounded-lg text-xs font-medium text-ink transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Permalink!" : "Share Page"}</span>
          </button>
        </div>

        {/* Title Block */}
        <div className="space-y-3">
          <span className="text-xs font-bold font-mono text-indigo uppercase tracking-wider">Online Abbreviation & Slang Guide</span>
          <h1 className="font-mono font-black text-4xl sm:text-5xl md:text-6xl text-indigo tracking-tight">
            What Does <span className="text-ink">{term.code}</span> Stand For?
          </h1>
          <div className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-ink leading-snug">
            {term.code} Meaning: <span className="text-indigo">{term.full}</span>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-indigo/5 border border-indigo/20 p-5 rounded-xl space-y-3">
          <p className="text-sm sm:text-base text-ink leading-relaxed">
            {article.overview}
          </p>
        </div>
      </div>

      {/* Top Ad Banner Slot for AdSense */}
      <AdPlaceholder slotName="Header banner" adSlots={adSlots} isDbLoaded={isDbLoaded} />

      {/* Main Editorial Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Comprehensive Article (2/3 width) */}
        <div className="lg:col-span-2 space-y-8 bg-card border border-line rounded-2xl p-6 sm:p-8 shadow-sm divide-y divide-line/60">
          
          {/* Section 1: Origin & History */}
          <section className="space-y-3 pt-1">
            <h2 className="text-ink font-display font-bold text-2xl">1. Etymology, Origin & History</h2>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed text-justify">
              {article.etymology}
            </p>
          </section>

          {/* Section 2: Usage Scenarios */}
          <section className="pt-8 space-y-4">
            <h2 className="text-ink font-display font-bold text-2xl">2. Usage Scenarios & Examples</h2>
            <p className="text-sm text-ink-soft">
              Below are typical real-world contexts where <strong className="text-ink">{term.code}</strong> appears in daily text conversations:
            </p>

            <div className="space-y-4">
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
          </section>

          {/* In-Article Mid Ad Banner */}
          <div className="pt-8">
            <AdPlaceholder slotName="In-content — after hero" adSlots={adSlots} isDbLoaded={isDbLoaded} />
          </div>

          {/* Section 3: Related Comparisons */}
          <section className="pt-8 space-y-4">
            <h2 className="text-ink font-display font-bold text-2xl">3. Similar Terms & Nuances</h2>
            <div className="space-y-3">
              {article.comparisons.map((comp, idx) => (
                <div key={idx} className="bg-paper p-4 rounded-xl border border-line space-y-1.5">
                  <h3 className="font-display font-bold text-sm text-indigo">{comp.term}</h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{comp.difference}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Pitfalls */}
          <section className="pt-8 space-y-4">
            <h2 className="text-ink font-display font-bold text-2xl">4. Common Misconceptions & Pitfalls</h2>
            <ul className="space-y-2.5">
              {article.pitfalls.map((pf, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-soft leading-relaxed bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                  <span className="text-rose-600 font-bold mt-0.5">•</span>
                  <span>{pf}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5: Cultural Background */}
          <section className="pt-8 space-y-3">
            <h2 className="text-ink font-display font-bold text-2xl">5. Cultural Lore & Social Media Context</h2>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed text-justify">
              {article.culturalLore}
            </p>
          </section>

          {/* Section 6: FAQ */}
          <section className="pt-8 space-y-4">
            <h2 className="text-ink font-display font-bold text-2xl">6. Frequently Asked Questions (FAQ)</h2>

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
          </section>

        </div>

        {/* Right Sidebar Column (1/3 width) for Ads & Related Terms */}
        <aside className="space-y-6">
          
          {/* Sticky Sidebar Box */}
          <div className="sticky top-20 space-y-6">
            
            {/* Sidebar Ad Unit */}
            <AdPlaceholder slotName="Sidebar" adSlots={adSlots} isDbLoaded={isDbLoaded} />

            {/* Related Terms Card */}
            {relatedTerms.length > 0 && (
              <div className="bg-card border border-line rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <Tag className="w-4 h-4 text-indigo" />
                  <h3 className="font-display font-bold text-base text-ink">
                    More {catMeta.name} Terms
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {relatedTerms.map((rt) => (
                    <a
                      key={rt.id}
                      href={`/term/${encodeURIComponent(rt.code.toUpperCase())}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectTerm(rt);
                      }}
                      className="block p-3 bg-paper hover:bg-paper-dark border border-line/70 hover:border-indigo rounded-xl transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-indigo group-hover:text-ink">
                          {rt.code}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-ink-soft group-hover:text-indigo transition" />
                      </div>
                      <p className="text-xs text-ink-soft line-clamp-1 mt-0.5">
                        {rt.full}
                      </p>
                    </a>
                  ))}
                </div>

                <button
                  onClick={() => onNavigate("browse")}
                  className="w-full py-2.5 text-center bg-indigo/10 hover:bg-indigo/20 text-indigo font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  View All Dictionary Terms →
                </button>
              </div>
            )}

          </div>
        </aside>

      </div>

    </article>
  );
}
