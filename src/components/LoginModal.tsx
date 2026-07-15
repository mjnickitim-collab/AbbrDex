import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { fetchUserProfile, createUserProfile } from "../data/dbService";
import { UserProfile } from "../types";
import { Chrome } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userProfile: UserProfile) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error("Please enter a display name.");
        }
        // Real signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        const profile: Omit<UserProfile, "uid"> = {
          name: username,
          email: email,
          role: email.toLowerCase().trim() === "mjnickitim@gmail.com" ? "Admin" : "User",
          status: "active",
          joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        };
        await createUserProfile(user.uid, profile);
        
        onLoginSuccess({ uid: user.uid, ...profile });
      } else {
        // Real signin
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch profile
        let profile = await fetchUserProfile(user.uid);
        if (!profile) {
          // Fallback if profile doesn't exist
          profile = {
            uid: user.uid,
            name: user.email?.split("@")[0] || "User",
            email: user.email || "",
            role: user.email?.toLowerCase().trim() === "mjnickitim@gmail.com" ? "Admin" : "User",
            status: "active",
            joined: "Just now"
          };
          await createUserProfile(user.uid, {
            name: profile.name,
            email: profile.email,
            role: profile.role,
            status: profile.status,
            joined: profile.joined
          });
        } else if (profile.email?.toLowerCase().trim() === "mjnickitim@gmail.com" && profile.role !== "Admin") {
          // Auto-promote to Admin in Firestore
          profile.role = "Admin";
          await createUserProfile(profile.uid, {
            name: profile.name,
            email: profile.email,
            role: "Admin",
            status: profile.status,
            joined: profile.joined
          });
        }

        if (profile.status === "banned") {
          await signOut(auth);
          throw new Error("This account has been banned by an administrator.");
        }

        onLoginSuccess(profile);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Authentication failed.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "That email is already registered.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password must be at least 6 characters long.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      let profile = await fetchUserProfile(user.uid);
      if (!profile) {
        profile = {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "Google User",
          email: user.email || "",
          role: user.email?.toLowerCase().trim() === "mjnickitim@gmail.com" ? "Admin" : "User",
          status: "active",
          joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        };
        await createUserProfile(user.uid, profile);
      } else if (profile.email?.toLowerCase().trim() === "mjnickitim@gmail.com" && profile.role !== "Admin") {
        profile.role = "Admin";
        await createUserProfile(profile.uid, {
          name: profile.name,
          email: profile.email,
          role: "Admin",
          status: profile.status,
          joined: profile.joined
        });
      }

      if (profile.status === "banned") {
        await signOut(auth);
        throw new Error("This account has been banned by an administrator.");
      }

      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Google Sign-In failed.";
      if (err.code === "auth/popup-blocked") {
        errMsg = "Pop-up blocked by browser. Please enable pop-ups for this site.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Sign-in window closed before completion.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper buttons to easily test
  const handleQuickDemo = async (role: "User" | "Admin") => {
    setEmail(role === "Admin" ? "admin@whatsthatmean.com" : "user@whatsthatmean.com");
    setPassword("password123");
    setIsSignUp(false);
  };

  return (
    <div className="overlay" id="loginOverlay">
      <div className="modal relative max-w-sm w-full bg-card p-8 rounded-2xl border border-line shadow-lg">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-ink-soft hover:text-ink text-2xl transition"
        >
          &times;
        </button>
        
        <h3 className="font-display text-2xl font-bold mb-2">
          {isSignUp ? "Sign up for whatsthatmean" : "Log in to whatsthatmean"}
        </h3>
        
        <p className="text-xs text-ink-soft mb-6">
          Connect to Firebase Auth. Register a new account or sign in with your credentials.
        </p>

        {error && (
          <div className="bg-coral/10 text-coral-ink border border-coral/20 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="field flex flex-col">
              <label className="text-xs font-semibold text-ink-soft mb-1">Display Name</label>
              <input 
                type="text" 
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
              />
            </div>
          )}

          <div className="field flex flex-col">
            <label className="text-xs font-semibold text-ink-soft mb-1">Email</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
            />
          </div>

          <div className="field flex flex-col">
            <label className="text-xs font-semibold text-ink-soft mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-solid w-full font-display font-bold p-3 mt-4 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isSignUp ? "Sign Up" : "Log In"
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-line"></div>
          <span className="flex-shrink mx-4 text-xs text-ink-soft font-mono uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-line"></div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-white border border-line hover:border-ink text-ink font-semibold rounded-lg py-3 text-sm transition shadow-sm hover:bg-paper/30 disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-indigo" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 pt-6 border-t border-line text-center text-xs text-ink-soft">
          <span>{isSignUp ? "Already have an account?" : "New to whatsthatmean?"} </span>
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }} 
            className="text-indigo hover:underline font-semibold"
          >
            {isSignUp ? "Log in here" : "Sign up here"}
          </button>
        </div>

        {/* Demo Fast Account Setup */}
        <div className="mt-6 pt-4 border-t border-line bg-paper/40 p-3 rounded-lg text-center">
          <div className="text-[11px] font-bold text-ink-soft mb-2 uppercase tracking-wide">Demo Accounts (Firebase Mock)</div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => handleQuickDemo("User")} 
              className="flex-1 bg-white hover:bg-line/40 border border-line text-xs font-medium py-1.5 px-2 rounded transition text-ink"
            >
              Fill User
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickDemo("Admin")} 
              className="flex-1 bg-white hover:bg-line/40 border border-line text-xs font-medium py-1.5 px-2 rounded transition text-ink"
            >
              Fill Admin
            </button>
          </div>
          <p className="text-[10px] text-ink-soft mt-2">
            Click to autofill. Passwords are `password123`. Users can create actual accounts too!
          </p>
        </div>
      </div>
    </div>
  );
}
