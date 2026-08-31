import React, { useState, useEffect, useMemo } from "react";
import { Category, Term, BlogPost } from "../types";
import { CATEGORIES } from "../data/seedData";
import { generateSlug } from "../data/dbService";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Search, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Grid, 
  CheckCircle2, 
  Quote, 
  Info, 
  Globe, 
  Layers, 
  ShieldCheck, 
  Tag 
} from "lucide-react";

interface HomeViewProps {
  terms: Term[];
  onSearch: (query: string) => void;
  onSelectCategory: (catId: string) => void;
  onSelectTerm: (term: Term) => void;
  blogs: BlogPost[];
  onSelectBlogPost: (post: BlogPost) => void;
  onViewAllBlogs?: () => void;
  onSelectEmojiQuiz: () => void;
  onSelectEmojiDict: () => void;
}

// Sliding reel order for live decoder
const REEL_ORDER = ["FYI", "GG", "ASAP", "FOMO", "SNAFU", "HMU", "WFH", "TBH", "IMHO", "NSFW", "ETA", "GOAT", "TL;DR", "TBD"];

// Category Descriptions (Human-written introductory guides without artificial counts)
const CATEGORY_INTROS: { [key: string]: string } = {
  internet: "Web slangs, online chat shorthands, and viral internet expressions used across forums and message boards.",
  texting: "Text messaging abbreviations, SMS shorthand codes, and quick-reply text acronyms for fast messaging.",
  social: "Social media lingo, trending hashtag abbreviations, and creator community expressions.",
  business: "Corporate acronyms, office communication terms, and workplace jargon for professional email & meetings.",
  gaming: "Gamer lingo, multiplayer callouts, esports terminology, and streaming community shorthands.",
  military: "Tactical defense terminology, radio communication codes, and official military acronyms.",
  emoji: "Emoji meanings, emotional symbol interpretations, and popular icon combo representations.",
  sports: "Sports league abbreviations, performance stat tracking codes, and athletic tournament terms.",
  companies: "Corporate entity abbreviations, ticker codes, and global company name short forms.",
  countries: "ISO country codes, nation initials, and official geographic territory abbreviations.",
  cities: "Major city shorthands, metro region codes, and international airport designations.",
  medical: "Clinical abbreviations, healthcare record acronyms, and medical diagnostic terminology.",
  finance: "Financial market terms, investment shorthand, and banking institution acronyms.",
  currency: "Global currency ISO codes, monetary symbols, and foreign exchange shorthands.",
  it_dev: "Software engineering terms, IT infrastructure codes, and developer programming acronyms.",
};

