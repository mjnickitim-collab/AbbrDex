import React, { useState } from "react";
import { BlogPost } from "../types";
import { Calendar, ChevronLeft, BookOpen } from "lucide-react";

interface BlogViewProps {
  posts: BlogPost[];
  initialSelectedPost?: BlogPost | null;
  onCloseSelectedPost?: () => void;
}

export default function BlogView({ posts, initialSelectedPost = null, onCloseSelectedPost }: BlogViewProps) {
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
        document.title = `${selectedPost.title} | SlangDex`;
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
    return (
      <div className="max-w-[720px] mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedPost(null);
            onCloseSelectedPost?.();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo hover:text-indigo-dark transition mb-8 group cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          <span>Back to Blog List</span>
        </button>

        {/* Blog Post Header */}
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedPost.date}</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink leading-[1.2] tracking-tight">
              {selectedPost.title}
            </h2>
            <p className="text-base text-ink-soft italic border-l-2 border-indigo pl-4 leading-relaxed font-medium">
              "{selectedPost.excerpt}"
            </p>
          </div>

          {/* Full body with beautiful custom styling */}
          <div className="text-ink leading-relaxed space-y-5 text-sm md:text-base pt-6 border-t border-line font-sans">
            {selectedPost.body ? (
              selectedPost.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-ink leading-relaxed">
                  {para}
                </p>
              ))
            ) : (
              <p className="text-ink leading-relaxed">
                No detailed body available. Check back soon for the full article!
              </p>
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
          <span>From the Blog</span>
        </h2>
        <p className="text-sm text-ink-soft mt-1.5">
          Read deep dives into abbreviation origins, workspace corporate language shifts, and digital linguistics.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl max-w-md mx-auto">
          <p className="text-sm text-ink-soft">No articles have been published yet.</p>
        </div>
      ) : (
        <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <button
              key={post.id || post.title}
              onClick={() => setSelectedPost(post)}
              className="blog-card bg-card border-1.5 border-line rounded-2xl p-6 text-left transition hover:border-ink hover:-translate-y-1 shadow-sm flex flex-col justify-between cursor-pointer h-full"
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
    </div>
  );
}
