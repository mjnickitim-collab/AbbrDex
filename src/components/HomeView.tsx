import React, { useState, useEffect } from "react";
import { Category, Term, BlogPost } from "../types";
import { CATEGORIES } from "../data/seedData";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Search, BookOpen, Calendar } from "lucide-react";

interface HomeViewProps {
  terms: Term[];
  onSearch: (query: string) => void;
  onSelectCategory: (catId: string) => void;
  onSelectTerm: (term: Term) => void;
  blogs: BlogPost[];
  onSelectBlogPost: (post: BlogPost) => void;
}

// Sliding reel order
const REEL_ORDER = ["FYI", "GG", "ASAP", "FOMO", "SNAFU", "HMU", "WFH", "TBH"];

export default function HomeView({ terms, onSearch, onSelectCategory, onSelectTerm, blogs, onSelectBlogPost }: HomeViewProps) {
  const [searchVal, setSearchVal] = useState("");
  const [reelIdx, setReelIdx] = useState(0);

  // Interval for sliding reel
  useEffect(() => {
    const timer = setInterval(() => {
      setReelIdx((prev) => (prev + 1) % REEL_ORDER.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

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
    onSearch(searchVal);
  };

  // Filter trending terms (trending field is true, or we pick a subset of iconic ones)
  const trendingTerms = terms.filter((t) => t.trending).slice(0, 8);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="hero py-16 px-6 max-w-[1080px] mx-auto text-center md:text-left">
        <div className="hero-inner flex flex-col md:flex-row md:items-center justify-between gap-12">
          {/* Hero Left Content */}
          <div className="flex-1 space-y-6">
            <span className="eyebrow inline-block font-sans font-semibold tracking-wide text-xs text-indigo bg-indigo/10 px-3.5 py-1.5 rounded-full">
              {terms.length}+ abbreviations & acronyms
            </span>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.1] text-ink tracking-tight max-w-[620px]">
              Decode the world's abbreviations, one shorthand at a time.
            </h1>
            <p className="sub text-base md:text-lg text-ink-soft max-w-[500px] leading-relaxed">
              From everyday texting acronyms to professional workplace shorthand — explained clearly, tested playfully.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="search-row flex gap-3 max-w-[500px]">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-soft" />
                <input
                  type="text"
                  placeholder="Search for a term, e.g. ASAP, WFH, FOMO..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border-1.5 border-line rounded-xl bg-card text-sm font-mono text-ink shadow-sm focus:outline-none focus:border-indigo"
                />
              </div>
              <button type="submit" className="btn btn-solid font-display font-semibold flex items-center gap-1">
                Search
              </button>
            </form>
          </div>

          {/* Hero Right - Animated Sliding Decoder Reel */}
          <div className="flex-1 w-full max-w-[420px] mx-auto bg-ink text-white p-8 rounded-2xl shadow-xl flex flex-col justify-center min-h-[220px] relative overflow-hidden border border-ink-soft/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReelCode}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow font-mono font-bold text-3xl tracking-wider">
                    {activeReelCode}
                  </span>
                  <span className={`tag ${activeCategoryMeta.tag} text-[10px]`}>
                    {activeCategoryMeta.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-ink-soft font-bold">Meaning:</div>
                  <div className="text-lg font-bold font-display text-white">
                    {activeReelTerm.full}
                  </div>
                </div>
                {activeReelTerm.ex && (
                  <div className="pt-2">
                    <div className="text-[10px] uppercase tracking-wider text-ink-soft font-bold mb-0.5">Example:</div>
                    <p className="text-xs italic text-white/80">
                      "{activeReelTerm.ex}"
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 text-[10px] font-mono text-indigo bg-indigo/10 px-2 py-0.5 rounded border border-indigo/20">
              <span className="w-1.5 h-1.5 bg-indigo rounded-full animate-ping" />
              <span>LIVE DECODER REEL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="section py-12 px-6 max-w-[1080px] mx-auto border-t border-line">
        <div className="section-head flex items-baseline justify-between mb-8">
          <h2 className="font-display font-bold text-2xl text-ink">Browse by category</h2>
          <span className="count font-sans text-xs text-ink-soft font-medium">
            {CATEGORIES.length} categories
          </span>
        </div>

        <div className="cat-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((c) => {
            const count = terms.filter((t) => t.cat === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCategory(c.id)}
                className="cat-chip group bg-card border-1.5 border-line rounded-xl p-5 text-left transition hover:border-ink hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="n font-display font-bold text-sm text-ink group-hover:text-indigo">
                  {c.name}
                </div>
                <div className="c font-sans text-xs text-ink-soft mt-1.5">
                  {count} terms
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Latest from the Blog Section */}
      <section className="section py-12 px-6 max-w-[1080px] mx-auto border-t border-line font-sans">
        <div className="section-head flex items-baseline gap-2 mb-8">
          <BookOpen className="w-5 h-5 text-indigo" />
          <h2 className="font-display font-bold text-2xl text-ink">Latest from the Blog</h2>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-8 text-ink-soft text-sm">
            No articles have been published yet.
          </div>
        ) : (
          <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.slice(0, 3).map((post) => (
              <button
                key={post.id || post.title}
                onClick={() => onSelectBlogPost(post)}
                className="blog-card bg-card border-1.5 border-line rounded-2xl p-6 text-left transition hover:border-indigo hover:-translate-y-1 shadow-sm flex flex-col justify-between cursor-pointer h-full group"
              >
                <div className="space-y-3">
                  <div className="date flex items-center gap-1 text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    <span>{post.date}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink line-clamp-2 leading-[1.3] group-hover:text-indigo">
                    {post.title}
                  </h3>
                  <p className="text-xs text-ink-soft line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-line flex items-center justify-between text-xs font-bold text-indigo group-hover:text-indigo-dark">
                  <span>Read Full Article</span>
                  <span className="text-base">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
