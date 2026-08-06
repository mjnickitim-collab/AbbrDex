import React from "react";
import { Category, Term } from "../types";
import { CATEGORIES } from "../data/seedData";
import { CATEGORY_SEO_DATA, DEFAULT_CATEGORY_SEO } from "../data/categorySeoData";
import { BookOpen, Layers, Link as LinkIcon, Sparkles, Hash, ArrowRight, Tag } from "lucide-react";

interface CategorySeoBlockProps {
  selectedCategory: string | null;
  terms: Term[];
  onSelectCategory: (catId: string | null) => void;
  onSelectTerm: (term: Term) => void;
}

export default function CategorySeoBlock({
  selectedCategory,
  terms,
  onSelectCategory,
  onSelectTerm
}: CategorySeoBlockProps) {
  const catMeta = selectedCategory
    ? CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const seoData = selectedCategory && CATEGORY_SEO_DATA[selectedCategory]
    ? CATEGORY_SEO_DATA[selectedCategory]
    : DEFAULT_CATEGORY_SEO;

  const catName = catMeta ? catMeta.name : "All Categories";

  // Filter terms in this category
  const categoryTerms = selectedCategory
    ? terms.filter((t) => t.cat === selectedCategory)
    : terms;

  // Find representative terms based on representative codes or fall back to first few
  const representativeTerms: Term[] = [];
  seoData.representativeCodes.forEach((code) => {
    const found = categoryTerms.find((t) => t.code.toUpperCase() === code.toUpperCase());
    if (found) {
      representativeTerms.push(found);
    }
  });

  // If fewer than 4 matched, pad with remaining top terms from this category
  if (representativeTerms.length < 4) {
    categoryTerms.forEach((t) => {
      if (representativeTerms.length < 6 && !representativeTerms.some((rt) => rt.code === t.code)) {
        representativeTerms.push(t);
      }
    });
  }

  // Related categories metadata
  const relatedCategoryMetas = seoData.relatedCategories
    .map((catId) => CATEGORIES.find((c) => c.id === catId))
    .filter((c): c is Category => Boolean(c));

  return (
    <div className="bg-card border-1.5 border-indigo/20 rounded-2xl p-6 sm:p-8 mb-8 space-y-6 shadow-sm relative overflow-hidden">
      {/* Decorative accent background badge */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo/5 rounded-full blur-2xl pointer-events-none" />

      {/* 1) Category Header & Intro Paragraph */}
      <div className="space-y-2 border-b border-line pb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo/10 text-indigo text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{catMeta ? `${catMeta.name} Category` : "Category Overview"}</span>
          </span>
          {catMeta && (
            <span className={`tag ${catMeta.tag} text-[10px] uppercase tracking-wider font-semibold`}>
              {catMeta.name}
            </span>
          )}
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink leading-tight">
          {seoData.seoTitle}
        </h1>

        <p className="text-sm sm:text-base text-ink-soft leading-relaxed pt-1">
          {seoData.intro}
        </p>
      </div>

      {/* 2) Category Structured Context & Breakdown */}
      <div className="bg-card border border-line/80 rounded-xl p-4 sm:p-5 space-y-2 text-xs sm:text-sm text-ink-soft">
        <div className="flex items-center gap-2 font-display font-bold text-ink text-sm sm:text-base mb-1">
          <Layers className="w-4 h-4 text-indigo" />
          <span>Category Structure & Overview</span>
        </div>

        <p className="leading-relaxed text-ink">
          <strong className="text-indigo font-semibold">Terms Included: </strong>
          This category hub contains <strong className="text-ink font-bold">{categoryTerms.length}</strong> verified {catName} abbreviations and technical terms.
        </p>

        <p className="leading-relaxed">
          <strong className="text-ink font-semibold">Structural Classification: </strong>
          {seoData.structureText}
        </p>

        <p className="leading-relaxed">
          <strong className="text-ink font-semibold">Scope & Context: </strong>
          {seoData.scopeText}
        </p>
      </div>

      {/* 3) Category Internal Links Section */}
      <div className="bg-paper/80 border border-line rounded-xl p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-indigo" />
          <span>Quick Navigation & Related Links:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Link to View All */}
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo text-white font-semibold hover:bg-indigo-dark transition cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Full Dictionary ({terms.length} terms)</span>
          </button>

          {/* Related Category Pills */}
          {relatedCategoryMetas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-ink-soft font-semibold text-[11px] ml-1">Related Categories:</span>
              {relatedCategoryMetas.map((rc) => (
                <button
                  key={`rel-${rc.id}`}
                  type="button"
                  onClick={() => onSelectCategory(rc.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-line text-ink hover:border-indigo hover:text-indigo transition font-medium text-[11px] cursor-pointer"
                >
                  <Tag className="w-3 h-3 text-ink-soft" />
                  <span>{rc.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Explore similar slang link */}
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(seoData.relatedCategories[0] || null)}
              className="inline-flex items-center gap-1 text-indigo font-semibold hover:underline text-xs ml-auto cursor-pointer"
            >
              <span>Explore Similar Slang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4) Representative Terms Section */}
      {representativeTerms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo" />
              <span>Key Featured {catName} Terms</span>
            </h3>
            <span className="text-xs text-ink-soft font-mono">
              {representativeTerms.length} Key Terms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {representativeTerms.map((term, idx) => (
              <button
                key={`rep-${term.id || idx}`}
                type="button"
                onClick={() => onSelectTerm(term)}
                className="group bg-paper border border-line rounded-xl p-3.5 text-left hover:border-indigo transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-indigo group-hover:underline">
                      {term.code}
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft bg-card border border-line rounded px-1.5 py-0.5">
                      Featured
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-ink line-clamp-1">
                    {term.full}
                  </div>
                </div>
                {term.ex && (
                  <p className="text-[11px] text-ink-soft italic line-clamp-1 mt-1.5">
                    "{term.ex}"
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
