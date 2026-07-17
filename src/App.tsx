import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { 
  seedDatabaseIfEmpty, 
  fetchTerms, 
  fetchBlogPosts, 
  fetchAdSlots, 
  fetchUserProfiles,
  fetchUserProfile 
} from "./data/dbService";
import { Term, BlogPost, AdSlot, UserProfile } from "./types";
import { TERMS, BLOG_SEED, AD_SLOTS } from "./data/seedData";

const initialTerms: Term[] = TERMS.map((t, idx) => ({
  id: `seed-term-${idx}`,
  ...t,
  trending: ["FOMO", "GG", "ASAP", "HMU", "SNAFU", "DM", "WFH", "POV"].includes(t.code)
}));

const initialBlogs: BlogPost[] = BLOG_SEED.map((b, idx) => ({
  id: `seed-blog-${idx}`,
  ...b
}));

const initialAdSlots: AdSlot[] = AD_SLOTS.map((a, idx) => ({
  id: `seed-ad-${idx}`,
  ...a
}));

// Components
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import BrowseView from "./components/BrowseView";
import QuizView from "./components/QuizView";
import BlogView from "./components/BlogView";
import AdminShell from "./components/AdminShell";
import LoginModal from "./components/LoginModal";
import TermDetailModal from "./components/TermDetailModal";
import AdPlaceholder from "./components/AdPlaceholder";

import { Loader2, Sparkles, BookOpen } from "lucide-react";

export default function App() {
  // Application Data States
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [adSlots, setAdSlots] = useState<AdSlot[]>(initialAdSlots);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Navigation & UI States
  const [activeView, setActiveView] = useState<string>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [quizMode, setQuizMode] = useState<"abbreviation" | "emoji">("abbreviation");

  useEffect(() => {
    if (activeView !== "blog") {
      setSelectedBlogPost(null);
    }
  }, [activeView]);

  // Dynamic Title & Meta description for SEO
  useEffect(() => {
    // If we're on the blog view and have selected a single post, BlogView component manages its own SEO title/meta tags
    if (activeView === "blog" && selectedBlogPost) {
      return;
    }

    let title = "whatsthatmean | Ultimate Abbreviation, Acronym & Slang Dictionary";
    let desc = "Decode the world's abbreviations, modern chat acronyms, gaming shorthand, military codes, and business terminology. Take interactive quizzes and learn on whatsthatmean.";

    switch (activeView) {
      case "home":
        title = "whatsthatmean | Home - Decode Chat, Gaming, Business & Military Slang";
        desc = "Discover trending abbreviations and modern acronyms. Search our real-time slang dictionary and test your knowledge.";
        break;
      case "browse":
        title = "Explore Dictionary | whatsthatmean - Find Abbreviations & Meanings";
        desc = "Browse through hundreds of curated acronyms, digital shorthand, and slang meanings. Filter by category or search terms instantly.";
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
  }, [activeView, selectedBlogPost]);
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [loading, setLoading] = useState(false);

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
      
      if (path === "/") {
        setActiveView("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (path.startsWith("/browse")) {
        // e.g. /browse?search=FOMO
        let search = "";
        try {
          const urlObj = new URL(path, window.location.origin);
          search = urlObj.searchParams.get("search") || "";
        } catch (err) {
          const match = path.match(/[?&]search=([^&]+)/);
          if (match) search = decodeURIComponent(match[1]);
        }
        setSearchQuery(search);
        setSelectedCategory(null);
        setActiveView("browse");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (path.startsWith("/quiz")) {
        setActiveView("quiz");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (path.startsWith("/blog")) {
        // e.g. /blog or /blog/some-slug
        const urlParts = path.split("/");
        if (urlParts.length > 2 && urlParts[2]) {
          const slug = urlParts[2];
          // Find the blog with matching slug
          const foundBlog = blogs.find(b => {
            const s = (b.title || "")
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-");
            return s === slug;
          });
          if (foundBlog) {
            setSelectedBlogPost(foundBlog);
            setActiveView("blog");
          } else {
            setSelectedBlogPost(null);
            setActiveView("blog");
          }
        } else {
          setSelectedBlogPost(null);
          setActiveView("blog");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    
    window.addEventListener("spa-navigate", handleSpaNavigate);
    return () => window.removeEventListener("spa-navigate", handleSpaNavigate);
  }, [blogs]);

  // Handle Home Searches
  const handleHomeSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setActiveView("browse");
  };

  // Handle Home Category click
  const handleHomeCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery("");
    setActiveView("browse");
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
      {!isAdminMode && <AdPlaceholder slotName="Header banner" adSlots={adSlots} />}

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
          <AdminShell 
            terms={terms}
            blogs={blogs}
            adSlots={adSlots}
            users={users}
            onRefreshData={handleRefreshData}
            currentUser={currentUser}
          />
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
                    onSelectTerm={setSelectedTerm}
                    blogs={blogs.filter(b => !b.draft)}
                    onSelectBlogPost={(post) => {
                      setSelectedBlogPost(post);
                      setActiveView("blog");
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
                  <AdPlaceholder slotName="In-content — after hero" adSlots={adSlots} />
                </>
              )}

              {activeView === "browse" && (
                <div className="flex gap-6 max-w-[1080px] mx-auto">
                  <div className="flex-1">
                    <BrowseView 
                      terms={terms}
                      initialCategory={selectedCategory}
                      initialQuery={searchQuery}
                      onSelectTerm={setSelectedTerm}
                    />
                  </div>
                  {/* Sidebar Ad Placement (Shown in browse section if toggled on) */}
                  <AdPlaceholder slotName="Sidebar" adSlots={adSlots} />
                </div>
              )}

              {activeView === "quiz" && (
                <>
                  <QuizView 
                    terms={terms}
                    currentUser={currentUser}
                    initialMode={quizMode}
                  />
                  {/* Quiz Ad Placement (Shown during quiz questions if toggled on) */}
                  <AdPlaceholder slotName="Between quiz questions" adSlots={adSlots} />
                </>
              )}

              {activeView === "blog" && (
                <div className="flex gap-6 max-w-[1080px] mx-auto">
                  <div className="flex-1">
                    <BlogView 
                      posts={blogs.filter(b => !b.draft)} 
                      initialSelectedPost={selectedBlogPost}
                      onCloseSelectedPost={() => setSelectedBlogPost(null)}
                    />
                  </div>
                  {/* Sidebar Ad Placement (Shown in blog section if toggled on) */}
                  <AdPlaceholder slotName="Sidebar" adSlots={adSlots} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Ad Slot */}
      {!isAdminMode && <AdPlaceholder slotName="Footer" adSlots={adSlots} />}

      {/* Footer Block */}
      {!isAdminMode && (
        <footer className="border-t border-line py-8 bg-paper text-center text-xs text-ink-soft">
          <div className="max-w-[1080px] mx-auto px-6 space-y-2">
            <div className="font-display font-bold text-ink">whatsthatmean — the complete abbreviation dictionary</div>
            <p className="max-w-md mx-auto text-[11px] leading-relaxed">
              Explore every modern abbreviation, text acronym, and digital shorthand.
            </p>
            <div className="pt-3 text-[10px] text-ink-soft">
              &copy; 2026 whatsthatmean. All rights reserved. Created for educational and presentation purposes.
            </div>
          </div>
        </footer>
      )}

      {/* Auth Login Dialog popup */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(profile) => setCurrentUser(profile)}
      />

      {/* Slang term details popup drawer */}
      <TermDetailModal 
        term={selectedTerm}
        onClose={() => setSelectedTerm(null)}
      />
    </div>
  );
}