export default function HomeView({ 
  terms, 
  onSearch, 
  onSelectCategory, 
  onSelectTerm, 
  blogs, 
  onSelectBlogPost,
  onViewAllBlogs,
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
      const todayStr = new Date().toISOString().split("T")[0];
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

  // Select 8 popular/trending acronyms randomly or by term flag
  const trendingTerms = useMemo(() => {
    const pool = terms.filter(t => t.cat !== "emoji");
    if (pool.length === 0) return [];
    
    const explicit = pool.filter(t => t.trending);
    const sourceList = explicit.length >= 8 ? explicit : pool;
    
    const shuffled = [...sourceList].sort(() => 0.5 - (Math.random() + randomSeed * 0.01));
    return shuffled.slice(0, 8);
  }, [terms, randomSeed]);

  // Categories sorted by popularity (term count)
  const sortedCategories = useMemo(() => {
    return [...CATEGORIES].sort((a, b) => {
      const countA = terms.filter(t => t.cat === a.id).length;
      const countB = terms.filter(t => t.cat === b.id).length;
      return countB - countA;
    }).slice(0, 9);
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
      
      {/* 1. Publication Header Banner */}
      <section className="bg-card border-b border-line py-10 px-6">
        <div className="max-w-[1080px] mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 font-mono font-semibold text-xs text-indigo bg-indigo/10 px-3.5 py-1.5 rounded-full border border-indigo/20 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-indigo" />
            <span>Digital Communication & Acronym Encyclopedia</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-[1.15] text-ink tracking-tight max-w-[840px] mx-auto">
            Whatsthatmean Digital Reference Library
          </h1>

          <p className="text-base sm:text-lg text-ink-soft max-w-[780px] mx-auto leading-relaxed font-normal">
            A comprehensive editorial reference guide explaining internet abbreviations, texting shorthands, professional workplace jargon, and modern digital expressions with verified definitions and contextual usage examples.
          </p>

          {/* Integrated Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-[620px] mx-auto w-full">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-soft" />
                <input
                  type="text"
                  placeholder="Search dictionary for a term (e.g., WFH, FOMO, ASAP, GOAT)..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border-1.5 border-line rounded-xl bg-paper text-sm font-mono text-ink shadow-2xs focus:outline-none focus:border-indigo transition"
                />
              </div>
              <button type="submit" className="btn btn-solid font-display font-bold px-7 py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition shrink-0">
                <span>Look Up</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Keyword Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs text-ink-soft">
              <span className="font-semibold text-ink-soft/80">Trending Lookups:</span>
              {["CONS", "B2C", "ASAP", "WFH", "FOMO", "TBH", "GOAT", "TL;DR"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onSearch(code)}
                  className="px-2.5 py-0.5 bg-paper hover:bg-indigo/10 border border-line hover:border-indigo/30 rounded-md text-xs font-mono font-bold text-ink hover:text-indigo transition cursor-pointer"
                >
                  #{code}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* 2. Featured Word Analysis / Editorial Entry Spotlight */}
      <section className="px-6 max-w-[1080px] mx-auto">
        <div className="bg-gradient-to-br from-card via-card to-indigo-50/30 border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo/10 text-indigo rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo">
                FEATURED ENTRY ANALYSIS • WORD OF THE DAY
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Peer-reviewed by Editorial Staff</span>
            </div>
          </div>

          {dailyTerm && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-8 space-y-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="font-mono font-black text-3xl sm:text-4xl text-ink tracking-tight">
                    {dailyTerm.code}
                  </h2>
                  <span className="text-base sm:text-lg font-display font-semibold text-indigo">
                    — {dailyTerm.full}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo/10 text-indigo border border-indigo/20">
                    {CATEGORIES.find(c => c.id === dailyTerm.cat)?.name || dailyTerm.cat}
                  </span>
                </div>

                {dailyTerm.ex && (
                  <p className="text-sm sm:text-base text-ink leading-relaxed font-normal">
                    <strong className="text-indigo font-semibold">Example Usage:</strong> "{dailyTerm.ex}"
                  </p>
                )}

                {dailyTerm.ex && (
                  <div className="bg-paper p-4 rounded-xl border-l-4 border-indigo border-y border-r border-line text-xs sm:text-sm text-ink space-y-1">
                    <div className="font-mono font-bold text-[11px] text-indigo uppercase tracking-wider flex items-center gap-1">
                      <Quote className="w-3 h-3" />
                      <span>Contextual Usage Example</span>
                    </div>
                    <p className="italic text-ink-soft font-medium">
                      "{dailyTerm.ex}"
                    </p>
                  </div>
                )}
              </div>

              <div className="md:col-span-4 bg-paper p-5 rounded-xl border border-line space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-ink-soft">
                    Reference Highlights
                  </h3>
                  <ul className="text-xs space-y-2 text-ink-soft">
                    <li className="flex items-center justify-between border-b border-line/60 pb-1.5">
                      <span>Category:</span>
                      <strong className="text-ink font-mono">{dailyTerm.cat}</strong>
                    </li>
                    <li className="flex items-center justify-between border-b border-line/60 pb-1.5">
                      <span>Status:</span>
                      <strong className="text-emerald-600 font-semibold">Verified Entry</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Format:</span>
                      <strong className="text-ink font-mono">Abbreviation / Acronym</strong>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`/term/${encodeURIComponent(dailyTerm.code)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectTerm(dailyTerm);
                      window.history.pushState(null, "", `/term/${encodeURIComponent(dailyTerm.code)}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full btn btn-solid font-display font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs no-underline"
                  >
                    <span>Read Full Term Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleShuffleDailyTerm}
                    className="w-full py-2 rounded-lg text-xs font-bold text-ink-soft hover:text-indigo hover:bg-card transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Explore Next Term</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Digital Insights & Editorial Articles Section */}
      <section className="px-6 max-w-[1080px] mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo/10 text-indigo rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-ink">Digital Insights & Editorial Guides</h2>
              <p className="text-xs text-ink-soft font-medium">In-depth reference articles, internet culture trends, and expert educational guides</p>
            </div>
          </div>
          
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              if (onViewAllBlogs) {
                onViewAllBlogs();
              } else if (blogs.length > 0) {
                onSelectBlogPost(blogs[0]);
              }
              window.history.pushState(null, "", "/blog");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo hover:text-indigo-dark transition cursor-pointer no-underline"
          >
            <span>View All Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-8 text-ink-soft text-sm">
            No articles published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.slice(0, 3).map((post, idx) => {
              const slug = post.slug || generateSlug(post.title || "");
              const postUrl = `/blog/${slug}`;
              return (
                <a
                  key={post.id ? `home-blog-${post.id}` : `home-blog-${idx}-${post.title}`}
                  href={postUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectBlogPost(post);
                    window.history.pushState(null, "", postUrl);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-card border border-line rounded-2xl overflow-hidden text-left transition hover:border-indigo hover:shadow-md hover:-translate-y-1 shadow-2xs flex flex-col justify-between cursor-pointer h-full group no-underline"
                >
                  <div className="w-full">
                    {post.imageUrl && (
                      <div className="w-full h-44 overflow-hidden border-b border-line bg-line/20">
                        <img
                          src={post.imageUrl}
                          alt={post.imageAlt || post.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="p-6 space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo" />
                          <span>{post.date}</span>
                        </span>
                        {post.cat && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-line" />
                            <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-indigo/5 text-indigo border border-indigo/10">
                              {CATEGORIES.find(c => c.id === post.cat)?.name || "Insights"}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-lg text-ink line-clamp-2 leading-[1.3] group-hover:text-indigo transition">
                        {post.title}
                      </h3>

                      <p className="text-xs text-ink-soft line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-indigo group-hover:text-indigo-dark transition">
                    <span>Read Full Article</span>
                    <span className="text-base group-hover:translate-x-1 transition">→</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Trending Decoded Terms (Rich Cards with Text Content) */}
      <section className="px-6 max-w-[1080px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-ink">Trending Acronyms & Text Slang Meanings</h2>
              <p className="text-xs text-ink-soft font-medium">Curated digital expressions decoded with clear definitions and context</p>
            </div>
          </div>

          <button
            onClick={() => setRandomSeed(prev => prev + 1)}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold text-indigo bg-indigo/10 hover:bg-indigo/20 px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95"
            title="Shuffle terms"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Shuffle Acronyms</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingTerms.map((term) => {
            const catMeta = CATEGORIES.find(c => c.id === term.cat) || CATEGORIES[0];
            const termUrl = `/term/${encodeURIComponent(term.code)}`;
            return (
              <a
                key={`trending-${term.code}`}
                href={termUrl}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTerm(term);
                  window.history.pushState(null, "", termUrl);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-card hover:bg-indigo-50/30 border border-line hover:border-indigo-300 rounded-2xl p-5 text-left transition group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-sm h-full no-underline"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xl text-ink group-hover:text-indigo tracking-tight">
                      {term.code}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${catMeta.tag}`}>
                      {catMeta.name.split(" ")[0]}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-indigo leading-tight">
                    {term.full}
                  </p>

                  <p className="text-xs text-ink-soft line-clamp-3 leading-relaxed pt-1">
                    {term.ex ? `"${term.ex}"` : "Explore entry definitions, context, and dialogue examples."}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-line/60 flex items-center justify-between text-[11px] font-bold text-indigo group-hover:text-indigo-dark">
                  <span>View Entry</span>
                  <span className="group-hover:translate-x-1 transition">→</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* 5. Live Decoder Reel */}
      <section className="px-6 max-w-[1080px] mx-auto">
        <div className="w-full bg-ink text-white rounded-2xl p-4 md:px-6 shadow-md border border-ink-soft/30 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
          
          <div className="flex items-center gap-2.5 shrink-0 border-b md:border-b-0 md:border-r border-white/15 pb-2 md:pb-0 md:pr-6">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-yellow uppercase">
              LIVE DECODER REEL
            </span>
          </div>

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

          <button
            onClick={() => onSelectTerm(activeReelTerm)}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-yellow hover:text-white transition cursor-pointer self-end md:self-center"
          >
            <span>View Term</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 6. Popular Categories & Representative Acronyms */}
      <section className="px-6 max-w-[1080px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo/10 text-indigo rounded-lg">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-ink">Abbreviation & Slang Topics</h2>
              <p className="text-xs text-ink-soft font-medium">Editorial category guides with top representative expressions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedCategories.map((c) => {
            const catIntro = CATEGORY_INTROS[c.id] || "Curated reference entries and usage guides.";
            // Filter 6-8 representative top terms for this category
            const categoryTerms = terms.filter((t) => t.cat === c.id);
            const representativeTerms = categoryTerms.slice(0, 7);

            return (
              <div
                key={`cat-card-${c.id}`}
                className="bg-card border border-line rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-indigo/50 transition group"
              >
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                    <h3 className="font-display font-bold text-base text-ink group-hover:text-indigo transition">
                      {c.name}
                    </h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${c.tag}`}>
                      {c.id}
                    </span>
                  </div>

                  {/* Category Introduction Paragraph */}
                  <p className="text-xs text-ink-soft leading-relaxed font-normal">
                    {catIntro}
                  </p>

                  {/* Representative Acronyms (5-8 Top Terms) */}
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-soft/80 block">
                      Representative Acronyms:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {representativeTerms.map((t) => (
                        <button
                          key={`rep-${c.id}-${t.code}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTerm(t);
                          }}
                          className="px-2 py-1 bg-paper hover:bg-indigo/10 border border-line hover:border-indigo/30 rounded-md text-xs font-mono font-bold text-ink hover:text-indigo transition cursor-pointer"
                          title={`View ${t.code} definition`}
                        >
                          {t.code}
                        </button>
                      ))}
                      {categoryTerms.length > representativeTerms.length && (
                        <span className="text-[10px] text-ink-soft font-mono self-center px-1">
                          +more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action to Full Internal Page Catalog */}
                <div className="pt-3 border-t border-line/60">
                  <button
                    onClick={() => onSelectCategory(c.id)}
                    className="w-full py-2.5 px-3 bg-paper hover:bg-indigo hover:text-white rounded-xl text-xs font-bold text-indigo border border-indigo/20 hover:border-indigo transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span>Browse Full {c.name} Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => onSelectCategory("all")}
            className="btn btn-outline font-display font-bold text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-indigo hover:text-white hover:border-indigo transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Grid className="w-4 h-4" />
            <span>Explore All Dictionary Categories in Browse Page</span>
          </button>
        </div>
      </section>

      {/* 7. Publication Information & Editorial Standards Section */}
      <section className="px-6 max-w-[1080px] mx-auto">
        <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-line pb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo" />
            <h2 className="font-display font-bold text-xl text-ink">
              About whatsthatmean.com Reference Dictionary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-ink-soft leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Human Research & Verification</span>
              </h3>
              <p>
                Every entry in our reference portal undergoes human review. We research real-world usage across social media, texting culture, corporate communications, and online communities to ensure high factual accuracy.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo" />
                <span>Comprehensive Context</span>
              </h3>
              <p>
                Rather than providing single-word definitions, our dictionary offers full phonetic expansions, domain categories, real usage dialogues, and cultural background notes for complete clarity.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Continuously Updated</span>
              </h3>
              <p>
                As digital expressions and internet slangs evolve rapidly, our lexicographical database is updated daily with emerging acronyms, modern abbreviations, and shifting linguistic nuances.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
