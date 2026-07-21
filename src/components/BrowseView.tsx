import React, { useState, useEffect } from "react";
import { Category, Term } from "../types";
import { CATEGORIES } from "../data/seedData";
import { Search, X, BookOpen, AlertCircle } from "lucide-react";

interface BrowseViewProps {
  terms: Term[];
  initialCategory: string | null;
  initialQuery?: string;
  onSelectTerm: (term: Term) => void;
}

export default function BrowseView({ terms, initialCategory, initialQuery = "", onSelectTerm }: BrowseViewProps) {
  const [selectedCat, setSelectedCat] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync initial state updates
  useEffect(() => {
    setSelectedCat(initialCategory);
    setCurrentPage(1);
  }, [initialCategory]);

  useEffect(() => {
    setSearchQuery(initialQuery);
    setCurrentPage(1);
  }, [initialQuery]);

  // Reset page when category or search query changes internally
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCat, searchQuery]);

  // Filtering Logic
  const filteredTerms = terms.filter((t) => {
    const matchesCategory = !selectedCat || t.cat === selectedCat;
    
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.code.toLowerCase().includes(query) ||
      t.full.toLowerCase().includes(query) ||
      t.ex.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleCategoryToggle = (catId: string) => {
    setSelectedCat(selectedCat === catId ? null : catId);
  };

  // Pagination Logic
  const ITEMS_PER_PAGE = 30;
  const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
  const paginatedTerms = filteredTerms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const range = 2; // how many pages around current to show
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const handlePageChange = (pNum: number) => {
    setCurrentPage(pNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-12">
      {/* Title & Filter Options */}
      <div className="space-y-6 mb-8">
        <div>
          <h2 className="font-display font-bold text-3xl text-ink">Explore Abbreviations</h2>
          <p className="text-sm text-ink-soft mt-1">Search through texting acronyms, internet shorthand, and business workspace terms.</p>
        </div>

        {/* Search Row */}
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-soft" />
          <input
            type="text"
            placeholder="Search all terms (e.g., POV, ROI, WFH...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 border-1.5 border-line rounded-xl bg-card text-sm font-mono text-ink shadow-sm focus:outline-none focus:border-indigo"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters Grid */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Filter by Category:</div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setSelectedCat(null)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold border-1.5 transition cursor-pointer
                ${!selectedCat 
                  ? "bg-indigo text-white border-indigo" 
                  : "bg-card text-ink border-line hover:border-ink"
                }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              const termCount = terms.filter((t) => t.cat === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold border-1.5 transition cursor-pointer flex items-center gap-1.5
                    ${isActive 
                      ? "bg-indigo text-white border-indigo" 
                      : "bg-card text-ink border-line hover:border-ink"
                    }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.2 font-mono ${isActive ? "bg-white/20 text-white" : "bg-paper text-ink-soft"}`}>
                    {termCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="border-t border-line pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-ink flex items-center gap-1.5">
            <BookOpen className="w-5 h-5 text-indigo" />
            <span>Results</span>
          </h3>
          <span className="text-xs font-medium text-ink-soft">
            {filteredTerms.length} {filteredTerms.length === 1 ? "term" : "terms"} found
          </span>
        </div>

        {filteredTerms.length === 0 ? (
          <div className="text-center py-16 bg-card border border-line border-dashed rounded-xl p-8 max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-coral mx-auto mb-3" />
            <div className="font-display font-bold text-lg text-ink">No terms match your search</div>
            <p className="text-xs text-ink-soft mt-1 mb-4">Try checking your spelling, changing your category filter, or exploring trending words.</p>
            <button 
              onClick={() => { setSelectedCat(null); setSearchQuery(""); }}
              className="btn btn-sm btn-ghost font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="word-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedTerms.map((t, idx) => {
                const catMeta = CATEGORIES.find((c) => c.id === t.cat) || CATEGORIES[0];
                return (
                  <button
                    key={t.id ? `term-${t.id}` : `term-${t.code}-${idx}`}
                    onClick={() => onSelectTerm(t)}
                    className="word-card group bg-card border-1.5 border-line rounded-xl p-5 text-left transition hover:border-ink cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="top flex items-center justify-between gap-2 border-b border-line pb-2 mb-3">
                        <span className={`code font-bold text-ink group-hover:text-indigo ${t.cat === "emoji" ? "text-2xl select-none" : "mono font-mono text-lg"}`}>
                          {t.code}
                        </span>
                        <span className={`tag ${catMeta.tag} text-[9.5px]`}>
                          {catMeta.name}
                        </span>
                      </div>
                      <div className="meaning font-display font-semibold text-sm text-ink mb-2">
                        {t.full}
                      </div>
                    </div>
                    {t.ex && (
                      <p className="text-xs text-ink-soft italic line-clamp-2 mt-2">
                        "{t.ex}"
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-line/60">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  className="px-3.5 py-2 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-line/20 disabled:opacity-40 transition cursor-pointer"
                >
                  Previous
                </button>
                {getPageNumbers().map((pNum, index) => {
                  if (pNum === "...") {
                    return (
                      <span key={`dots-${index}`} className="px-2 text-xs text-ink-soft font-semibold select-none">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={`page-${pNum}-${index}`}
                      type="button"
                      onClick={() => handlePageChange(Number(pNum))}
                      className={`w-9 h-9 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center
                        ${currentPage === pNum 
                          ? "bg-indigo text-white border border-indigo shadow-sm" 
                          : "border border-line text-ink hover:bg-line/20"
                        }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  className="px-3.5 py-2 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-line/20 disabled:opacity-40 transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
