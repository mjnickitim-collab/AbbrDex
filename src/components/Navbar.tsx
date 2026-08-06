import React, { useState } from "react";
import { UserProfile } from "../types";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { CATEGORIES } from "../data/seedData";
import { Menu, X, ChevronDown, BookOpen, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  onSelectCategory?: (catId: string | null) => void;
}

export default function Navbar({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  onOpenLogin,
  isAdminMode,
  setIsAdminMode,
  onSelectCategory
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
      setDropdownOpen(false);
      setIsAdminMode(false);
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  const handleExploreClick = () => {
    if (onSelectCategory) {
      onSelectCategory(null);
    } else {
      setActiveView("browse");
    }
    setCatMenuOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (catId: string | null) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      setActiveView("browse");
    }
    setCatMenuOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="nav sticky top-0 z-50 bg-paper/92 backdrop-blur-md border-b border-line">
      <div className="nav-inner max-w-[1080px] mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <button 
          onClick={() => {
            setIsAdminMode(false);
            setActiveView("home");
          }}
          className="logo display flex items-center gap-2 text-xl font-display cursor-pointer hover:opacity-90 select-none group"
        >
          <span className="dot w-3.5 h-3.5 rounded-[4px] bg-indigo inline-block transform rotate-45 shadow-sm shadow-indigo/25 transition-transform duration-500 group-hover:rotate-90" />
          <span className="tracking-tight leading-none">
            <span className="text-ink-soft font-normal">whats</span>
            <span className="text-indigo font-black">That</span>
            <span className="text-ink font-extrabold">Mean</span>
            <span className="text-indigo font-black ml-0.5 inline-block group-hover:translate-y-[-2px] transition-transform duration-200">?</span>
          </span>
        </button>

        {/* Navigation Links - Hidden on mobile */}
        {!isAdminMode && (
          <div className="hidden md:flex items-center gap-1 nav-links">
            {/* Home */}
            <button
              onClick={() => setActiveView("home")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                ${activeView === "home" 
                  ? "bg-line/60 text-ink font-semibold" 
                  : "text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
            >
              Home
            </button>

            {/* Explore Dictionary Dropdown Button */}
            <div 
              className="relative"
              onMouseEnter={() => setCatMenuOpen(true)}
              onMouseLeave={() => setCatMenuOpen(false)}
            >
              <div className="flex items-center">
                <button
                  onClick={handleExploreClick}
                  className={`pl-3.5 pr-1.5 py-2 rounded-l-lg text-sm font-medium transition cursor-pointer flex items-center gap-1
                    ${activeView === "browse" 
                      ? "bg-line/60 text-ink font-semibold" 
                      : "text-ink-soft hover:bg-line/40 hover:text-ink"
                    }`}
                >
                  <span>Explore Dictionary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatMenuOpen(!catMenuOpen)}
                  className={`pr-2.5 pl-0.5 py-2 rounded-r-lg text-sm transition cursor-pointer
                    ${activeView === "browse" 
                      ? "bg-line/60 text-ink font-semibold" 
                      : "text-ink-soft hover:bg-line/40 hover:text-ink"
                    }`}
                  aria-label="Toggle category menu"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catMenuOpen ? "rotate-180 text-indigo" : ""}`} />
                </button>
              </div>

              {/* Category Dropdown Menu */}
              <AnimatePresence>
                {catMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1 w-[460px] sm:w-[500px] bg-card border border-line rounded-2xl shadow-xl p-3 z-50"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft border-b border-line/60 flex items-center justify-between mb-2">
                      <span>Explore Categories</span>
                      <span className="text-[10px] text-indigo font-normal">All 15 Hubs</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCategorySelect(null)}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-indigo bg-indigo/5 hover:bg-indigo/10 transition flex items-center gap-2 cursor-pointer mb-2"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo" />
                      <span>All Categories (Full Dictionary)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-line/40">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={`nav-cat-${cat.id}`}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className="text-left px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-paper hover:text-indigo transition flex items-center justify-between cursor-pointer group"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Tag className="w-3 h-3 text-ink-soft group-hover:text-indigo transition shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <span className={`tag ${cat.tag} text-[9px] py-0 px-1.5 shrink-0`}>
                            {cat.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Emoji */}
            <button
              onClick={() => handleCategorySelect("emoji")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                ${activeView === "browse" && false
                  ? "bg-line/60 text-ink font-semibold" 
                  : "text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
            >
              Emoji
            </button>

            {/* Quiz */}
            <button
              onClick={() => setActiveView("quiz")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                ${activeView === "quiz" 
                  ? "bg-line/60 text-ink font-semibold" 
                  : "text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
            >
              Quiz
            </button>

            {/* Blog */}
            <button
              onClick={() => setActiveView("blog")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                ${activeView === "blog" 
                  ? "bg-line/60 text-ink font-semibold" 
                  : "text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
            >
              Blog
            </button>
          </div>
        )}

        {/* Right Side Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {currentUser && (currentUser.role === "Admin" || currentUser.role === "Editor") && (
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`btn btn-sm cursor-pointer border-1.5 transition font-display font-semibold px-2 sm:px-4 py-1.5 text-xs sm:text-sm whitespace-nowrap
                ${isAdminMode 
                  ? "bg-ink text-paper border-ink hover:bg-ink-soft hover:border-ink-soft" 
                  : "btn-ghost"
                }`}
            >
              {isAdminMode ? (
                <>
                  <span className="sm:hidden">← Site</span>
                  <span className="hidden sm:inline">← Back to Site</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Admin</span>
                  <span className="hidden sm:inline">Admin Panel</span>
                </>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn btn-solid btn-sm font-display font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 max-w-[95px] sm:max-w-[150px] overflow-hidden"
              >
                <span className="truncate max-w-[50px] sm:max-w-[100px] block">{currentUser.name}</span>
                <span className="text-[8px] sm:text-[10px] flex-shrink-0">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-line rounded-xl shadow-lg py-2 text-sm z-50">
                  <div className="px-4 py-2 border-b border-line text-xs">
                    <p className="font-semibold text-ink text-ellipsis overflow-hidden">{currentUser.name}</p>
                    <p className="text-ink-soft text-ellipsis overflow-hidden">{currentUser.email}</p>
                    <p className="mt-1 font-mono text-[10px] text-indigo bg-indigo/5 px-1.5 py-0.5 rounded-md inline-block">
                      {currentUser.role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                       setActiveView("quiz");
                       setDropdownOpen(false);
                       setIsAdminMode(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-paper text-ink transition"
                  >
                    Quiz History
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 hover:bg-paper text-coral-ink font-semibold transition"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-solid btn-sm font-display font-semibold px-5 shadow-sm"
            >
              Log in
            </button>
          )}

          {/* Hamburger Menu Button */}
          {!isAdminMode && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-ink-soft hover:bg-line/60 hover:text-ink transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {!isAdminMode && mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-line bg-paper/95 backdrop-blur-md"
          >
            <div className="px-6 py-4 flex flex-col gap-1.5">
              {/* Home */}
              <button
                onClick={() => {
                  setActiveView("home");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition cursor-pointer
                  ${activeView === "home" ? "bg-indigo/10 text-indigo" : "text-ink hover:bg-line/30"}`}
              >
                Home
              </button>

              {/* Explore Dictionary */}
              <div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleExploreClick}
                    className={`flex-1 text-left px-4 py-3 rounded-xl text-base font-semibold transition cursor-pointer
                      ${activeView === "browse" ? "bg-indigo/10 text-indigo" : "text-ink hover:bg-line/30"}`}
                  >
                    Explore Dictionary (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileCatOpen(!mobileCatOpen)}
                    className="p-3 text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatOpen ? "rotate-180 text-indigo" : ""}`} />
                  </button>
                </div>

                {mobileCatOpen && (
                  <div className="ml-4 my-1 pl-3 border-l-2 border-indigo/20 space-y-1 py-1 max-h-48 overflow-y-auto">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={`mob-cat-${cat.id}`}
                        onClick={() => handleCategorySelect(cat.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-soft hover:text-indigo hover:bg-line/30 transition cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Emoji */}
              <button
                onClick={() => handleCategorySelect("emoji")}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition cursor-pointer text-ink hover:bg-line/30`}
              >
                Emoji
              </button>

              {/* Quiz */}
              <button
                onClick={() => {
                  setActiveView("quiz");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition cursor-pointer
                  ${activeView === "quiz" ? "bg-indigo/10 text-indigo" : "text-ink hover:bg-line/30"}`}
              >
                Quiz
              </button>

              {/* Blog */}
              <button
                onClick={() => {
                  setActiveView("blog");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition cursor-pointer
                  ${activeView === "blog" ? "bg-indigo/10 text-indigo" : "text-ink hover:bg-line/30"}`}
              >
                Blog
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
