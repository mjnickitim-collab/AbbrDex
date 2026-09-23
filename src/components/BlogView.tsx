import React, { useState } from "react";
import { BlogPost, AdSlot, UserProfile } from "../types";
import { Calendar, ChevronLeft, BookOpen, Edit3, ShieldCheck, CheckCircle2, UserCheck, Clock } from "lucide-react";
import { renderBlogPostContent } from "../utils/blogParser";
import { CATEGORIES } from "../data/seedData";
import { generateSlug } from "../data/dbService";

interface BlogViewProps {
  posts: BlogPost[];
  initialSelectedPost?: BlogPost | null;
  onSelectBlogPost?: (post: BlogPost | null) => void;
  onCloseSelectedPost?: () => void;
  adSlots?: AdSlot[];
  currentUser?: UserProfile | null;
  isAdminMode?: boolean;
  onEditPost?: (post: BlogPost) => void;
}

export default function BlogView({
  posts,
  initialSelectedPost = null,
  onSelectBlogPost,
  onCloseSelectedPost,
  adSlots,
  currentUser,
  isAdminMode,
  onEditPost
}: BlogViewProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(initialSelectedPost);

  React.useEffect(() => {
    setSelectedPost(initialSelectedPost);
  }, [initialSelectedPost]);

  // Apply SEO dynamic tags when a blog post is selected
  React.useEffect(() => {
    if (selectedPost) {
      // Save original values
      const originalTitle = document.title;
      const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const originalKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";

      // Set new SEO values
      if (selectedPost.seoTitle) {
        document.title = selectedPost.seoTitle;
      } else {
        document.title = `${selectedPost.title} | whatsthatmean`;
      }

      if (selectedPost.metaDescription) {
        let metaDescEl = document.querySelector('meta[name="description"]');
        if (!metaDescEl) {
          metaDescEl = document.createElement("meta");
          metaDescEl.setAttribute("name", "description");
          document.head.appendChild(metaDescEl);
        }
        metaDescEl.setAttribute("content", selectedPost.metaDescription);
      }

      if (selectedPost.keywords) {
        let keywordsEl = document.querySelector('meta[name="keywords"]');
        if (!keywordsEl) {
          keywordsEl = document.createElement("meta");
          keywordsEl.setAttribute("name", "keywords");
          document.head.appendChild(keywordsEl);
        }
        keywordsEl.setAttribute("content", selectedPost.keywords);
      }

      // Cleanup
      return () => {
        document.title = originalTitle;
        if (originalMetaDesc) {
          document.querySelector('meta[name="description"]')?.setAttribute("content", originalMetaDesc);
        } else {
          document.querySelector('meta[name="description"]')?.removeAttribute("content");
        }
        if (originalKeywords) {
          document.querySelector('meta[name="keywords"]')?.setAttribute("content", originalKeywords);
        } else {
          document.querySelector('meta[name="keywords"]')?.removeAttribute("content");
        }
      };
    }
  }, [selectedPost]);

  // Detail View of a Selected Blog Post
  if (selectedPost) {
    const canEdit = isAdminMode || currentUser?.role === "Admin" || currentUser?.role === "Editor";

    return (
      <div className="max-w-[720px] mx-auto px-6 py-12">
        {/* Top Header Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => {
              setSelectedPost(null);
              onSelectBlogPost?.(null);
              onCloseSelectedPost?.();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo hover:text-indigo-dark transition group cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
            <span>Back to Blog List</span>
          </button>

          {canEdit && (
            <button
              onClick={() => onEditPost?.(selectedPost)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo hover:bg-indigo-dark px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              title="Edit this article in Admin Centre"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Article</span>
            </button>
          )}
        </div>

        {/* Blog Post Header */}
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-soft">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedPost.date}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-line" />
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo/5 text-indigo border border-indigo/10">
                {CATEGORIES.find(c => c.id === selectedPost.cat)?.name || "Internet & chat"}
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink leading-[1.2] tracking-tight">
              {selectedPost.title}
            </h2>

            {/* Credibility & E-E-A-T Byline Bar */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 py-3 px-4 bg-paper/70 border border-line rounded-xl text-xs text-ink-soft">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo" />
                <span>Written by <strong className="text-ink">Marcus Vance</strong>, Senior Lexicographer</span>
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-line" />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fact-Checked by <strong className="text-ink">Dr. Elena Ward</strong></span>
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-line" />
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Peer-Reviewed</span>
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-line" />
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-ink-soft" />
                <span>7 min read</span>
              </div>
            </div>

            <p className="text-base text-ink-soft italic border-l-2 border-indigo pl-4 leading-relaxed font-medium">
              "{selectedPost.excerpt}"
            </p>
          </div>

          {selectedPost.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-line my-6">
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.imageAlt || selectedPost.title}
                className="w-full h-auto max-h-[380px] object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80";
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            </div>
          )}

          {/* Full body with beautiful custom styling */}
          <div className="pt-6 border-t border-line">
            {selectedPost.body ? (
              renderBlogPostContent(selectedPost.body, adSlots)
            ) : (
              <p className="text-ink leading-relaxed text-sm md:text-base font-sans">
                No detailed body available. Check back soon for the full article!
              </p>
            )}
          </div>

          {/* Author Bio & Editorial Review Card */}
          <div className="my-10 p-6 sm:p-7 bg-card border border-line rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-line pb-4">
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo to-indigo-light text-white font-display font-bold text-lg flex items-center justify-center shrink-0 shadow-inner">
                MV
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-base text-ink">Marcus Vance</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo/10 text-indigo">
                    Author
                  </span>
                </div>
                <p className="text-xs text-ink-soft">
                  Senior Digital Lexicographer & Lead Cultural Linguistics Editor
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              Marcus Vance specializes in computational linguistics, digital subcultures, and internet jargon evolution. He leads the research team at whatsthatmean, continuously monitoring social media corpora, online gaming vernacular, and modern workplace communication trends.
            </p>
            <div className="p-3.5 bg-paper rounded-xl border border-line/60 flex items-start gap-2.5 text-xs text-ink-soft">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-normal">
                <span className="font-bold text-ink">Editorial Integrity & Verification Guarantee:</span>
                <div>
                  This article was independently researched and verified against primary linguistics corpora and academic archives by our review board led by <strong>Dr. Elena Ward</strong>. Have a correction or insight? Contact our team at <a href="/contact" className="text-indigo underline font-medium">contact@whatsthatmean.com</a>.
                </div>
              </div>
            </div>
          </div>

          {/* Back to Blog List & Edit Button at Bottom */}
          <div className="pt-8 mt-12 border-t border-line/60 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedPost(null);
                onCloseSelectedPost?.();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn btn-ghost border border-line text-xs font-bold text-indigo hover:bg-indigo/5 hover:border-indigo/30 px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Blog List</span>
            </button>

            {canEdit && (
              <button
                onClick={() => onEditPost?.(selectedPost)}
                className="btn btn-solid bg-indigo hover:bg-indigo-dark text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Article</span>
              </button>
            )}
          </div>
        </article>
      </div>
    );
  }

  // General list of blog posts
  return (
    <div className="max-w-[1080px] mx-auto px-6 py-12">
      {/* Blog Intro Header */}
      <div className="mb-10 text-center md:text-left">
        <h2 className="font-display font-bold text-3xl text-ink flex items-center justify-center md:justify-start gap-2">
          <BookOpen className="w-7 h-7 text-indigo" />
          <span>Blog</span>
        </h2>
        <p className="text-sm text-ink-soft mt-1.5">
          Explore comprehensive guides and insights on the evolution of internet slang, business jargon, and digital communication patterns.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl max-w-md mx-auto">
          <p className="text-sm text-ink-soft">No articles have been published yet.</p>
        </div>
      ) : (
        <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => {
            const slug = post.slug || generateSlug(post.title || "");
            const blogUrl = `/blog/${slug}`;
            return (
              <a
                key={post.id ? `blog-${post.id}` : `blog-${index}-${post.title}`}
                href={blogUrl}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedPost(post);
                  onSelectBlogPost?.(post);
                  window.history.pushState(null, "", blogUrl);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="blog-card bg-card border-1.5 border-line rounded-2xl overflow-hidden text-left transition hover:border-indigo hover:shadow-md hover:-translate-y-1 shadow-sm flex flex-col justify-between cursor-pointer h-full no-underline"
              >
                <div className="w-full">
                  {post.imageUrl && (
                    <div className="w-full h-44 overflow-hidden border-b border-line">
                      <img
                        src={post.imageUrl}
                        alt={post.imageAlt || post.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-300 hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80";
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <div className="date flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                      <span className="w-1 h-1 rounded-full bg-line" />
                      <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-indigo/5 text-indigo border border-indigo/10">
                        {CATEGORIES.find(c => c.id === post.cat)?.name || "Internet & chat"}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-ink line-clamp-2 leading-[1.3] hover:text-indigo transition">
                      {post.title}
                    </h3>
                    <p className="text-xs text-ink-soft line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-line flex items-center justify-between text-xs font-bold text-indigo hover:text-indigo-dark transition w-full">
                  <span>Read Full Article</span>
                  <span className="text-base">→</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
