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
          className="logo display flex items-center gap-2 text-xl font-bold font-display cursor-pointer hover:opacity-90"
        >
          <span className="dot w-[10px] h-[10px] rounded-[3px] bg-indigo inline-block transform rotate-45" />
          <span>AbbrDex</span>
        </button>

        {/* Navigation Links - Hidden on mobile, original layout had display:none on md */}
        {!isAdminMode && (
          <div className="hidden md:flex items-center gap-1 nav-links">
            {[
              { id: "home", label: "Home" },
              { id: "browse", label: "Explore Dictionary" },
              { id: "quiz", label: "Quiz" },
              { id: "blog", label: "Blog" }
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
        <div className="flex items-center gap-2.5">
          {currentUser && (currentUser.role === "Admin" || currentUser.role === "Editor") && (
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`btn btn-sm cursor-pointer border-1.5 transition font-display font-semibold px-4
                ${isAdminMode 
                  ? "bg-ink text-paper border-ink hover:bg-ink-soft hover:border-ink-soft" 
                  : "btn-ghost"
                }`}
            >
              {isAdminMode ? "← Back to Site" : "Admin Panel"}
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn btn-solid btn-sm font-display font-semibold px-4 flex items-center gap-1.5"
              >
                <span>{currentUser.name}</span>
                <span className="text-[10px]">▼</span>
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
              {[
                { id: "home", label: "Home" },
                { id: "browse", label: "Explore Dictionary" },
                { id: "quiz", label: "Quiz" },
                { id: "blog", label: "Blog" }
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
