import React, { useState } from "react";
import { UserProfile } from "../types";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
}

export default function Navbar({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  onOpenLogin,
  isAdminMode,
  setIsAdminMode
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {[
              { id: "home", label: "Home" },
              { id: "browse", label: "Explore Dictionary" },
              { id: "emoji", label: "Emoji" },
              { id: "quiz", label: "Quiz" },
              /* { id: "blog", label: "Blog" } - Disabled for standalone distribution. Uncomment to restore */
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                  ${activeView === view.id 
                    ? "bg-line/60 text-ink font-semibold" 
                    : "text-ink-soft hover:bg-line/40 hover:text-ink"
                  }`}
              >
                {view.label}
              </button>
            ))}
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

          {/* 
            FIREBASE AUTH & USER LOGIN (Disabled for current standalone distribution)
            To re-enable login button and user dropdown profile, uncomment the block below:
            
            {currentUser ? ( ... ) : ( <button onClick={onOpenLogin}>Log in</button> )}
          */}

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
              {[
                { id: "home", label: "Home" },
                { id: "browse", label: "Explore Dictionary" },
                { id: "emoji", label: "Emoji" },
                { id: "quiz", label: "Quiz" },
                /* { id: "blog", label: "Blog" } - Disabled for standalone distribution. */
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => {
                    setActiveView(view.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition cursor-pointer
                    ${activeView === view.id 
                      ? "bg-indigo/10 text-indigo" 
                      : "text-ink hover:bg-line/30"
                    }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
