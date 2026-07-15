import React, { useState, useEffect } from "react";
import { Term, BlogPost, AdSlot, UserProfile } from "../types";
import { CATEGORIES, TERMS } from "../data/seedData";
import { 
  addTerm, 
  updateTerm, 
  deleteTerm, 
  addBlogPost, 
  deleteBlogPost, 
  updateBlogPost,
  updateAdSlotStatus, 
  updateAdSlot,
  resetTermsDatabase,
  updateUserProfile 
} from "../data/dbService";
import { 
  BarChart, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Settings, 
  Users, 
  Radio, 
  BookOpen, 
  HelpCircle, 
  Grid,
  Download,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { renderBlogPostContent } from "../utils/blogParser";

interface AdminShellProps {
  terms: Term[];
  blogs: BlogPost[];
  adSlots: AdSlot[];
  users: UserProfile[];
  onRefreshData: () => void;
  currentUser: UserProfile | null;
}

type AdminTab = "overview" | "terms" | "users" | "ads" | "blog";

export default function AdminShell({
  terms,
  blogs,
  adSlots,
  users,
  onRefreshData,
  currentUser
}: AdminShellProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // State for term form
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termCode, setTermCode] = useState("");
  const [termFull, setTermFull] = useState("");
  const [termCat, setTermCat] = useState("internet");
  const [termEx, setTermEx] = useState("");

  // State for blog form
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCat, setBlogCat] = useState("internet");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogBody, setBlogBody] = useState("");
  const [blogSeoTitle, setBlogSeoTitle] = useState("");
  const [blogMetaDescription, setBlogMetaDescription] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInsertMarkup = (
    type: "bold" | "italic" | "link" | "image" | "list" | "numlist" | "quote" | "h1" | "h2" | "h3" | "p" | "ad"
  ) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    if (type === "bold") {
      replacement = `**${selectedText || "bold text"}**`;
    } else if (type === "italic") {
      replacement = `*${selectedText || "italic text"}*`;
    } else if (type === "link") {
      const label = selectedText || prompt("Enter link label/text:", "whatsthatmean Link") || "whatsthatmean Link";
      const url = prompt("Enter link URL:", "https://") || "https://";
      if (!url) return;
      replacement = `[${label}](${url})`;
    } else if (type === "image") {
      const alt = selectedText || prompt("Enter image caption/description:", "Creative Image") || "";
      const url = prompt("Enter image URL:", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80") || "";
      if (!url) return;
      replacement = `![${alt}](${url})`;
    } else if (type === "list") {
      replacement = `\n- ${selectedText || "List item"}`;
    } else if (type === "numlist") {
      replacement = `\n1. ${selectedText || "Numbered list item"}`;
    } else if (type === "quote") {
      replacement = `\n> ${selectedText || "Blockquote content"}`;
    } else if (type === "h1") {
      replacement = `\n# ${selectedText || "Heading 1"}\n`;
    } else if (type === "h2") {
      replacement = `\n## ${selectedText || "Heading 2"}\n`;
    } else if (type === "h3") {
      replacement = `\n### ${selectedText || "Heading 3"}\n`;
    } else if (type === "p") {
      replacement = `\n${selectedText || "Paragraph text"}\n`;
    } else if (type === "ad") {
      replacement = `\n[AD]\n`;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setBlogBody(newValue);

    // Re-focus and restore cursor selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleInsertSampleTemplate = () => {
    const sample = `In today's digital era, modern communication relies heavily on digital shorthand and acronyms.

Check out our primary dictionary at [Explore whatsthatmean Dictionary](https://whatsthatmean.com/browse) to search and filter hundreds of curated slang terms!

Here is an example visualization of digital workspace productivity:
![Workspace Collaboration Infographic](https://images.unsplash.com/photo-1531535934027-667f6db87540?auto=format&fit=crop&w=600&q=80)

Key advantages of adopting standardized communication shorthand:
- Faster feedback loops in remote/hybrid workspaces
- Maximized text efficiency on standard mobile interfaces
- Dynamic community engagement using shared subculture slang

Try writing your own content or edit this template using the helper buttons above!`;
    setBlogBody(sample);
  };

  const handleStartEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setBlogTitle(post.title);
    setBlogCat(post.cat || "internet");
    setBlogExcerpt(post.excerpt);
    setBlogBody(post.body);
    setBlogSeoTitle(post.seoTitle || "");
    setBlogMetaDescription(post.metaDescription || "");
    setBlogKeywords(post.keywords || "");
    setShowPreview(false);

    // Scroll smoothly to the form
    const formElement = document.getElementById("blog-publisher-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEditPost = () => {
    setEditingPost(null);
    setBlogTitle("");
    setBlogExcerpt("");
    setBlogBody("");
    setBlogCat("internet");
    setBlogSeoTitle("");
    setBlogMetaDescription("");
    setBlogKeywords("");
    setShowPreview(false);
  };

  // State for Ad slots inputs & db seeding tools
  const [adCodes, setAdCodes] = useState<Record<string, string>>({});
  const [isSeeding, setIsSeeding] = useState(false);

  // CSV Export helper
  const handleExportCSV = () => {
    if (terms.length === 0) {
      alert("No terms available to export.");
      return;
    }

    // Prepare headers
    const headers = ["Abbreviation", "Meaning", "Category", "Example Usage"];
    
    // Process rows
    const rows = terms.map(t => [
      t.code,
      t.full,
      t.cat,
      t.ex
    ]);

    // Format helper for CSV escaping
    const formatCell = (val: string) => {
      const clean = (val || "").replace(/"/g, '""');
      if (clean.includes(",") || clean.includes('"') || clean.includes("\n") || clean.includes("\r")) {
        return `"${clean}"`;
      }
      return clean;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(formatCell).join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `whatsthatmean_Terms_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing helper
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        lines.push(row);
        row = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      lines.push(row);
    }
    return lines.filter(r => r.some(cell => cell !== ""));
  };

  // CSV Import helper
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        alert("Failed to read the file.");
        return;
      }

      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          throw new Error("No data found in the CSV file.");
        }

        // Detect and skip header row
        let startIndex = 0;
        const firstRow = parsed[0];
        if (
          firstRow &&
          (firstRow[0]?.toLowerCase().includes("abbr") ||
            firstRow[0]?.toLowerCase().includes("code") ||
            firstRow[1]?.toLowerCase().includes("mean") ||
            firstRow[2]?.toLowerCase().includes("cat"))
        ) {
          startIndex = 1;
        }

        const validRows = parsed.slice(startIndex).filter(row => row.length >= 2 && row[0] && row[1]);

        if (validRows.length === 0) {
          alert("No valid terms rows found. Format must be: Abbreviation, Meaning, Category, Example Usage");
          return;
        }

        const mode = window.confirm(
          `Found ${validRows.length} terms in CSV.\n\nClick [OK] to APPEND these terms to the current database.\nClick [Cancel] to OVERWRITE the current database with these terms.`
        );

        setIsSeeding(true);

        const termsToUpload = validRows.map(row => {
          const code = row[0].toUpperCase().trim();
          const full = row[1].trim();
          const cat = row[2] ? row[2].trim().toLowerCase() : "internet";
          const ex = row[3] ? row[3].trim() : `Usage of ${code}`;
          
          // Ensure category is valid, fallback to 'internet' if not
          const isValidCat = CATEGORIES.some(c => c.id === cat);
          
          return {
            code,
            full,
            cat: isValidCat ? cat : "internet",
            ex,
            trending: false
          };
        });

        if (mode) {
          // APPEND MODE
          let count = 0;
          for (const t of termsToUpload) {
            await addTerm(t);
            count++;
          }
          alert(`Successfully appended ${count} terms from CSV!`);
        } else {
          // OVERWRITE MODE
          if (window.confirm("WARNING: This will delete ALL current terms and replace them with the CSV terms. Are you absolutely sure?")) {
            await resetTermsDatabase(termsToUpload);
            alert(`Successfully replaced database with ${termsToUpload.length} CSV terms!`);
          } else {
            setIsSeeding(false);
            return;
          }
        }

        onRefreshData();
      } catch (err: any) {
        console.error("Error importing CSV:", err);
        alert(`Failed to import CSV: ${err.message || err}`);
      } finally {
        setIsSeeding(false);
        e.target.value = ""; // clear file input
      }
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    const codes: Record<string, string> = {};
    adSlots.forEach(s => {
      if (s.id) {
        codes[s.id] = s.adsenseCode || "";
      }
    });
    setAdCodes(codes);
  }, [adSlots]);

  // Term management helpers
  const handleOpenTermModal = (term: Term | null = null) => {
    if (term) {
      setEditingTerm(term);
      setTermCode(term.code);
      setTermFull(term.full);
      setTermCat(term.cat);
      setTermEx(term.ex);
    } else {
      setEditingTerm(null);
      setTermCode("");
      setTermFull("");
      setTermCat("internet");
      setTermEx("");
    }
    setIsTermModalOpen(true);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termCode.trim() || !termFull.trim()) return;

    try {
      if (editingTerm && editingTerm.id) {
        await updateTerm(editingTerm.id, {
          code: termCode.toUpperCase().trim(),
          full: termFull.trim(),
          cat: termCat,
          ex: termEx.trim()
        });
      } else {
        await addTerm({
          code: termCode.toUpperCase().trim(),
          full: termFull.trim(),
          cat: termCat,
          ex: termEx.trim(),
          trending: false
        });
      }
      onRefreshData();
      setIsTermModalOpen(false);
    } catch (err) {
      console.error("Error saving term to Firestore:", err);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this term?")) return;
    try {
      await deleteTerm(id);
      onRefreshData();
    } catch (err) {
      console.error("Error deleting term from Firestore:", err);
    }
  };

  // Blog publishing helper
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogExcerpt.trim() || !blogBody.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      if (editingPost && editingPost.id) {
        await updateBlogPost(editingPost.id, {
          title: blogTitle.trim(),
          excerpt: blogExcerpt.trim(),
          body: blogBody.trim(),
          cat: blogCat,
          seoTitle: blogSeoTitle.trim(),
          metaDescription: blogMetaDescription.trim(),
          keywords: blogKeywords.trim(),
        });
        setEditingPost(null);
      } else {
        await addBlogPost({
          title: blogTitle.trim(),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          excerpt: blogExcerpt.trim(),
          body: blogBody.trim(),
          cat: blogCat,
          seoTitle: blogSeoTitle.trim(),
          metaDescription: blogMetaDescription.trim(),
          keywords: blogKeywords.trim(),
        });
      }
      setBlogTitle("");
      setBlogExcerpt("");
      setBlogBody("");
      setBlogCat("internet");
      setBlogSeoTitle("");
      setBlogMetaDescription("");
      setBlogKeywords("");
      onRefreshData();
    } catch (err) {
      console.error("Error publishing or updating blog post:", err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await deleteBlogPost(id);
      onRefreshData();
    } catch (err) {
      console.error("Error deleting blog post:", err);
    }
  };

  // Ad Slot Toggle helper
  const handleToggleAdSlot = async (slot: AdSlot) => {
    if (!slot.id) return;
    try {
      await updateAdSlotStatus(slot.id, !slot.on);
      onRefreshData();
    } catch (err) {
      console.error("Error toggling ad slot status:", err);
    }
  };

  const handleSaveAdCode = async (id: string, codeStr: string) => {
    try {
      await updateAdSlot(id, { adsenseCode: codeStr.trim() });
      alert("AdSense link/code updated successfully!");
      onRefreshData();
    } catch (err) {
      console.error("Error saving ad slot code:", err);
      alert("Failed to save AdSense code.");
    }
  };

  const handleResetTerms = async () => {
    if (!window.confirm("This will clear the current terms database and seed it with the expanded set of 300 terms (50 terms per category). Would you like to proceed?")) return;
    setIsSeeding(true);
    try {
      await resetTermsDatabase(TERMS);
      alert("Database successfully seeded with 300 expanded slang terms!");
      onRefreshData();
    } catch (err) {
      console.error("Error resetting terms database:", err);
      alert("Failed to re-seed database. Check logs.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleGenerateSitemap = () => {
    try {
      const domain = "https://whatsthatmean.com";
      const dateStr = new Date().toISOString().split("T")[0];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Core routes
      const routes = ["", "/browse", "/quiz", "/blog"];
      routes.forEach(route => {
        xml += `  <url>\n`;
        xml += `    <loc>${domain}${route}</loc>\n`;
        xml += `    <lastmod>${dateStr}</lastmod>\n`;
        xml += `    <changefreq>${route === "" || route === "/blog" ? "daily" : "weekly"}</changefreq>\n`;
        xml += `    <priority>${route === "" ? "1.0" : "0.8"}</priority>\n`;
        xml += `  </url>\n`;
      });
      
      // Blog routes
      blogs.forEach(blog => {
        const slug = (blog.title || "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
        
        xml += `  <url>\n`;
        xml += `    <loc>${domain}/blog/${slug}</loc>\n`;
        xml += `    <lastmod>${dateStr}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      });
      
      xml += `</urlset>\n`;
      
      const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "sitemap.xml");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("sitemap.xml generated and downloaded successfully! Place this file in your website's root public directory to serve it under /sitemap.xml.");
    } catch (err) {
      console.error("Error generating sitemap:", err);
      alert("Failed to generate sitemap.");
    }
  };

  // User Suspension and role change helpers
  const handleToggleUserBan = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert("You cannot suspend your own account!");
      return;
    }
    const newStatus = user.status === "active" ? "banned" : "active";
    try {
      await updateUserProfile(user.uid, { status: newStatus });
      onRefreshData();
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  };

  const handleChangeUserRole = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert("You cannot change your own role!");
      return;
    }
    const roles: ("Admin" | "Editor" | "User")[] = ["User", "Editor", "Admin"];
    const curIndex = roles.indexOf(user.role);
    const nextRole = roles[(curIndex + 1) % roles.length];
    
    if (window.confirm(`Change ${user.name}'s role to ${nextRole}?`)) {
      try {
        await updateUserProfile(user.uid, { role: nextRole });
        onRefreshData();
      } catch (err) {
        console.error("Error updating user role:", err);
      }
    }
  };

  return (
    <div className="admin-shell flex flex-col md:flex-row min-h-[100vh] bg-paper">
      {/* Sidebar Admin Menu */}
      <div className="admin-side w-full md:w-[240px] md:flex-shrink-0 bg-ink text-white p-6 flex flex-col gap-1.5 md:sticky md:top-0 md:h-[100vh]">
        <div className="logo2 font-display font-bold text-lg mb-8 pb-4 border-b border-white/10 text-center md:text-left">
          ⚡ whatsthatmean admin
        </div>

        {[
          { id: "overview", label: "Overview", icon: BarChart },
          { id: "terms", label: "Terms Database", icon: Grid },
          { id: "users", label: "Users & Access", icon: Users },
          { id: "ads", label: "Ad placements", icon: Radio },
          { id: "blog", label: "Blog Publisher", icon: BookOpen }
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`admin-nav-btn w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition flex items-center gap-3 cursor-pointer
                ${activeTab === tab.id
                  ? "bg-indigo text-white"
                  : "text-ink-soft hover:bg-white/5 hover:text-white"
                }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="mt-auto pt-6 border-t border-white/10 text-xs text-ink-soft text-center md:text-left">
          <p>Logged in as admin:</p>
          <p className="font-semibold text-white/90 truncate mt-0.5">{currentUser?.email}</p>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="admin-main flex-1 p-8 md:p-12 overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display font-bold text-3xl text-ink">Overview Dashboard</h2>
              <p className="sub text-sm text-ink-soft mt-1">Snapshot of real-time site activity and Firebase collections.</p>
            </div>

            {/* Stat Cards Grid */}
            <div className="stat-grid grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-5">
              <div className="stat-card bg-card border-1.5 border-line rounded-xl p-6 shadow-sm">
                <div className="label text-xs font-semibold uppercase tracking-wider text-ink-soft">Total users</div>
                <div className="val font-display font-bold text-3xl text-ink mt-2">{users.length}</div>
                <div className="delta text-xs font-semibold text-mint-ink bg-mint/10 px-2 py-0.5 rounded inline-block mt-3">+312 this week</div>
              </div>

              <div className="stat-card bg-card border-1.5 border-line rounded-xl p-6 shadow-sm">
                <div className="label text-xs font-semibold uppercase tracking-wider text-ink-soft">Terms in database</div>
                <div className="val font-display font-bold text-3xl text-ink mt-2">{terms.length}</div>
                <div className="delta text-xs font-semibold text-indigo bg-indigo/10 px-2 py-0.5 rounded inline-block mt-3">Firestore synced</div>
              </div>

              <div className="stat-card bg-card border-1.5 border-line rounded-xl p-6 shadow-sm">
                <div className="label text-xs font-semibold uppercase tracking-wider text-ink-soft">Est. ad revenue (30d)</div>
                <div className="val font-display font-bold text-3xl text-ink mt-2">$1,940</div>
                <div className="delta text-xs font-semibold text-mint-ink bg-mint/10 px-2 py-0.5 rounded inline-block mt-3">+6.4%</div>
              </div>
            </div>

            {/* System Info alert block */}
            <div className="bg-indigo/5 border border-indigo/10 rounded-xl p-5 text-sm text-ink-soft leading-relaxed space-y-2">
              <div className="font-bold text-ink">🚀 Enterprise Firebase Integration active</div>
              <p>Everything you edit here updates Firestore collections in real-time. Slang definitions added by you instantly sync with visitors, allowing real-time decentralized updates!</p>
            </div>

            {/* Database Admin Tools */}
            <div className="bg-card border-1.5 border-line rounded-xl p-6 shadow-sm space-y-4">
              <div className="font-display font-bold text-lg text-ink">Database Administration</div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Add 50 slang terms per category automatically. This will empty the current "terms" collection and import a fresh, highly diverse set of 300 slang terms categorized under Internet, Texting, Social Media, Business, Gaming, and Military.
              </p>
              <button
                onClick={handleResetTerms}
                disabled={isSeeding}
                className="btn btn-solid px-6 py-3 font-semibold text-xs flex items-center gap-2"
              >
                {isSeeding ? "Seeding Database..." : "Force Seed 300 Terms (50 per category)"}
              </button>
            </div>

            {/* Google Search Console Sitemap Generator */}
            <div className="bg-card border-1.5 border-line rounded-xl p-6 shadow-sm space-y-4">
              <div className="font-display font-bold text-lg text-ink">Google Search Console Sitemap Generator</div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Generate a fully populated, standard SEO XML sitemap containing your homepage, browse views, quiz modules, and all <strong>{blogs.length} published blog articles</strong> to maximize your Google indexing score.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleGenerateSitemap}
                  className="btn btn-solid bg-indigo hover:bg-indigo-dark text-white px-5 py-3 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download sitemap.xml</span>
                </button>
                <button
                  onClick={() => {
                    const domain = "https://whatsthatmean.com";
                    const dateStr = new Date().toISOString().split("T")[0];
                    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
                    ["", "/browse", "/quiz", "/blog"].forEach(route => {
                      xml += `  <url>\n    <loc>${domain}${route}</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>${route === "" || route === "/blog" ? "daily" : "weekly"}</changefreq>\n    <priority>${route === "" ? "1.0" : "0.8"}</priority>\n  </url>\n`;
                    });
                    blogs.forEach(blog => {
                      const slug = (blog.title || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
                      xml += `  <url>\n    <loc>${domain}/blog/${slug}</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
                    });
                    xml += `</urlset>\n`;
                    
                    navigator.clipboard.writeText(xml);
                    alert("Sitemap XML copied to clipboard!");
                  }}
                  className="btn btn-ghost border-line text-ink-soft hover:bg-line/40 px-5 py-3 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TERMS DATABASE TAB (Full CRUD!) */}
        {activeTab === "terms" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-3xl text-ink">Manage Terms</h2>
                <p className="sub text-sm text-ink-soft mt-1">Add, modify, and delete slang definitions from the live dictionary.</p>
              </div>
              <button
                onClick={() => handleOpenTermModal(null)}
                className="btn btn-solid flex items-center gap-2 px-5 py-3 shadow-md"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>Add New Term</span>
              </button>
            </div>

            {/* CSV Portability Tools */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-paper/60 border border-line rounded-xl">
              <div className="text-xs text-ink-soft font-semibold font-mono tracking-wider">
                CSV PORTABILITY CONTROLS
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="btn border border-line hover:bg-paper font-semibold text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer bg-card transition"
                  title="Export live terms list as a CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                
                <label className="btn border border-line hover:bg-paper font-semibold text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer bg-card transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Terms List Table */}
            <div className="bg-card border-1.5 border-line rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-paper border-b-1.5 border-line">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft w-28">Abbr</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft w-48">Meaning</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft w-32">Category</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft hidden md:table-cell">Example Usage</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {terms.map((t) => {
                    const catMeta = CATEGORIES.find((c) => c.id === t.cat) || CATEGORIES[0];
                    return (
                      <tr key={t.id || t.code} className="hover:bg-paper/40 transition">
                        <td className="p-4 font-mono font-bold text-indigo">{t.code}</td>
                        <td className="p-4 text-sm font-semibold text-ink truncate max-w-xs">{t.full}</td>
                        <td className="p-4">
                          <span className={`tag ${catMeta.tag} text-[9px] font-bold px-2 py-1 rounded-full`}>
                            {catMeta.name}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-ink-soft hidden md:table-cell truncate max-w-sm">
                          "{t.ex}"
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenTermModal(t)}
                              className="p-2 hover:bg-indigo/10 text-indigo rounded-lg transition"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => t.id && handleDeleteTerm(t.id)}
                              className="p-2 hover:bg-coral/10 text-coral rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-3xl text-ink">Manage Users</h2>
              <p className="sub text-sm text-ink-soft mt-1">Control user ranks, assign moderators/editors, and ban malicious accounts.</p>
            </div>

            {/* Users Table */}
            <div className="bg-card border-1.5 border-line rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-paper border-b-1.5 border-line">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">User</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Email</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Role</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Joined</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft text-right w-44">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-paper/40 transition">
                      <td className="p-4 font-semibold text-ink">{u.name}</td>
                      <td className="p-4 text-sm text-ink-soft">{u.email}</td>
                      <td className="p-4 text-xs">
                        <span className="font-mono bg-indigo/5 text-indigo font-bold px-2 py-1 rounded border border-indigo/10">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`status-pill px-2.5 py-1 text-xs font-bold rounded-full
                          ${u.status === "active" 
                            ? "bg-mint/10 text-mint-ink border border-mint/15" 
                            : "bg-coral/10 text-coral-ink border border-coral/15"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-ink-soft">{u.joined}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleChangeUserRole(u)}
                            className="btn btn-ghost btn-sm font-semibold"
                            title="Cycle rank User -> Editor -> Admin"
                          >
                            Cycle Rank
                          </button>
                          <button
                            onClick={() => handleToggleUserBan(u)}
                            className={`btn btn-sm font-semibold 
                              ${u.status === "active" 
                                ? "border-coral text-coral hover:bg-coral hover:text-white" 
                                : "border-mint text-mint hover:bg-mint hover:text-white"
                              }`}
                          >
                            {u.status === "active" ? "Suspend" : "Reinstate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADS PLACEMENT TAB */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-3xl text-ink">Ad placements</h2>
              <p className="sub text-sm text-ink-soft mt-1">Configure active banner containers, sizes, and provider networks.</p>
            </div>

            <div className="space-y-4">
              {adSlots.map((slot) => (
                <div key={slot.id || slot.name} className="admin-card bg-card border-1.5 border-line rounded-xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="name font-display font-bold text-base text-ink">{slot.name}</div>
                      <div className="desc text-xs text-ink-soft">
                        {slot.desc} — provider: <span className="font-mono text-[11px] font-bold bg-paper px-1.5 py-0.5 rounded text-indigo">{slot.network}</span>
                      </div>
                    </div>
                    {/* Toggle Slider */}
                    <button
                      onClick={() => handleToggleAdSlot(slot)}
                      className={`toggle w-11 h-6 rounded-full relative transition cursor-pointer flex-shrink-0
                        ${slot.on ? "bg-indigo" : "bg-line"}`}
                    >
                      <span className={`knob w-4 h-4 rounded-full bg-white absolute top-1 transition-all
                        ${slot.on ? "left-6" : "left-1"}`}
                      />
                    </button>
                  </div>

                  {/* AdSense Link/Code Input Field */}
                  <div className="pt-3 border-t border-line/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink-soft uppercase tracking-wider font-mono">
                        AdSense Script Code / Affiliate Link
                      </label>
                      {slot.adsenseCode && (
                        <span className="text-[10px] font-semibold text-mint-ink bg-mint/10 px-2 py-0.5 rounded border border-mint/15">
                          Active Code Saved
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                      <textarea
                        value={adCodes[slot.id || ""] || ""}
                        onChange={(e) => setAdCodes(prev => ({ ...prev, [slot.id || ""]: e.target.value }))}
                        placeholder="e.g. <script async src='https://pagead2.googlesyndication.com...'></script> or affiliate URL"
                        rows={3}
                        className="flex-1 border border-line rounded-lg p-3 text-xs bg-paper text-ink focus:outline-none focus:border-indigo font-mono resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveAdCode(slot.id || "", adCodes[slot.id || ""] || "")}
                        className="btn btn-solid sm:self-end py-3 px-5 text-xs font-bold flex-shrink-0 flex items-center justify-center"
                      >
                        Save Code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-paper p-4 rounded-lg border border-line text-xs text-ink-soft max-w-2xl leading-relaxed">
              💡 <strong>Integrates with live AdSense:</strong> Turning placements on or off instantly adds/removes dummy frame placeholders on the site in real-time, matching standard production containers.
            </div>
          </div>
        )}

        {/* BLOG TAB */}
        {activeTab === "blog" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-3xl text-ink">Blog Publishing Centre</h2>
              <p className="sub text-sm text-ink-soft mt-1">Write new feature articles or delete old ones from the blog list.</p>
            </div>

            <div className="admin-two-col grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Publisher Form (Left) */}
              <div id="blog-publisher-form" className={`admin-card bg-card border-1.5 rounded-xl p-6 shadow-sm lg:col-span-7 space-y-4 transition-all duration-300
                ${editingPost ? "border-indigo shadow-md ring-1 ring-indigo/20 bg-indigo/5" : "border-line"}`}>
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="font-display font-bold text-lg text-ink">
                    {editingPost ? (
                      <span className="text-indigo flex items-center gap-1.5">
                        <Edit3 className="w-5 h-5 animate-pulse" />
                        Edit Article
                      </span>
                    ) : (
                      "Publish a new post"
                    )}
                  </div>
                  {editingPost && (
                    <button
                      type="button"
                      onClick={handleCancelEditPost}
                      className="text-xs font-bold text-coral hover:text-coral-dark flex items-center gap-1 transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <form onSubmit={handlePublishPost} className="space-y-4">
                  <div className="field flex flex-col">
                    <label className="text-xs font-semibold text-ink-soft mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 texting abbreviations you should know"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      required
                      className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                    />
                  </div>

                  <div className="field flex flex-col">
                    <label className="text-xs font-semibold text-ink-soft mb-1">Category</label>
                    <select
                      value={blogCat}
                      onChange={(e) => setBlogCat(e.target.value)}
                      className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field flex flex-col">
                    <label className="text-xs font-semibold text-ink-soft mb-1">Excerpt</label>
                    <textarea
                      placeholder="One or two sentences summarizing the post."
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      required
                      rows={2}
                      className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo resize-none"
                    />
                  </div>

                  <div className="field flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-ink-soft">Body Content</label>
                      <button
                        type="button"
                        onClick={handleInsertSampleTemplate}
                        className="text-[11px] font-bold text-indigo hover:text-indigo-dark flex items-center gap-1 cursor-pointer"
                        title="Load a complete, beautifully designed sample article with links and imagery"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Load Rich Template</span>
                      </button>
                    </div>

                    {/* "Add Media" row on top of the toolbar */}
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => handleInsertMarkup("image")}
                        className="px-3 py-1.5 text-xs font-bold border border-indigo/40 text-indigo rounded bg-white hover:bg-indigo/5 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Add Media</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertMarkup("ad")}
                        className="px-3 py-1.5 text-xs font-bold border border-mint/40 text-mint-ink rounded bg-white hover:bg-mint/5 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Insert Google Ad Slot placeholder at current cursor position"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Insert Ad Code</span>
                      </button>
                      <button
                        type="button"
                        className="text-ink-soft hover:text-ink cursor-help p-1"
                        title="Help: Use the formatting toolbar to design heading blocks, numbered lists, blockquotes, inline links, and images."
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Rich Editor Toolbar */}
                    <div className="flex flex-wrap items-center justify-between border border-line bg-paper/50 rounded-t-xl px-3 py-2 gap-2 border-b-0">
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Heading selector dropdown */}
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "h1") handleInsertMarkup("h1");
                            else if (val === "h2") handleInsertMarkup("h2");
                            else if (val === "h3") handleInsertMarkup("h3");
                            else if (val === "p") handleInsertMarkup("p");
                            e.target.value = ""; // reset dropdown selection
                          }}
                          defaultValue=""
                          className="border border-line rounded px-2.5 py-1 text-xs bg-paper text-ink focus:outline-none focus:border-indigo mr-1 font-semibold"
                          title="Format Block Type"
                        >
                          <option value="" disabled>Format...</option>
                          <option value="p">Paragraph</option>
                          <option value="h1">Heading 1</option>
                          <option value="h2">Heading 2</option>
                          <option value="h3">Heading 3</option>
                        </select>

                        <div className="w-px h-5 bg-line mx-1" />

                        <button
                          type="button"
                          onClick={() => handleInsertMarkup("bold")}
                          className="p-1.5 rounded hover:bg-line text-ink-soft hover:text-ink transition flex items-center justify-center cursor-pointer"
                          title="Bold Text (**text**)"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertMarkup("italic")}
                          className="p-1.5 rounded hover:bg-line text-ink-soft hover:text-ink transition flex items-center justify-center cursor-pointer"
                          title="Italic Text (*text*)"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        
                        <div className="w-px h-5 bg-line mx-1" />

                        <button
                          type="button"
                          onClick={() => handleInsertMarkup("list")}
                          className="p-1.5 rounded hover:bg-line text-ink-soft hover:text-ink transition flex items-center justify-center cursor-pointer"
                          title="Bullet List (- item)"
                        >
                          <List className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertMarkup("numlist")}
                          className="p-1.5 rounded hover:bg-line text-ink-soft hover:text-ink transition flex items-center justify-center cursor-pointer"
                          title="Numbered List (1. item)"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInsertMarkup("quote")}
                          className="p-1.5 rounded hover:bg-line text-ink-soft hover:text-ink transition flex items-center justify-center cursor-pointer"
                          title="Blockquote (> Quote)"
                        >
                          <Quote className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-line mx-1" />

                        {/* Link inserter */}
                        <button
                          type="button"
                          onClick={() => handleInsertMarkup("link")}
                          className="p-1.5 bg-indigo/5 text-indigo border border-indigo/10 rounded hover:bg-indigo hover:text-white transition flex items-center gap-1 text-xs font-bold px-2 cursor-pointer"
                          title="Insert Web Hyperlink [label](url)"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Link</span>
                        </button>
                      </div>

                      {/* Live Preview Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer
                          ${showPreview 
                            ? "bg-indigo text-white border-indigo" 
                            : "bg-card text-ink-soft border-line hover:bg-line/30"
                          }`}
                        title="Toggle Live Rich-Text Preview"
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Edit Code</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Live Preview</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Textarea or live preview block */}
                    {showPreview ? (
                      <div className="border border-line rounded-b-xl p-4 bg-paper/30 min-h-[150px] max-h-[350px] overflow-y-auto font-sans leading-relaxed text-left">
                        {blogBody ? (
                          renderBlogPostContent(blogBody, adSlots)
                        ) : (
                          <div className="text-center text-xs text-ink-soft py-10">
                            No content written yet. Type some text or click "Load Rich Template" to see the preview.
                          </div>
                        )}
                      </div>
                    ) : (
                      <textarea
                        ref={bodyRef}
                        placeholder="Write the full body here... Use heading format selection, bullet lists, blockquotes, or enter custom [AD] tags where you want adsense slots!"
                        value={blogBody}
                        onChange={(e) => setBlogBody(e.target.value)}
                        required={!showPreview}
                        rows={8}
                        className="border border-line rounded-b-xl p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo resize-y w-full font-mono leading-relaxed"
                      />
                    )}
                  </div>

                  {/* SEO Optimization Section */}
                  <div className="pt-4 border-t border-line/60 space-y-4">
                    <div className="font-display font-semibold text-xs text-ink-soft uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>🔍</span> <span>SEO Optimization</span>
                    </div>
                    
                    <div className="field flex flex-col">
                      <label className="text-xs font-semibold text-ink-soft mb-1">SEO Title Override</label>
                      <input
                        type="text"
                        placeholder="e.g. Master Internet Slang | whatsthatmean Guide"
                        value={blogSeoTitle}
                        onChange={(e) => setBlogSeoTitle(e.target.value)}
                        className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                      />
                    </div>

                    <div className="field flex flex-col">
                      <label className="text-xs font-semibold text-ink-soft mb-1">Meta Description</label>
                      <textarea
                        placeholder="Search engines show this snippet. Keep under 160 characters for best Google results."
                        value={blogMetaDescription}
                        onChange={(e) => setBlogMetaDescription(e.target.value)}
                        rows={2}
                        className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo resize-none"
                      />
                    </div>

                    <div className="field flex flex-col">
                      <label className="text-xs font-semibold text-ink-soft mb-1">SEO Keywords (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. internet slang, Gen Z texting, LOL meaning"
                        value={blogKeywords}
                        onChange={(e) => setBlogKeywords(e.target.value)}
                        className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {editingPost && (
                      <button
                        type="button"
                        onClick={handleCancelEditPost}
                        className="btn btn-ghost border-line text-ink-soft hover:bg-line/40 py-3 font-display font-bold flex-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn btn-solid font-display font-bold p-3 flex-1">
                      {editingPost ? "Update Publication" : "Publish Post"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Published Articles List (Right) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="font-display font-bold text-lg text-ink">Existing publications ({blogs.length})</div>
                
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {blogs.map((p) => {
                    const postCategory = CATEGORIES.find(c => c.id === p.cat) || CATEGORIES.find(c => c.id === 'internet');
                    return (
                      <div key={p.id || p.title} className="admin-card bg-card border-1.5 border-line rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="font-display font-bold text-base text-ink line-clamp-1">{p.title}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[11px] font-semibold text-ink-soft">{p.date}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo/5 text-indigo border border-indigo/10">
                              {postCategory?.name || "Internet & chat"}
                            </span>
                          </div>
                          <p className="text-xs text-ink-soft mt-2 line-clamp-2">{p.excerpt}</p>
                        </div>
                        <div className="flex gap-2.5 mt-2.5">
                          <button
                            onClick={() => handleStartEditPost(p)}
                            className="btn btn-ghost btn-sm font-semibold border-indigo text-indigo hover:bg-indigo hover:text-white py-1.5 flex items-center justify-center gap-1.5 flex-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => p.id && handleDeletePost(p.id)}
                            className="btn btn-ghost btn-sm font-semibold border-coral text-coral hover:bg-coral hover:text-white py-1.5 flex items-center justify-center gap-1.5 flex-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FOR ADDING/EDITING TERMS */}
      {isTermModalOpen && (
        <div className="overlay">
          <div className="modal relative max-w-md w-full bg-card p-8 rounded-2xl border border-line shadow-lg">
            <button
              onClick={() => setIsTermModalOpen(false)}
              className="absolute top-4 right-4 text-ink-soft hover:text-ink text-2xl transition"
            >
              &times;
            </button>

            <h3 className="font-display text-2xl font-bold mb-1">
              {editingTerm ? "Edit Slang Term" : "Add New Term"}
            </h3>
            <p className="text-xs text-ink-soft mb-6">
              Write abbreviation code, meanings, category and live examples.
            </p>

            <form onSubmit={handleSaveTerm} className="space-y-4">
              <div className="field flex flex-col">
                <label className="text-xs font-semibold text-ink-soft mb-1">Slang Abbreviation (Code)</label>
                <input
                  type="text"
                  placeholder="e.g. YOLO, IYKYK"
                  value={termCode}
                  onChange={(e) => setTermCode(e.target.value)}
                  required
                  disabled={!!editingTerm}
                  className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo disabled:opacity-50 font-mono font-bold"
                />
              </div>

              <div className="field flex flex-col">
                <label className="text-xs font-semibold text-ink-soft mb-1">Full Meaning</label>
                <input
                  type="text"
                  placeholder="e.g. You only live once"
                  value={termFull}
                  onChange={(e) => setTermFull(e.target.value)}
                  required
                  className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                />
              </div>

              <div className="field flex flex-col">
                <label className="text-xs font-semibold text-ink-soft mb-1">Category</label>
                <select
                  value={termCat}
                  onChange={(e) => setTermCat(e.target.value)}
                  className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field flex flex-col">
                <label className="text-xs font-semibold text-ink-soft mb-1">Example Usage</label>
                <textarea
                  placeholder="e.g. Just jumped off the bridge, YOLO!"
                  value={termEx}
                  onChange={(e) => setTermEx(e.target.value)}
                  required
                  rows={2}
                  className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo resize-none"
                />
              </div>

              <div className="modal-actions flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTermModalOpen(false)}
                  className="btn btn-ghost flex-1 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-solid flex-1 font-semibold"
                >
                  {editingTerm ? "Save Changes" : "Create Term"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
