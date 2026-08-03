import React, { useState, useEffect, lazy, Suspense } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { 
  seedDatabaseIfEmpty, 
  fetchTerms, 
  fetchBlogPosts, 
  fetchAdSlots, 
  fetchUserProfiles,
  fetchUserProfile,
  generateSlug
} from "./data/dbService";
import { Term, BlogPost, AdSlot, UserProfile } from "./types";
// Define lightweight initial state fallbacks to achieve near-zero blocking time and tiny initial JS bundle size
const initialTerms: Term[] = [
  { id: "init-1", code: "FYI", full: "For your information", cat: "internet", ex: "FYI, the meeting moved to 3pm.", trending: true },
  { id: "init-2", code: "GG", full: "Good game", cat: "gaming", ex: "GG, well played everyone!", trending: true },
  { id: "init-3", code: "ASAP", full: "As soon as possible", cat: "internet", ex: "Please send me the report ASAP.", trending: true },
  { id: "init-4", code: "FOMO", full: "Fear of missing out", cat: "social", ex: "I bought the ticket due to FOMO.", trending: true },
  { id: "init-5", code: "SNAFU", full: "Situation normal: all fouled up", cat: "military", ex: "The system crashed again, a total SNAFU.", trending: true },
  { id: "init-6", code: "HMU", full: "Hit me up", cat: "texting", ex: "HMU when you get to the mall.", trending: true },
  { id: "init-7", code: "WFH", full: "Work from home", cat: "business", ex: "I love WFH on Fridays.", trending: true },
  { id: "init-8", code: "TBH", full: "To be honest", cat: "internet", ex: "TBH I forgot we had a call.", trending: true }
];

const initialBlogs: BlogPost[] = [
  { id: "init-b1", title: "Modern Slang Decoded", excerpt: "An introduction to internet abbreviations.", body: "", cat: "internet", date: "Just now", draft: false, keywords: "slang, modern, chat", metaDescription: "An introduction to internet abbreviations.", seoTitle: "Modern Slang Decoded" }
];

const initialAdSlots: AdSlot[] = [
  { id: "init-ad1", name: "Header banner", desc: "Top of the page banner", on: false, network: "adsense" },
  { id: "init-ad2", name: "Sidebar", desc: "Sidebar ad space", on: false, network: "adsense" },
  { id: "init-ad3", name: "Between quiz questions", desc: "Ad shown between quiz rounds", on: false, network: "adsense" }
];

// Components
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import AdPlaceholder from "./components/AdPlaceholder";
import BrowseView from "./components/BrowseView";
import QuizView from "./components/QuizView";
import BlogView from "./components/BlogView";
import TermDetailView from "./components/TermDetailView";
import AdminShell from "./components/AdminShell";
import LoginModal from "./components/LoginModal";
import PolicyPagesView, { PolicyPageType } from "./components/PolicyPagesView";

import { Loader2, Sparkles, BookOpen } from "lucide-react";

