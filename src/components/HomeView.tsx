import React, { useState, useEffect, useMemo } from "react";
import { Category, Term, BlogPost } from "../types";
import { CATEGORIES } from "../data/seedData";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Search, BookOpen, Calendar, TrendingUp, Sparkles, RefreshCw, Grid, Play } from "lucide-react";

interface HomeViewProps {
  terms: Term[];
  onSearch: (query: string) => void;
  onSelectCategory: (catId: string) => void;
  onSelectTerm: (term: Term) => void;
  blogs: BlogPost[];
  onSelectBlogPost: (post: BlogPost) => void;
  onSelectEmojiQuiz: () => void;
  onSelectEmojiDict: () => void;
}

// Sliding reel order for live decoder
const REEL_ORDER = ["FYI", "GG", "ASAP", "FOMO", "SNAFU", "HMU", "WFH", "TBH", "IMHO", "NSFW", "ETA", "GOAT", "TL;DR", "TBD"];

export default function HomeView({ 
  terms, 
  onSearch, 
  onSelectCategory, 
  onSelectTerm, 
  blogs, 
  onSelectBlogPost,
  onSelectEmojiQuiz,
  onSelectEmojiDict
}: HomeViewProps) {
  const [searchVal, setSearchVal] = useState("");
  const [reelIdx, setReelIdx] = useState(0);
  const [dailyTerm, setDailyTerm] = useState<Term | null>(null);
  const [randomSeed, setRandomSeed] = useState(0);

  // Interval for sliding reel
  useEffect(() => {
    const timer = setInterval(() => {
      setReelIdx((prev) => (prev + 1) % REEL_ORDER.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Compute Abbreviation of the Day deterministically based on date
  useEffect(() => {
    const nonEmojiTerms = terms.filter(t => t.cat !== "emoji");
    if (nonEmojiTerms.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0]; // stable day index
      let hash = 0;
      for (let i = 0; i < todayStr.length; i++) {
        hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % nonEmojiTerms.length;
      setDailyTerm(nonEmojiTerms[index]);
    }
  }, [terms]);

  const handleShuffleDailyTerm = () => {
    const nonEmojiTerms = terms.filter(t => t.cat !== "emoji");
    if (nonEmojiTerms.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonEmojiTerms.length);
      setDailyTerm(nonEmojiTerms[randomIndex]);
    }
  };

  // Select 10 popular/trending acronyms randomly or by term flag
  const trendingTerms = useMemo(() => {
    const pool = terms.filter(t => t.cat !== "emoji");
    if (pool.length === 0) return [];
    
    // Pick explicit trending or shuffle
    const explicit = pool.filter(t => t.trending);
    const sourceList = explicit.length >= 10 ? explicit : pool;
    
    // Pseudo-random shuffle based on seed
    const shuffled = [...sourceList].sort(() => 0.5 - (Math.random() + randomSeed * 0.01));
    return shuffled.slice(0, 10);
  }, [terms, randomSeed]);

  // Categories sorted by popularity (term count)
  const sortedCategories = useMemo(() => {
    return [...CATEGORIES].sort((a, b) => {
      const countA = terms.filter(t => t.cat === a.id).length;
      const countB = terms.filter(t => t.cat === b.id).length;
      return countB - countA;
    }).slice(0, 15); // Exactly 15 items for 5x3 grid
  }, [terms]);

  // Find active reel term details
  const activeReelCode = REEL_ORDER[reelIdx];
  const activeReelTerm = terms.find((t) => t.code === activeReelCode) || {
    code: activeReelCode,
    full: "Decoding...",
    cat: "internet",
    ex: ""
  } as Term;

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === activeReelTerm.cat) || CATEGORIES[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal.trim());
    }
  };

  const totalTermCount = terms.length > 2900 ? terms.length : 2976;

  return (
    <div className="w-full space-y-12 pb-12">
      {/* 1. Centered Hero Section */}
      <section className="hero pt-12 pb-8 px-6 max-w-[960px] mx-auto text-center space-y-6">
        <span className="eyebrow inline-flex items-center gap-1.5 font-mono font-semibold text-xs text-indigo bg-indigo/10 px-4 py-1.5 rounded-full border border-indigo/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo animate-pulse" />
          <span>{totalTermCount}+ abbreviations & acronyms</span>
        </span>

        <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-[1.15] text-ink tracking-tight max-w-[800px] mx-auto">
          Decode the world's abbreviations, one shorthand at a time.
        </h1>

        <p className="sub text-base sm:text-lg text-ink-soft max-w-[620px] mx-auto leading-relaxed">
          From everyday texting acronyms to professional workplace shorthand — explained clearly, tested playfully.
        </p>

        {/* Centered Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-row flex flex-col sm:flex-row gap-2.5 max-w-[560px] mx-auto w-full pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-soft" />
            <input
              type="text"
              placeholder="Search for a term, e.g. ASAP, WFH, FOMO..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 border-1.5 border-line rounded-xl bg-card text-sm font-mono text-ink shadow-sm focus:outline-none focus:border-indigo transition"
            />
          </div>
          <button type="submit" className="btn btn-solid font-display font-bold px-6 py-3.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition">
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Tag Badges under Search */}
        <div className="flex flex-wrap justify-center items-center gap-2 pt-1 text-xs text-ink-soft">
          <span className="font-semibold text-ink-soft/80">Popular:</span>
          {["ASAP", "WFH", "FOMO", "TBH", "GOAT", "TL;DR"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onSearch(code)}
              className="px-2.5 py-1 bg-surface hover:bg-indigo/10 border border-line hover:border-indigo/30 rounded-lg text-xs font-mono font-bold text-ink hover:text-indigo transition cursor-pointer"
            >
              #{code}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Trending Acronyms Section (Boosts SEO & Dwell Time via Internal Links) */}
      <section className="py-8 px-6 max-w-[1080px] mx-auto">
        <div className="bg-surface/80 border border-line rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="font-display font-bold text-xl text-ink">Trending Acronyms</h2>
              </div>
              <p className="text-xs text-ink-soft font-medium">
                High-traffic shorthand terms decoded for instant lookups
              </p>
            </div>

            <button
              onClick={() => setRandomSeed(prev => prev + 1)}
              className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold text-indigo bg-indigo/10 hover:bg-indigo/20 px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95"
              title="Shuffle acronyms"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shuffle Acronyms</span>
            </button>
          </div>

          {/* Acronym Grid Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {trendingTerms.map((term) => {
              const catMeta = CATEGORIES.find(c => c.id === term.cat) || CATEGORIES[0];
              return (
                <button
                  key={`trending-${term.code}`}
                  onClick={() => onSelectTerm(term)}
                  className="bg-card hover:bg-indigo-50/40 border border-line hover:border-indigo-300 rounded-xl p-3.5 text-left transition group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-base text-ink group-hover:text-indigo tracking-tight">
                        {term.code}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${catMeta.tag}`}>
                        {catMeta.name.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft line-clamp-2 font-medium leading-snug group-hover:text-ink">
                      {term.full}
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-line/40 flex items-center justify-between text-[10px] font-bold text-indigo opacity-80 group-hover:opacity-100">
                    <span>Decode</span>
                    <span className="group-hover:translate-x-0.5 transition">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Latest Insights (Blog) Section */}
      <section className="section py-8 px-6 max-w-[1080px] mx-auto font-sans">
        <div className="section-head flex items-center justify-between mb-6 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo/10 text-indigo rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-ink">Latest Insights</h2>
              <p className="text-xs text-ink-soft font-medium">In-depth guides, internet culture trends, and expert explanations of modern shorthand</p>
            </div>
          </div>
          
          <button
            onClick={() => onSelectBlogPost(blogs[0])}
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-indigo hover:text-indigo-dark transition cursor-pointer"
          >
            <span>View All Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-8 text-ink-soft text-sm">
            No insights published yet.
          </div>
        ) : (
          <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.slice(0, 3).map((post, idx) => (
              <button
                key={post.id ? `home-blog-${post.id}` : `home-blog-${idx}-${post.title}`}
                onClick={() => onSelectBlogPost(post)}
                className="blog-card bg-card border-1.5 border-line rounded-2xl p-6 text-left transition hover:border-indigo hover:-translate-y-1 shadow-sm flex flex-col justify-between cursor-pointer h-full group"
              >
                <div className="space-y-3">
                  <div className="date flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-indigo" />
                    <span>{post.date}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink line-clamp-2 leading-[1.3] group-hover:text-indigo">
                    {post.title}
                  </h3>
                  <p className="text-xs text-ink-soft line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-line flex items-center justify-between text-xs font-bold text-indigo group-hover:text-indigo-dark">
                  <span>Read Full Article</span>
                  <span className="text-base group-hover:translate-x-1 transition">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. Live Decoder Reel (Placed directly above Popular Categories) */}
      <section className="pt-4 pb-2 px-6 max-w-[1080px] mx-auto">
        <div className="w-full bg-ink text-white rounded-2xl p-4 md:px-6 shadow-md border border-ink-soft/30 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
          
          {/* Live Indicator Header */}
          <div className="flex items-center gap-2.5 shrink-0 border-b md:border-b-0 md:border-r border-white/15 pb-2 md:pb-0 md:pr-6">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-yellow uppercase">
              LIVE DECODER REEL
            </span>
          </div>

          {/* Single Line Animated Active Reel Term */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReelCode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onClick={() => onSelectTerm(activeReelTerm)}
                className="flex flex-wrap md:flex-nowrap items-center gap-3 text-xs cursor-pointer group"
              >
                <span className="font-mono font-black text-lg text-yellow tracking-wider group-hover:underline">
                  {activeReelCode}
                </span>
                <span className="text-white/40 hidden md:inline">•</span>
                <span className="font-display font-bold text-sm text-white truncate max-w-[320px]">
                  {activeReelTerm.full}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${activeCategoryMeta.tag}`}>
                  {activeCategoryMeta.name}
                </span>
                {activeReelTerm.ex && (
                  <span className="text-xs italic text-white/70 truncate hidden lg:inline max-w-[300px]">
                    "{activeReelTerm.ex}"
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Link */}
          <button
            onClick={() => onSelectTerm(activeReelTerm)}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-yellow hover:text-white transition cursor-pointer self-end md:self-center"
          >
            <span>View Term</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 5. Popular Categories Grid (5x3 Grid + View All Categories) */}
      <section className="section py-8 px-6 max-w-[1080px] mx-auto font-sans">
        <div className="section-head flex items-center justify-between mb-6 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo/10 text-indigo rounded-lg">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-ink">Popular Categories</h2>
              <p className="text-xs text-ink-soft font-medium">Browse abbreviations sorted by topic & domain</p>
            </div>
          </div>
          <span className="count font-mono text-xs text-ink-soft font-bold bg-surface px-2.5 py-1 rounded-lg border border-line">
            15 Categories
          </span>
        </div>

        {/* 5x3 Grid */}
        <div className="cat-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mb-8">
          {sortedCategories.map((c) => {
            const count = terms.filter((t) => t.cat === c.id).length;
            return (
              <button
                key={`cat-grid-${c.id}`}
                onClick={() => onSelectCategory(c.id)}
                className="cat-chip group bg-card border-1.5 border-line rounded-xl p-4 text-left transition hover:border-indigo hover:shadow-sm hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-24"
              >
                <div>
                  <div className="n font-display font-bold text-xs text-ink group-hover:text-indigo line-clamp-1">
                    {c.name}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-line/40">
                  <span className="c font-mono text-[11px] text-ink-soft font-semibold">
                    {count} terms
                  </span>
                  <span className="text-xs text-indigo opacity-0 group-hover:opacity-100 transition">→</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* View All Categories Button */}
        <div className="flex justify-center">
          <button
            onClick={() => onSelectCategory("all")}
            className="btn btn-outline font-display font-bold text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-indigo hover:text-white hover:border-indigo transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Grid className="w-4 h-4" />
            <span>View All Categories</span>
          </button>
        </div>
      </section>

      {/* Abbreviation of the Day Banner */}
      <section className="py-2 px-6 max-w-[1080px] mx-auto">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          {dailyTerm ? (
            <div className="space-y-2 flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200/50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  💡 Abbreviation of the Day
                </span>
                <span className="inline-block text-[9.5px] font-bold text-blue-700 bg-blue-100/60 border border-blue-200/40 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  {CATEGORIES.find(c => c.id === dailyTerm.cat)?.name || dailyTerm.cat}
                </span>
              </div>
              <h3 className="font-mono font-black text-2xl text-indigo-950 flex items-center justify-center md:justify-start gap-2">
                {dailyTerm.code}
              </h3>
              <p className="text-sm font-display text-indigo-900 leading-relaxed font-semibold">
                {dailyTerm.full}
              </p>
              {dailyTerm.ex && (
                <p className="text-xs text-ink-soft/90 italic leading-relaxed max-w-2xl bg-white/50 p-2.5 rounded-lg border border-indigo-100/40">
                  Example: "{dailyTerm.ex}"
                </p>
              )}
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            {dailyTerm && (
              <button
                onClick={() => onSelectTerm(dailyTerm)}
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-display font-bold text-xs hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95 duration-100"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleShuffleDailyTerm}
              className="px-4 py-3 rounded-xl bg-white text-indigo-950 border border-indigo-200 font-display font-bold text-xs hover:bg-indigo-50 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 duration-100"
            >
              <span>Show Another</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