export default function App() {
  // Application Data States
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [adSlots, setAdSlots] = useState<AdSlot[]>(initialAdSlots);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  
  // Navigation & UI States
  const [activeView, setActiveView] = useState<string>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedTermCode, setSelectedTermCode] = useState<string>("");
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [quizMode, setQuizMode] = useState<"abbreviation" | "emoji">("abbreviation");

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [postToEdit, setPostToEdit] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectTerm = (term: Term) => {
    setSelectedTerm(term);
    setSelectedTermCode(term.code);
    setActiveView("term");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (activeView !== "blog") {
      setSelectedBlogPost(null);
    }
  }, [activeView]);

  // Parse the current URL path to set the matching React navigation states
  const syncUrlToState = (currentBlogs?: BlogPost[], currentTerms?: Term[]) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const search = searchParams.get("search") || "";

    const blogList = currentBlogs && currentBlogs.length > 0 ? currentBlogs : blogs;
    const termList = currentTerms && currentTerms.length > 0 ? currentTerms : terms;

    if (pathname === "/" || pathname === "/home" || pathname === "") {
      setActiveView("home");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/about") {
      setActiveView("about");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/editorial") {
      setActiveView("editorial");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/privacy") {
      setActiveView("privacy");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/terms") {
      setActiveView("terms");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/quiz") {
      setActiveView("quiz");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/blog") {
      setActiveView("blog");
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname.startsWith("/blog/")) {
      const slug = pathname.substring(6);
      setActiveView("blog");
      setSelectedTerm(null);
      if (blogList.length > 0) {
        const foundBlog = blogList.find(b => {
          const s = b.slug || generateSlug(b.title || "");
          return s === slug;
        });
        if (foundBlog) {
          setSelectedBlogPost(foundBlog);
        }
      }
    } else if (pathname === "/emoji") {
      setActiveView("browse");
      setSelectedCategory("emoji");
      setSearchQuery(search);
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname.startsWith("/browse/")) {
      const cat = pathname.substring(8);
      setActiveView("browse");
      setSelectedCategory(cat);
      setSearchQuery(search);
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname === "/browse") {
      setActiveView("browse");
      setSelectedCategory(null);
      setSearchQuery(search);
      setSelectedBlogPost(null);
      setSelectedTerm(null);
    } else if (pathname.startsWith("/term/")) {
      const code = decodeURIComponent(pathname.substring(6)).toUpperCase();
      setActiveView("term");
      setSelectedTermCode(code);
      setSelectedBlogPost(null);
      if (termList.length > 0) {
        const foundTerm = termList.find(t => t.code.toUpperCase() === code);
        if (foundTerm) {
          setSelectedTerm(foundTerm);
        }
      }
    }
  };

  // Run immediate sync on initial mount so activeView matches URL before DB loads
  useEffect(() => {
    syncUrlToState();
  }, []);

  // Sync state changes back to the browser's URL address bar
  useEffect(() => {
    if (!isDbLoaded) return;

    let newPath = "/";
    const params = new URLSearchParams();

    if (!isAdminMode) {
      if (activeView === "home") {
        newPath = "/";
      } else if (["about", "editorial", "privacy", "terms"].includes(activeView)) {
        newPath = `/${activeView}`;
      } else if (activeView === "quiz") {
        newPath = "/quiz";
      } else if (activeView === "blog") {
        if (selectedBlogPost) {
          const slug = selectedBlogPost.slug || generateSlug(selectedBlogPost.title || "");
          newPath = `/blog/${slug}`;
        } else {
          // Guard: Preserve current path if address bar is already on /blog/:slug while DB or selection resolves
          if (window.location.pathname.startsWith("/blog/")) {
            newPath = window.location.pathname;
          } else {
            newPath = "/blog";
          }
        }
      } else if (activeView === "browse") {
        if (selectedCategory === "emoji") {
          newPath = "/emoji";
        } else if (selectedCategory) {
          newPath = `/browse/${selectedCategory}`;
        } else {
          newPath = "/browse";
        }

        if (searchQuery) {
          params.set("search", searchQuery);
        }
      } else if (activeView === "term") {
        const code = selectedTerm ? selectedTerm.code : selectedTermCode;
        if (code) {
          newPath = `/term/${encodeURIComponent(code.toUpperCase())}`;
        } else if (window.location.pathname.startsWith("/term/")) {
          newPath = window.location.pathname;
        } else {
          newPath = "/browse";
        }
      }
    }

    const queryStr = params.toString();
    const finalUrl = newPath + (queryStr ? `?${queryStr}` : "");

    if (window.location.pathname + window.location.search !== finalUrl) {
      window.history.pushState(null, "", finalUrl);
    }
  }, [activeView, selectedCategory, searchQuery, selectedTerm, selectedTermCode, selectedBlogPost, isAdminMode, isDbLoaded]);

  // Synchronize initial page-load URL path to React states once DB is loaded
  useEffect(() => {
    if (isDbLoaded) {
      syncUrlToState(blogs, terms);
    }
  }, [isDbLoaded, blogs, terms]);

  // Handle browser back and forward actions (popstate events) and custom SPA navigation
  useEffect(() => {
    const handlePopState = () => {
      if (isDbLoaded) {
        syncUrlToState();
      }
    };
    const handleSpaNavigate = (e: Event) => {
      const customEv = e as CustomEvent<{ path: string }>;
      if (customEv.detail && customEv.detail.path) {
        window.history.pushState(null, "", customEv.detail.path);
        if (isDbLoaded) {
          syncUrlToState();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("spa-navigate", handleSpaNavigate);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("spa-navigate", handleSpaNavigate);
    };
  }, [isDbLoaded, terms, blogs]);

  // Dynamic client-side Title & Meta description for SEO
  useEffect(() => {
    if (!isDbLoaded) return;

    let title = "whatsthatmean | Ultimate Abbreviation, Acronym & Slang Dictionary";
    let desc = "Decode the world's abbreviations, modern chat acronyms, gaming shorthand, military codes, and business terminology. Take interactive quizzes and learn on whatsthatmean.";

    if (selectedTerm) {
      const categoryName = selectedTerm.cat ? (selectedTerm.cat.charAt(0).toUpperCase() + selectedTerm.cat.slice(1)) : "Slang";
      title = `${selectedTerm.code} Meaning: What Does ${selectedTerm.code} Mean? | whatsthatmean`;
      desc = `What does ${selectedTerm.code} stand for? It means "${selectedTerm.full}". Learn its definition, category (${categoryName}), and see real-world texting examples like: "${selectedTerm.ex || ""}"`;
    } else if (activeView === "blog" && selectedBlogPost) {
      title = selectedBlogPost.seoTitle || selectedBlogPost.title || title;
      desc = selectedBlogPost.metaDescription || selectedBlogPost.excerpt || desc;
    } else {
      switch (activeView) {
        case "home":
          title = "whatsthatmean | Home - Decode Chat, Gaming, Business & Military Slang";
          desc = "Discover trending abbreviations and modern acronyms. Search our real-time slang dictionary and test your knowledge.";
          break;
        case "browse":
          if (selectedCategory === "emoji") {
            title = "Emoji Meanings & Dictionary | whatsthatmean";
            desc = "Browse modern emojis, their actual slang meanings, examples, and texting context in our ultimate real-time emoji dictionary.";
          } else if (selectedCategory) {
            const categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
            title = `${categoryName} Abbreviations & Meanings | whatsthatmean`;
            desc = `Explore the best dictionary for ${categoryName} abbreviations, acronyms, and modern chat terms. Learn their meanings and real-world examples.`;
          } else {
            title = "Explore Dictionary | whatsthatmean - Find Abbreviations & Meanings";
            desc = "Browse through hundreds of curated acronyms, digital shorthand, and slang meanings. Filter by category or search terms instantly.";
          }
          break;
        case "quiz":
          title = "Interactive Acronym Quiz | whatsthatmean - Test Your Slang Knowledge";
          desc = "Think you know modern slang and business terminology? Challenge yourself with our challenging, adaptive abbreviation quizzes.";
          break;
        case "blog":
          title = "Word Feed Blog | whatsthatmean - Insightful Slang Articles & Trends";
          desc = "Stay up to date with deep-dives into modern internet culture, business acronym origins, and the evolution of digital shorthand.";
          break;
        default:
          break;
      }
    }

    document.title = title;

    const metaDescEl = document.querySelector('meta[name="description"]');
    if (metaDescEl) {
      metaDescEl.setAttribute("content", desc);
    }
    
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) {
      ogTitleEl.setAttribute("content", title);
    }

    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) {
      ogDescEl.setAttribute("content", desc);
    }
  }, [activeView, selectedCategory, selectedTerm, selectedBlogPost, isDbLoaded]);

  // 1. Initial Seeding and Database Loading
  const loadDatabaseData = async () => {
    try {
      // Fetch public lists concurrently to dramatically reduce latency and parallelize database queries
      const [fetchedTerms, fetchedBlogs, fetchedAdSlots] = await Promise.all([
        fetchTerms(),
        fetchBlogPosts(),
        fetchAdSlots()
      ]);
      
      setTerms(fetchedTerms);
      setBlogs(fetchedBlogs);
      setAdSlots(fetchedAdSlots);
      setIsDbLoaded(true);
    } catch (err) {
      console.error("Error loading whatsthatmean database:", err);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Fetch public lists asynchronously in the background so that pages render instantly
      try {
        await loadDatabaseData();
      } catch (err) {
        console.error("Failed background database sync:", err);
      }

      // Perform background seeding & self-healing asynchronously without blocking layout load
      seedDatabaseIfEmpty()
        .then((didChange) => {
          // If the collections were completely empty or any changes occurred during self-healing, trigger a reload
          if (didChange || terms.length === 0 || blogs.length === 0) {
            loadDatabaseData();
          }
        })
        .catch(err => console.error("Async background seeding check failed:", err));
    };
    initializeApp();
  }, []);

  // 2. Track Firebase Auth state change and fetch custom roles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role & custom profile from Firestore
        const profile = await fetchUserProfile(firebaseUser.uid);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Trigger refreshing of all lists (invoked by Admin after CRUD changes)
  const handleRefreshData = async () => {
    await loadDatabaseData();
    // Refresh user profiles as well if current user is admin
    if (currentUser && (currentUser.role === "Admin" || currentUser.role === "Editor")) {
      const fetchedUsers = await fetchUserProfiles();
      setUsers(fetchedUsers);
    }
  };

  // Keep users synced in state when current user is authorized as admin
  useEffect(() => {
    const loadUsers = async () => {
      if (currentUser && (currentUser.role === "Admin" || currentUser.role === "Editor")) {
        const fetchedUsers = await fetchUserProfiles();
        setUsers(fetchedUsers);
      }
    };
    loadUsers();
  }, [currentUser]);

  // Listen to custom SPA navigation events from internal markdown links
  useEffect(() => {
    const handleSpaNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      if (!customEvent.detail || !customEvent.detail.path) return;
      
      const path = customEvent.detail.path;
      window.history.pushState(null, "", path);
      syncUrlToState();
    };
    
    window.addEventListener("spa-navigate", handleSpaNavigate);
    return () => window.removeEventListener("spa-navigate", handleSpaNavigate);
  }, [blogs, terms, isDbLoaded]);

  // Handle Home Searches
  const handleHomeSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setActiveView("browse");
  };

  // Handle Home Category click
  const handleHomeCategorySelect = (catId: string) => {
    setSelectedCategory(catId === "all" ? null : catId);
    setSearchQuery("");
    setActiveView("browse");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-paper text-ink">
        <div className="relative mb-6">
          <Loader2 className="w-12 h-12 text-indigo animate-spin" />
          <Sparkles className="w-5 h-5 text-yellow absolute -top-1 -right-1 animate-bounce" />
        </div>
        <h3 className="font-display font-bold text-xl">Connecting to Database...</h3>
        <p className="text-xs text-ink-soft mt-1.5 font-semibold uppercase tracking-wider">Syncing live abbreviation database</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Upper Site Ad Slot */}
      {!isAdminMode && <AdPlaceholder slotName="Header banner" adSlots={adSlots} isDbLoaded={isDbLoaded} />}

      {/* Main Navigation */}
      <Navbar 
        activeView={activeView === "browse" && selectedCategory === "emoji" ? "emoji" : activeView}
        setActiveView={(view) => {
          if (view === "emoji") {
            setSelectedCategory("emoji");
            setSearchQuery("");
            setActiveView("browse");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            if (view === "browse") {
              setSelectedCategory(null);
              setSearchQuery("");
            }
            if (view === "blog") {
              setSelectedBlogPost(null);
            }
            setActiveView(view);
          }
        }}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onOpenLogin={() => setIsLoginOpen(true)}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
      />

      {/* Active Body Canvas rendering */}
      <main className="flex-1">
        {isAdminMode ? (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-paper">
              <Loader2 className="w-8 h-8 text-indigo animate-spin" />
            </div>
          }>
            <AdminShell 
              terms={terms}
              blogs={blogs}
              adSlots={adSlots}
              users={users}
              onRefreshData={handleRefreshData}
              currentUser={currentUser}
              initialEditingPost={postToEdit}
              onClearInitialEditingPost={() => setPostToEdit(null)}
            />
          </Suspense>
        ) : (
          <div className="flex">
            {/* Main view container */}
            <div className="flex-1">
              {activeView === "home" && (
                <>
                  <HomeView 
                    terms={terms}
                    onSearch={handleHomeSearch}
                    onSelectCategory={handleHomeCategorySelect}
                    onSelectTerm={handleSelectTerm}
                    blogs={blogs.filter(b => !b.draft)}
                    onSelectBlogPost={(post) => {
                      setSelectedBlogPost(post);
                      setActiveView("blog");
                    }}
                    onViewAllBlogs={() => {
                      setSelectedBlogPost(null);
                      setActiveView("blog");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onSelectEmojiQuiz={() => {
                      setQuizMode("emoji");
                      setActiveView("quiz");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onSelectEmojiDict={() => {
                      setSelectedCategory("emoji");
                      setSearchQuery("");
                      setActiveView("browse");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                  {/* Homepage Ad Slot */}
                  <AdPlaceholder slotName="In-content — after hero" adSlots={adSlots} isDbLoaded={isDbLoaded} />
                </>
              )}

              <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-paper">
                  <Loader2 className="w-8 h-8 text-indigo animate-spin" />
                </div>
              }>
                {activeView === "browse" && (
                  <div className="flex gap-6 max-w-[1080px] mx-auto">
                    <div className="flex-1">
                      <BrowseView 
                        terms={terms}
                        initialCategory={selectedCategory}
                        initialQuery={searchQuery}
                        onSelectTerm={handleSelectTerm}
                      />
                    </div>
                    {/* Sidebar Ad Placement (Shown in browse section if toggled on) */}
                    <AdPlaceholder slotName="Sidebar" adSlots={adSlots} isDbLoaded={isDbLoaded} />
                  </div>
                )}

                {activeView === "term" && (
                  <TermDetailView 
                    code={selectedTerm ? selectedTerm.code : selectedTermCode}
                    terms={terms}
                    adSlots={adSlots}
                    isDbLoaded={isDbLoaded}
                    onSelectTerm={handleSelectTerm}
                    onNavigate={(view) => {
                      setActiveView(view);
                      setSelectedTerm(null);
                    }}
                  />
                )}

                {activeView === "quiz" && (
                  <>
                    <QuizView 
                      terms={terms}
                      currentUser={currentUser}
                      initialMode={quizMode}
                    />
                    {/* Quiz Ad Placement (Shown during quiz questions if toggled on) */}
                    <AdPlaceholder slotName="Between quiz questions" adSlots={adSlots} isDbLoaded={isDbLoaded} />
                  </>
                )}

                {["about", "editorial", "privacy", "terms"].includes(activeView) && (
                  <PolicyPagesView 
                    currentPage={activeView as PolicyPageType}
                    adSlots={adSlots}
                    isDbLoaded={isDbLoaded}
                    onNavigate={(view) => {
                      setActiveView(view);
                      setSelectedTerm(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                )}

                {activeView === "blog" && (
                  <div className="flex gap-6 max-w-[1080px] mx-auto">
                    <div className="flex-1">
                      <BlogView 
                        posts={blogs.filter(b => !b.draft)} 
                        initialSelectedPost={selectedBlogPost}
                        onSelectBlogPost={(post) => setSelectedBlogPost(post)}
                        onCloseSelectedPost={() => setSelectedBlogPost(null)}
                        adSlots={adSlots}
                        currentUser={currentUser}
                        isAdminMode={isAdminMode}
                        onEditPost={(post) => {
                          setPostToEdit(post);
                          setIsAdminMode(true);
                        }}
                      />
                    </div>
                    {/* Sidebar Ad Placement (Shown in blog section if toggled on) */}
                    <AdPlaceholder slotName="Sidebar" adSlots={adSlots} isDbLoaded={isDbLoaded} />
                  </div>
                )}
              </Suspense>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Ad Slot */}
      {!isAdminMode && <AdPlaceholder slotName="Footer" adSlots={adSlots} isDbLoaded={isDbLoaded} />}

      {/* Footer Block */}
      {!isAdminMode && (
        <footer className="border-t border-line py-8 bg-paper text-center text-xs text-ink-soft">
          <div className="max-w-[1080px] mx-auto px-6 space-y-3">
            <div className="font-display font-bold text-ink text-sm">whatsthatmean — the complete abbreviation dictionary</div>
            <p className="max-w-md mx-auto text-[11px] leading-relaxed">
              Explore 4,400+ modern text slangs, gaming acronyms, corporate shorthand, and digital jargon.
            </p>
            
            {/* Publisher Compliance Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs pt-1 font-medium text-ink-soft">
              <button 
                onClick={() => {
                  setActiveView("about");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="hover:text-indigo underline cursor-pointer"
              >
                About Us
              </button>
              <span>•</span>
              <button 
                onClick={() => {
                  setActiveView("editorial");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="hover:text-indigo underline cursor-pointer"
              >
                Editorial Policy
              </button>
              <span>•</span>
              <button 
                onClick={() => {
                  setActiveView("privacy");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="hover:text-indigo underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button 
                onClick={() => {
                  setActiveView("terms");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="hover:text-indigo underline cursor-pointer"
              >
                Terms of Service
              </button>
            </div>

            <div className="pt-2 text-[10px] text-ink-soft">
              &copy; 2026 whatsthatmean. All rights reserved. Verified lexicographical reference portal.
            </div>
          </div>
        </footer>
      )}

      {/* Auth Login Dialog popup */}
      <Suspense fallback={null}>
        <LoginModal 
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(profile) => setCurrentUser(profile)}
        />
      </Suspense>
    </div>
  );
}
