import React, { useState, useEffect } from "react";
import { Term, BlogPost, AdSlot, UserProfile } from "../types";
import { CATEGORIES, TERMS } from "../data/seedData";
import { CURATED_IMAGES, CuratedImage } from "../data/imagePool";
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
  updateUserProfile,
  deleteUserProfile,
  getSiteSettings,
  updateSiteSettings
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
  Sparkles,
  Globe,
  FileText,
  Check,
  Search,
  Smile,
  X,
  RefreshCw,
  Calendar,
  Clock
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

type AdminTab = "overview" | "terms" | "emojis" | "users" | "ads" | "blog";

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
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCat, setBlogCat] = useState("internet");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogBody, setBlogBody] = useState("");
  const [blogSeoTitle, setBlogSeoTitle] = useState("");
  const [blogMetaDescription, setBlogMetaDescription] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [blogImageUrl, setBlogImageUrl] = useState("");
  const [blogImageAlt, setBlogImageAlt] = useState("");
  const [blogDraft, setBlogDraft] = useState(false);
  const [aiKeyword, setAiKeyword] = useState("");
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Recommended Keywords state
  const [recommendedKeywords, setRecommendedKeywords] = useState<string[]>([]);

  // AI Image Picker Modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalSearch, setImageModalSearch] = useState("");
  const [imageModalTab, setImageModalTab] = useState("AI-Matched (추천)");
  const [shuffleSeed, setShuffleSeed] = useState(0.5);

  // Live Unsplash Search states
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [unsplashSearchResults, setUnsplashSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState("");

  const handleShuffleModalPool = () => {
    setShuffleSeed(Math.random());
  };

  // Debounced real-time Unsplash search from Express server proxy
  useEffect(() => {
    if (!isImageModalOpen) return;
    
    const query = imageModalSearch.trim();
    if (query === "") {
      setUnsplashSearchResults([]);
      setSearchError("");
      return;
    }

    setIsSearchingUnsplash(true);
    setSearchError("");

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search-unsplash?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error("이미지 검색에 실패했습니다.");
        }
        const data = await response.json();
        if (data.results) {
          setUnsplashSearchResults(data.results);
        } else if (data.error) {
          setSearchError(data.error);
        }
      } catch (err: any) {
        console.error("Unsplash search error:", err);
        setSearchError("이미지 검색 중 오류가 발생했습니다.");
      } finally {
        setIsSearchingUnsplash(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [imageModalSearch, isImageModalOpen]);

  // Filter and shuffle pool images for display in the picker
  const displayImages = React.useMemo(() => {
    // If the search query is active, prioritize combining local matches and Unsplash search results
    if (imageModalSearch.trim() !== "") {
      const query = imageModalSearch.toLowerCase().trim();
      
      // Get any local matches first
      const localMatches = CURATED_IMAGES.filter(img => 
        img.alt.toLowerCase().includes(query) ||
        img.category.toLowerCase().includes(query) ||
        img.keywords.some(k => k.toLowerCase().includes(query))
      );

      const seenUrls = new Set(localMatches.map(img => img.url));
      const combined = [...localMatches];

      // Add live Unsplash search results next
      unsplashSearchResults.forEach(img => {
        if (!seenUrls.has(img.url)) {
          combined.push({
            id: img.id,
            url: img.url,
            alt: img.alt,
            category: "Unsplash",
            keywords: [query]
          });
        }
      });

      return combined;
    }

    let list = [...CURATED_IMAGES];

    if (imageModalTab === "AI-Matched (추천)") {
      // Find keywords from blog text
      const searchStr = `${blogTitle} ${blogExcerpt} ${blogBody} ${blogKeywords} ${blogCat}`.toLowerCase();
      // Score each image based on matching keywords
      const scored = list.map(img => {
        let score = 0;
        img.keywords.forEach(k => {
          if (searchStr.includes(k.toLowerCase())) {
            score += 1;
          }
        });
        // Boost slightly if category matches blog category
        if (blogCat && img.category.toLowerCase().includes(blogCat.toLowerCase())) {
          score += 1.5;
        }
        return { img, score };
      });
      // Filter out scored = 0, sort by score descending
      const matched = scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score);
      
      if (matched.length > 0) {
        list = matched.map(item => item.img);
      } else {
        // Fallback to all if no match
        list = [...CURATED_IMAGES];
      }
    } else if (imageModalTab !== "All") {
      list = list.filter(img => img.category === imageModalTab);
    }

    // Shuffle using the seed deterministically
    return [...list].sort((a, b) => {
      const hashA = Math.sin(a.url.length * 12.34 + shuffleSeed * 1000);
      const hashB = Math.sin(b.url.length * 12.34 + shuffleSeed * 1000);
      return hashA - hashB;
    });
  }, [imageModalSearch, imageModalTab, shuffleSeed, blogTitle, blogExcerpt, blogBody, blogKeywords, blogCat, unsplashSearchResults]);

  const handleShuffleKeywords = React.useCallback(() => {
    // A rich curated list of hottest global/worldwide trending topics across Tech, Pop-Culture, Memes, Work, and Lifestyle
    const globalHotTrends = [
      "AI Agents", "DeepSeek", "ChatGPT-5", "Sora Video AI", "Vision Pro", "AGI", "SpaceX Mars",
      "GTA 6", "Elden Ring DLC", "LoL Worlds", "NewJeans", "Blackpink", "Squid Game 2",
      "Rizz", "Sigma Meme", "Brain Rot", "Skibidi", "TikTok Trend", "Doomscrolling", "FOMO",
      "YOLO", "갓생", "오운완", "중꺾마", "티라미수케익", "뇌절", "어쩔티비", "킹받네", "디토 감성",
      "Quiet Quitting", "Side Hustle", "Gig Economy", "Workation", "Burnout Syndrome", "FIRE Movement",
      "ESG Management", "Carbon Neutrality", "Creator Economy", "No-Code Development", "SaaS Growth"
    ];

    const localTrendingCodes = (terms || []).filter(t => t.trending).map(t => t.code);
    const localAllCodes = (terms || []).map(t => t.code);

    // Merge everything into a unique uppercase set of tags/keywords
    const combinedPool = Array.from(new Set([
      ...localTrendingCodes,
      ...globalHotTrends,
      ...localAllCodes
    ])).filter(Boolean);

    // Random shuffle
    const shuffled = [...combinedPool].sort(() => 0.5 - Math.random());
    // Take exactly 10
    const selected = shuffled.slice(0, 10);
    setRecommendedKeywords(selected);
  }, [terms]);

  useEffect(() => {
    if (terms && terms.length > 0 && recommendedKeywords.length === 0) {
      handleShuffleKeywords();
    }
  }, [terms, recommendedKeywords.length, handleShuffleKeywords]);

  const handleAutoFillImage = () => {
    setImageModalTab("AI-Matched (추천)");
    setImageModalSearch("");
    setShuffleSeed(Math.random()); // Auto-shuffle on every trigger
    setIsImageModalOpen(true);
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(blogs.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [blogs.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBlogs = blogs.slice(startIndex, startIndex + itemsPerPage);

  // Link Insertion Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalLabel, setLinkModalLabel] = useState("");
  const [linkModalType, setLinkModalType] = useState<"internal" | "external">("internal");
  const [linkModalUrl, setLinkModalUrl] = useState("");
  const [linkModalInternalType, setLinkModalInternalType] = useState<"route" | "term" | "blog">("term");
  const [linkModalSelectedRoute, setLinkModalSelectedRoute] = useState("/");
  const [linkModalSearchQuery, setLinkModalSearchQuery] = useState("");
  const [textareaSelection, setTextareaSelection] = useState<{ start: number; end: number } | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInsertLinkSubmit = (label: string, url: string) => {
    const textarea = bodyRef.current;
    if (!textarea || !textareaSelection) return;

    const { start, end } = textareaSelection;
    const text = textarea.value;

    const finalLabel = label.trim() || "Link";
    const replacement = `[${finalLabel}](${url})`;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setBlogBody(newValue);
    setIsLinkModalOpen(false);

    // Re-focus and restore cursor selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

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
      // Open our rich Link Insertion Modal instead of raw prompts!
      setLinkModalLabel(selectedText || "");
      setLinkModalType("internal"); // default to internal
      setLinkModalUrl("https://");
      setLinkModalSearchQuery(selectedText || ""); // pre-fill search with selected text
      setLinkModalInternalType("term");
      setLinkModalSelectedRoute("/");
      setTextareaSelection({ start, end });
      setIsLinkModalOpen(true);
      return; // Do not insert yet, we will insert when the modal form is submitted!
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
    setBlogImageUrl(post.imageUrl || "");
    setBlogImageAlt(post.imageAlt || "");
    setBlogDraft(post.draft || false);
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
    setBlogImageUrl("");
    setBlogImageAlt("");
    setBlogDraft(false);
    setShowPreview(false);
  };

  // State for Ad slots inputs & db seeding tools
  const [adCodes, setAdCodes] = useState<Record<string, string>>({});
  const [isSeeding, setIsSeeding] = useState(false);
  const [googleSiteVerification, setGoogleSiteVerification] = useState("");
  const [savingVerification, setSavingVerification] = useState(false);
  const [isApplyingSitemap, setIsApplyingSitemap] = useState(false);

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

  // Emoji CSV Export helper
  const handleExportEmojiCSV = () => {
    const emojis = terms.filter(t => t.cat === "emoji");
    if (emojis.length === 0) {
      alert("No emojis available to export.");
      return;
    }

    const headers = ["Emoji", "Meaning", "Example Usage"];
    const rows = emojis.map(t => [
      t.code,
      t.full,
      t.ex
    ]);

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
    link.setAttribute("download", `whatsthatmean_Emoji_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Emoji CSV Import helper
  const handleImportEmojiCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        let startIndex = 0;
        const firstRow = parsed[0];
        if (
          firstRow &&
          (firstRow[0]?.toLowerCase().includes("emoji") ||
            firstRow[1]?.toLowerCase().includes("mean") ||
            firstRow[2]?.toLowerCase().includes("ex"))
        ) {
          startIndex = 1;
        }

        const validRows = parsed.slice(startIndex).filter(row => row.length >= 2 && row[0] && row[1]);

        if (validRows.length === 0) {
          alert("No valid emoji rows found. Format must be: Emoji, Meaning, Example Usage");
          return;
        }

        const mode = window.confirm(
          `Found ${validRows.length} emojis in CSV.\n\nClick [OK] to APPEND these to the current emoji database.\nClick [Cancel] to cancel.`
        );

        if (!mode) return;

        setIsSeeding(true);

        const emojisToUpload = validRows.map(row => {
          const code = row[0].trim();
          const full = row[1].trim();
          const ex = row[2] ? row[2].trim() : `Usage of ${code}`;
          
          return {
            code,
            full,
            cat: "emoji",
            ex,
            trending: false
          };
        });

        let count = 0;
        for (const em of emojisToUpload) {
          await addTerm(em);
          count++;
        }
        alert(`Successfully appended ${count} emojis from CSV!`);
        onRefreshData();
      } catch (err: any) {
        console.error("Error importing Emoji CSV:", err);
        alert(`Failed to import Emoji CSV: ${err.message || err}`);
      } finally {
        setIsSeeding(false);
        e.target.value = "";
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

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSiteSettings();
      if (settings.googleSiteVerification) {
        setGoogleSiteVerification(settings.googleSiteVerification);
      }
    };
    loadSettings();
  }, []);

  const handleSaveVerification = async () => {
    setSavingVerification(true);
    try {
      await updateSiteSettings({ googleSiteVerification: googleSiteVerification.trim() });
      alert("Google Search Console verification code saved successfully! It is now dynamically injected into the website header in real-time.");
    } catch (err: any) {
      console.error("Error saving site settings:", err);
      alert("Failed to save verification settings.");
    } finally {
      setSavingVerification(false);
    }
  };

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
      const codeValue = termCat === "emoji" ? termCode.trim() : termCode.toUpperCase().trim();
      if (editingTerm && editingTerm.id) {
        await updateTerm(editingTerm.id, {
          code: codeValue,
          full: termFull.trim(),
          cat: termCat,
          ex: termEx.trim()
        });
      } else {
        await addTerm({
          code: codeValue,
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
          imageUrl: blogImageUrl.trim(),
          imageAlt: blogImageAlt.trim(),
          draft: blogDraft,
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
          imageUrl: blogImageUrl.trim(),
          imageAlt: blogImageAlt.trim(),
          draft: blogDraft,
        });
      }
      setBlogTitle("");
      setBlogExcerpt("");
      setBlogBody("");
      setBlogCat("internet");
      setBlogSeoTitle("");
      setBlogMetaDescription("");
      setBlogKeywords("");
      setBlogImageUrl("");
      setBlogImageAlt("");
      setBlogDraft(false);
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

  const handleGenerateArticle = async () => {
    if (!aiKeyword.trim()) {
      alert("Please enter a keyword for article generation.");
      return;
    }
    setGeneratingArticle(true);
    try {
      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: aiKeyword.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate article");
      }

      const data = await response.json();
      
      // Pre-fill fields and set to Draft
      setBlogTitle(data.title || "");
      setBlogExcerpt(data.excerpt || "");
      setBlogBody(data.body || "");
      setBlogSeoTitle(data.seoTitle || "");
      setBlogMetaDescription(data.metaDescription || "");
      setBlogKeywords(data.keywords || "");
      setBlogImageUrl(data.imageUrl || "");
      setBlogImageAlt(data.imageAlt || "");
      setBlogDraft(true);
      setAiKeyword("");
      
      const formElement = document.getElementById("blog-publisher-form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
      
      alert("Article successfully generated by Gemini AI and loaded into the publisher form below as a Draft! Please review, edit if necessary, and click publish.");
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      alert(`AI Article Generation failed: ${err.message || err}`);
    } finally {
      setGeneratingArticle(false);
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

  const generateSitemapXmlContent = () => {
    const domain = "https://whatsthatmean.com";
    const dateStr = new Date().toISOString().split("T")[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // 1. Core routes
    const routes = ["", "/browse", "/quiz", "/blog"];
    routes.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}${route}</loc>\n`;
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>${route === "" || route === "/blog" ? "daily" : "weekly"}</changefreq>\n`;
      xml += `    <priority>${route === "" ? "1.0" : "0.8"}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Emoji Category page (special primary tab)
    xml += `  <url>\n`;
    xml += `    <loc>${domain}/emoji</loc>\n`;
    xml += `    <lastmod>${dateStr}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    // 3. Other specific dictionary category pages
    const categories = ["internet", "texting", "social", "business", "gaming", "military", "sports", "companies", "countries", "cities"];
    categories.forEach(cat => {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/browse/${cat}</loc>\n`;
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // 4. Blog routes (excluding drafts)
    blogs.forEach((blog) => {
      if (blog.draft) return;
      
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

    // 5. Slang terms and Emoji detail pages
    terms.forEach((term) => {
      if (!term.code) return;
      
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/term/${encodeURIComponent(term.code.toUpperCase().trim())}</loc>\n`;
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });
    
    xml += `</urlset>\n`;
    return xml;
  };

  const handleGenerateSitemap = () => {
    try {
      const xml = generateSitemapXmlContent();
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

  const handleCopyRawXml = () => {
    try {
      const xml = generateSitemapXmlContent();
      navigator.clipboard.writeText(xml);
      alert("Raw XML content copied to clipboard!");
    } catch (err) {
      console.error("Error copying raw sitemap:", err);
      alert("Failed to copy raw sitemap.");
    }
  };

  const handleApplySitemapChanges = async () => {
    if (!window.confirm("기존 sitemap.xml 파일을 최신 데이터로 덮어쓰고 서버에 저장하시겠습니까?\n(public/sitemap.xml 및 dist/sitemap.xml에 즉시 저장되어 배포/커밋 시 자동으로 반영됩니다.)")) return;
    
    setIsApplyingSitemap(true);
    try {
      const response = await fetch("/api/sitemap/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to apply sitemap changes");
      }

      alert("성공: sitemap.xml 파일이 최신 데이터로 변경 적용되었습니다! (public/sitemap.xml 및 dist/sitemap.xml 저장 완료)");
    } catch (err: any) {
      console.error("Error applying sitemap changes:", err);
      alert(`오류: 사이트맵 변경 적용에 실패했습니다. (${err.message || err})`);
    } finally {
      setIsApplyingSitemap(false);
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

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert("You cannot delete your own account!");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user ${user.name || user.email}? This action is irreversible.`)) return;
    try {
      await deleteUserProfile(user.uid);
      onRefreshData();
    } catch (err) {
      console.error("Error deleting user profile:", err);
    }
  };

  return (
    <div className="admin-shell flex flex-col md:flex-row min-h-[100vh] bg-paper">
      {/* Sidebar Admin Menu */}
      <div className="admin-side w-full md:w-[240px] md:flex-shrink-0 bg-ink text-white p-4 md:p-6 flex flex-col gap-3 md:gap-1.5 md:sticky md:top-0 md:h-[100vh]">
        <div className="logo2 font-display font-bold text-base md:text-lg mb-3 md:mb-8 pb-2 md:pb-4 border-b border-white/10 text-center md:text-left">
          ⚡ whatsthatmean admin
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-1.5 w-full">
          {[
            { id: "overview", label: "Overview", icon: BarChart },
            { id: "terms", label: "Terms Database", icon: Grid },
            { id: "emojis", label: "Emoji Database", icon: Smile },
            { id: "users", label: "Users & Access", icon: Users },
            { id: "ads", label: "Ad placements", icon: Radio },
            { id: "blog", label: "Blog Publisher", icon: BookOpen }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`admin-nav-btn w-full text-left py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 md:gap-3 cursor-pointer
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
        </div>

        <div className="hidden md:block mt-auto pt-6 border-t border-white/10 text-xs text-ink-soft text-center md:text-left">
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



            {/* Google Search Console & Dynamic Sitemap Suite */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Sitemap card */}
              <div className="bg-card border-1.5 border-line rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald/10 text-emerald rounded-lg">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-display font-bold text-lg text-ink">Dynamic SEO XML Sitemap</div>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  이제 sitemap.xml을 수동으로 다운로드하고 업로드하실 필요가 없습니다! 블로그 글을 발행하거나 삭제할 때마다 실시간으로 반영되는 <strong>실시간 동적 Sitemap</strong> 기능이 서버에 적용되었습니다.
                </p>
                <div className="bg-paper p-3.5 rounded-lg border border-line text-xs font-mono break-all flex justify-between items-center gap-2 text-ink">
                  <span>https://whatsthatmean.com/sitemap.xml</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://whatsthatmean.com/sitemap.xml");
                      alert("Sitemap URL copied to clipboard!");
                    }}
                    className="text-[10px] font-sans font-bold text-indigo hover:text-indigo-dark whitespace-nowrap cursor-pointer underline"
                  >
                    Copy URL
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-solid bg-indigo hover:bg-indigo-dark text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Open Live Sitemap</span>
                    <span>↗</span>
                  </a>
                  <button
                    onClick={handleCopyRawXml}
                    className="btn btn-ghost border border-line text-ink-soft hover:bg-line/40 px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-card"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Copy Raw XML</span>
                  </button>
                  <button
                    onClick={handleGenerateSitemap}
                    className="btn btn-ghost border border-line text-ink-soft hover:bg-line/40 px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-card"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download XML</span>
                  </button>
                  <button
                    onClick={handleApplySitemapChanges}
                    disabled={isApplyingSitemap}
                    className="btn btn-solid bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isApplyingSitemap ? "animate-spin" : ""}`} />
                    <span>{isApplyingSitemap ? "적용 중..." : "Sitemap 변경 적용 (서버 저장)"}</span>
                  </button>
                </div>
              </div>

              {/* Google Search Console Verification Manager */}
              <div className="bg-card border-1.5 border-line rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo/10 text-indigo rounded-lg">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="font-display font-bold text-lg text-ink">Google Search Console Verification</div>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Google Search Console에 소유권을 간편하게 인증하세요. GSC에서 제공하는 <strong>HTML 태그 (meta name="google-site-verification" content="코드")</strong>의 <span className="underline font-semibold">콘텐츠 코드 값만</span> 아래 입력해 주시면 사이트 헤더에 실시간으로 반영됩니다.
                </p>
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-ink-soft uppercase font-mono">Verification Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="예: google-site-verification-123456789"
                        value={googleSiteVerification}
                        onChange={(e) => setGoogleSiteVerification(e.target.value)}
                        className="flex-1 border border-line rounded-lg px-3 py-2 text-xs bg-paper text-ink focus:outline-none focus:border-indigo font-mono"
                        disabled={savingVerification}
                      />
                      <button
                        onClick={handleSaveVerification}
                        disabled={savingVerification}
                        className="btn btn-solid bg-indigo hover:bg-indigo-dark text-white px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {savingVerification ? "Saving..." : "Save Code"}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-paper/50 rounded-lg border border-line/60 text-[10px] text-ink-soft space-y-1">
                    <div className="font-semibold text-ink">💡 GSC 연동 및 노출 가이드:</div>
                    <div>1. Google Search Console 로그인 후 [속성 추가] ➜ URL 접두사 방식으로 도메인 입력</div>
                    <div>2. 다른 인증 방법 중 <strong>HTML 태그</strong>를 선택하고 content="..." 안의 코드 복사 후 위에 입력/저장</div>
                    <div>3. Google Search Console에서 [인증] 클릭! 이후 [Sitemaps] 메뉴로 이동하여 <strong>sitemap.xml</strong> 제출</div>
                  </div>
                </div>
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
            <div className="bg-card border-1.5 border-line rounded-xl overflow-x-auto shadow-sm">
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

        {/* EMOJI DATABASE TAB (Full CRUD!) */}
        {activeTab === "emojis" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-3xl text-ink">Manage Emojis</h2>
                <p className="sub text-sm text-ink-soft mt-1">Add, modify, and delete emoji meanings from the interactive dictionary.</p>
              </div>
              <button
                type="button"
                id="admin-btn-add-emoji"
                onClick={() => {
                  setEditingTerm(null);
                  setTermCode("");
                  setTermFull("");
                  setTermCat("emoji");
                  setTermEx("");
                  setIsTermModalOpen(true);
                }}
                className="btn btn-solid bg-rose-600 hover:bg-rose-700 border-rose-600 text-white flex items-center gap-2 px-5 py-3 shadow-md transition cursor-pointer"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>Add New Emoji</span>
              </button>
            </div>

            {/* CSV Portability Tools */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-paper/60 border border-line rounded-xl">
              <div className="text-xs text-ink-soft font-semibold font-mono tracking-wider">
                EMOJI CSV PORTABILITY CONTROLS
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="admin-btn-download-emoji-csv"
                  onClick={handleExportEmojiCSV}
                  className="btn border border-line hover:bg-paper font-semibold text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer bg-card transition shadow-sm"
                  title="Export live emojis list as a CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Emoji CSV</span>
                </button>
                
                <label 
                  id="admin-btn-upload-emoji-csv-label"
                  className="btn border border-line hover:bg-paper font-semibold text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer bg-card transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Emoji CSV</span>
                  <input
                    type="file"
                    id="admin-input-upload-emoji-csv"
                    accept=".csv"
                    onChange={handleImportEmojiCSV}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Emoji List Table */}
            <div className="bg-card border-1.5 border-line rounded-xl overflow-x-auto shadow-sm">
              <table id="admin-table-emoji-list" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-paper border-b-1.5 border-line">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft w-28">Emoji</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft w-56">Meaning</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft w-32">Category</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft hidden md:table-cell">Example Usage</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {terms.filter(t => t.cat === "emoji").map((t) => {
                    const identifier = t.id || t.code;
                    return (
                      <tr key={identifier} className="hover:bg-paper/40 transition">
                        <td className="p-4 text-3xl font-bold select-none">{t.code}</td>
                        <td className="p-4 text-sm font-semibold text-ink truncate max-w-xs">{t.full}</td>
                        <td className="p-4">
                          <span className="tag tag-emoji text-[9.5px] font-bold px-2.5 py-1 rounded-full uppercase shadow-xs">
                            Emoji
                          </span>
                        </td>
                        <td className="p-4 text-xs text-ink-soft hidden md:table-cell truncate max-w-sm">
                          "{t.ex}"
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              id={`admin-btn-edit-emoji-${identifier}`}
                              onClick={() => {
                                setEditingTerm(t);
                                setTermCode(t.code);
                                setTermFull(t.full);
                                setTermCat("emoji");
                                setTermEx(t.ex);
                                setIsTermModalOpen(true);
                              }}
                              className="p-2 hover:bg-indigo/10 text-indigo rounded-lg transition cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              id={`admin-btn-delete-emoji-${identifier}`}
                              onClick={() => t.id && handleDeleteTerm(t.id)}
                              className="p-2 hover:bg-coral/10 text-coral rounded-lg transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {terms.filter(t => t.cat === "emoji").length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-ink-soft text-sm italic">
                        No emoji definitions found in database. Click "Add New Emoji" or Upload an Emoji CSV file to seed.
                      </td>
                    </tr>
                  )}
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
            <div className="bg-card border-1.5 border-line rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-paper border-b-1.5 border-line">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">User</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Email</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Role</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Joined</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-ink-soft text-right w-64">Access Control</th>
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
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.uid === currentUser?.uid}
                            className="btn btn-sm font-semibold border-coral text-coral hover:bg-coral hover:text-white flex items-center gap-1 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-coral"
                            title={u.uid === currentUser?.uid ? "You cannot delete your own account" : "Delete user profile permanently"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
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

            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* AI Blog Article Generator */}
              <div className="admin-card bg-card border border-line rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo animate-pulse" />
                  <div className="font-display font-bold text-lg text-ink">AI Blog Article Generator (Gemini 3.5)</div>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  원하는 키워드 또는 주제를 입력하고 생성 버튼을 누르시면, 구글 검색(SEO) 최적화에 특화된 고품질 블로그 기사가 자동으로 생성됩니다. 
                  생성된 글은 아래 작성 양식에 자동으로 로드되며 기본적으로 <strong>임시저장(Draft)</strong> 상태로 설정됩니다.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="예: 'Gen Z slang words', '어쩔티비 뜻', '직장인 비즈니스 영어'"
                    value={aiKeyword}
                    onChange={(e) => setAiKeyword(e.target.value)}
                    className="flex-1 border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                    disabled={generatingArticle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerateArticle();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateArticle}
                    disabled={generatingArticle}
                    className="btn btn-solid bg-indigo hover:bg-indigo-dark text-white px-5 py-3 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {generatingArticle ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Article Generate</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Recommended Keywords Section */}
                <div className="space-y-2.5 pt-2 border-t border-line/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                      🔥 추천 트렌드 키워드 (클릭하면 자동 입력):
                    </span>
                    <button
                      type="button"
                      onClick={handleShuffleKeywords}
                      className="text-xs text-indigo hover:text-indigo-dark font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="키워드 새로고침"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                    </button>
                  </div>
                  
                  {recommendedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recommendedKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setAiKeyword(kw)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer duration-200
                            ${aiKeyword === kw 
                              ? "bg-indigo text-white border-indigo shadow-sm scale-105" 
                              : "bg-paper text-ink border-line hover:border-indigo/50 hover:bg-indigo/5"
                            }`}
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-soft italic">불러오는 중...</p>
                  )}
                </div>
              </div>

              {/* Published Articles List (1-column, paginated) */}
              <div className="admin-card bg-card border border-line rounded-xl p-6 shadow-sm space-y-4">
                <div className="font-display font-bold text-lg text-ink">Existing publications ({blogs.length})</div>
                
                {blogs.length === 0 ? (
                  <p className="text-xs text-ink-soft">No articles published yet.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedBlogs.map((p) => {
                        const postCategory = CATEGORIES.find(c => c.id === p.cat) || CATEGORIES.find(c => c.id === 'internet');
                        return (
                          <div key={p.id || p.title} className="bg-paper border border-line rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                            <div className="flex-1 space-y-2">
                              <div className="font-display font-bold text-base text-ink leading-tight">{p.title}</div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-ink-soft font-medium">{p.date}</span>
                                <span className="w-1 h-1 rounded-full bg-line" />
                                <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo/5 text-indigo border border-indigo/10 text-[10px]">
                                  {postCategory?.name || "Internet & chat"}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-line" />
                                {p.draft ? (
                                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                                    Draft (임시저장)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                                    Published (발행됨)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">{p.excerpt}</p>
                            </div>
                             <div className="flex gap-2 md:flex-col justify-end md:w-32">
                              <button
                                onClick={() => setPreviewPost(p)}
                                className="btn btn-ghost btn-sm font-semibold border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white py-1.5 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                title="이 블로그 글의 실제 레이아웃과 디자인으로 미리보기를 띄웁니다"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              <button
                                onClick={() => handleStartEditPost(p)}
                                className="btn btn-ghost btn-sm font-semibold border-indigo text-indigo hover:bg-indigo hover:text-white py-1.5 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => p.id && handleDeletePost(p.id)}
                                className="btn btn-ghost btn-sm font-semibold border-coral text-coral hover:bg-coral hover:text-white py-1.5 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-line/60">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-line/20 disabled:opacity-40 transition cursor-pointer"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                          <button
                            key={pNum}
                            type="button"
                            onClick={() => setCurrentPage(pNum)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer
                              ${currentPage === pNum 
                                ? "bg-indigo text-white border border-indigo" 
                                : "border border-line text-ink hover:bg-line/20"
                              }`}
                          >
                            {pNum}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-line/20 disabled:opacity-40 transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Publisher Form */}
              <div id="blog-publisher-form" className={`admin-card bg-card border-1.5 rounded-xl p-6 shadow-sm space-y-4 transition-all duration-300
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

                    {/* Feature Image Section */}
                    <div className="pt-4 border-t border-line/60 space-y-4">
                      <div className="font-display font-semibold text-xs text-ink-soft uppercase tracking-wider font-mono flex items-center justify-between gap-1.5 w-full">
                        <span className="flex items-center gap-1.5">🖼️ <span>Feature Image (대표 이미지)</span></span>
                        <button
                          type="button"
                          onClick={handleAutoFillImage}
                          className="px-2.5 py-1 rounded-lg bg-indigo/5 text-indigo hover:bg-indigo hover:text-white border border-indigo/10 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="글 제목과 내용을 바탕으로 관련성 높은 고화질 이미지와 대체 텍스트를 자동 지정합니다."
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI 이미지 자동 추천</span>
                        </button>
                      </div>

                      <div className="field flex flex-col">
                        <label className="text-xs font-semibold text-ink-soft mb-1">Image URL</label>
                        <input
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          value={blogImageUrl}
                          onChange={(e) => setBlogImageUrl(e.target.value)}
                          className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo font-mono text-xs"
                        />
                      </div>

                      <div className="field flex flex-col">
                        <label className="text-xs font-semibold text-ink-soft mb-1">Image Alt Text (SEO 최적화 대체 텍스트)</label>
                        <input
                          type="text"
                          placeholder="e.g. Gen Z friends smiling and looking at their smartphones on the street"
                          value={blogImageAlt}
                          onChange={(e) => setBlogImageAlt(e.target.value)}
                          className="border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo"
                        />
                      </div>

                      {blogImageUrl && (
                        <div className="mt-2 p-2 bg-paper rounded-lg border border-line flex items-center gap-4">
                          <img
                            src={blogImageUrl}
                            alt={blogImageAlt || "Preview"}
                            className="w-16 h-16 object-cover rounded-lg border border-line"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left">
                            <div className="text-xs font-bold text-ink truncate max-w-[240px]">Image Preview</div>
                            <div className="text-[10px] text-ink-soft truncate max-w-[240px] italic">{blogImageAlt || "No Alt text defined"}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="field flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="blog-draft-checkbox"
                        checked={blogDraft}
                        onChange={(e) => setBlogDraft(e.target.checked)}
                        className="w-4 h-4 rounded border-line text-indigo focus:ring-indigo cursor-pointer"
                      />
                      <label htmlFor="blog-draft-checkbox" className="text-xs font-semibold text-ink-soft cursor-pointer select-none">
                        Save as Draft (임시저장 - 사용자에게 노출되지 않습니다)
                      </label>
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
              {editingTerm 
                ? (termCat === "emoji" ? "Edit Emoji Definition" : "Edit Slang Term") 
                : (termCat === "emoji" ? "Add New Emoji" : "Add New Term")}
            </h3>
            <p className="text-xs text-ink-soft mb-6">
              {termCat === "emoji" 
                ? "Configure the emoji character, its emotional meaning, and standard examples." 
                : "Write abbreviation code, meanings, category and live examples."}
            </p>

            <form onSubmit={handleSaveTerm} className="space-y-4">
              <div className="field flex flex-col">
                <label className="text-xs font-semibold text-ink-soft mb-1">
                  {termCat === "emoji" ? "Emoji Glyph / Symbol" : "Slang Abbreviation (Code)"}
                </label>
                <input
                  type="text"
                  placeholder={termCat === "emoji" ? "e.g. 💀, 🤔, ✨" : "e.g. YOLO, IYKYK"}
                  value={termCode}
                  onChange={(e) => setTermCode(e.target.value)}
                  required
                  disabled={!!editingTerm}
                  className={`border border-line rounded-lg p-3 text-sm bg-paper text-ink focus:outline-none focus:border-indigo disabled:opacity-50 ${termCat === "emoji" ? "text-2xl text-center select-none" : "font-mono font-bold"}`}
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

      {/* 2. Link Insertion Modal (Intuitive Internal/External Link Creator) */}
      {isLinkModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="modal-content bg-card border-1.5 border-line rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-paper/30">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo" />
                <h3 className="font-display font-bold text-lg text-ink">Insert Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-lg hover:bg-line text-ink-soft hover:text-ink transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
              {/* Text label field */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-ink-soft mb-1.5">Link Text</label>
                <input
                  type="text"
                  placeholder="e.g. FOMO"
                  value={linkModalLabel}
                  onChange={(e) => setLinkModalLabel(e.target.value)}
                  className="border border-line rounded-lg p-2.5 text-sm bg-paper text-ink focus:outline-none focus:border-indigo font-medium"
                />
              </div>

              {/* Toggle Tab */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-soft">Link Type</label>
                <div className="grid grid-cols-2 p-1 bg-paper/50 rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkModalType("internal");
                      setLinkModalUrl("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer
                      ${linkModalType === "internal" 
                        ? "bg-white text-indigo border border-line shadow-sm" 
                        : "text-ink-soft hover:text-ink"}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Internal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkModalType("external");
                      setLinkModalUrl("https://");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer
                      ${linkModalType === "external" 
                        ? "bg-white text-indigo border border-line shadow-sm" 
                        : "text-ink-soft hover:text-ink"}`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>External</span>
                  </button>
                </div>
              </div>

              {/* EXTERNAL VIEW */}
              {linkModalType === "external" ? (
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-ink-soft mb-1">External URL Address</label>
                  <input
                    type="url"
                    placeholder="e.g. https://google.com"
                    value={linkModalUrl}
                    onChange={(e) => setLinkModalUrl(e.target.value)}
                    className="border border-line rounded-lg p-2.5 text-sm bg-paper text-ink focus:outline-none focus:border-indigo font-mono"
                  />
                  <span className="text-[10px] text-ink-soft">Enter any valid web protocol starting with http:// or https://</span>
                </div>
              ) : (
                /* INTERNAL VIEW */
                <div className="space-y-4">
                  {/* Internal type subtabs */}
                  <div className="flex items-center gap-2 border-b border-line pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLinkModalInternalType("term");
                        setLinkModalUrl("");
                      }}
                      className={`pb-1 px-1 font-bold transition border-b-2 cursor-pointer
                        ${linkModalInternalType === "term" 
                          ? "border-indigo text-indigo" 
                          : "border-transparent text-ink-soft hover:text-ink"}`}
                    >
                      Dictionary Terms
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkModalInternalType("blog");
                        setLinkModalUrl("");
                      }}
                      className={`pb-1 px-1 font-bold transition border-b-2 cursor-pointer
                        ${linkModalInternalType === "blog" 
                          ? "border-indigo text-indigo" 
                          : "border-transparent text-ink-soft hover:text-ink"}`}
                    >
                      Blog Articles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkModalInternalType("route");
                        setLinkModalUrl("/");
                        setLinkModalSelectedRoute("/");
                      }}
                      className={`pb-1 px-1 font-bold transition border-b-2 cursor-pointer
                        ${linkModalInternalType === "route" 
                          ? "border-indigo text-indigo" 
                          : "border-transparent text-ink-soft hover:text-ink"}`}
                    >
                      Main Pages
                    </button>
                  </div>

                  {/* Rendering based on internal type */}
                  {linkModalInternalType === "route" && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-ink-soft">Select Destination Page</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: "Home Page", path: "/" },
                          { name: "Browse Dictionary", path: "/browse" },
                          { name: "Slang Quiz", path: "/quiz" },
                          { name: "Word Feed Blog", path: "/blog" }
                        ].map((route) => (
                          <button
                            key={route.path}
                            type="button"
                            onClick={() => {
                              setLinkModalSelectedRoute(route.path);
                              setLinkModalUrl(route.path);
                            }}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex justify-between items-center
                              ${linkModalSelectedRoute === route.path 
                                ? "bg-indigo/5 text-indigo border-indigo/40 ring-1 ring-indigo/15" 
                                : "bg-paper/40 text-ink border-line hover:border-ink"}`}
                          >
                            <div className="flex flex-col">
                              <span>{route.name}</span>
                              <span className="font-mono text-[10px] text-ink-soft font-normal mt-0.5">{route.path}</span>
                            </div>
                            {linkModalSelectedRoute === route.path && <Check className="w-4 h-4 text-indigo" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {linkModalInternalType === "term" && (
                    <div className="space-y-3">
                      {/* Search Bar for terms */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                        <input
                          type="text"
                          placeholder="Search dictionary terms..."
                          value={linkModalSearchQuery}
                          onChange={(e) => setLinkModalSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-line rounded-lg bg-paper text-xs text-ink focus:outline-none focus:border-indigo"
                        />
                      </div>

                      {/* Terms result list */}
                      <div className="border border-line rounded-lg bg-paper/20 max-h-[160px] overflow-y-auto divide-y divide-line text-xs">
                        {terms
                          .filter(t => 
                            !linkModalSearchQuery || 
                            t.code.toLowerCase().includes(linkModalSearchQuery.toLowerCase()) ||
                            t.full.toLowerCase().includes(linkModalSearchQuery.toLowerCase())
                          )
                          .slice(0, 15) // Limit list size
                          .map((term) => {
                            const termPath = `/browse?search=${term.code}`;
                            const isSelected = linkModalUrl === termPath;
                            return (
                              <button
                                key={term.id || term.code}
                                type="button"
                                onClick={() => {
                                  setLinkModalUrl(termPath);
                                  if (!linkModalLabel) setLinkModalLabel(term.code);
                                }}
                                className={`w-full p-2.5 text-left transition flex items-center justify-between hover:bg-paper/60 cursor-pointer
                                  ${isSelected ? "bg-indigo/5 text-indigo font-semibold" : "text-ink"}`}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold bg-line/40 px-1 rounded text-[10px] text-indigo">{term.code}</span>
                                    <span className="font-medium text-ink/90">{term.full}</span>
                                  </div>
                                  <span className="font-mono text-[9px] text-ink-soft mt-0.5">Address: {termPath}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-indigo shrink-0" />}
                              </button>
                            );
                          })}
                        {terms.filter(t => 
                          !linkModalSearchQuery || 
                          t.code.toLowerCase().includes(linkModalSearchQuery.toLowerCase()) ||
                          t.full.toLowerCase().includes(linkModalSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-4 text-center text-ink-soft italic">No matching terms found.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {linkModalInternalType === "blog" && (
                    <div className="space-y-3">
                      {/* Search Bar for blogs */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                        <input
                          type="text"
                          placeholder="Search published articles..."
                          value={linkModalSearchQuery}
                          onChange={(e) => setLinkModalSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-line rounded-lg bg-paper text-xs text-ink focus:outline-none focus:border-indigo"
                        />
                      </div>

                      {/* Blogs result list */}
                      <div className="border border-line rounded-lg bg-paper/20 max-h-[160px] overflow-y-auto divide-y divide-line text-xs">
                        {blogs
                          .filter(b => 
                            !linkModalSearchQuery || 
                            b.title.toLowerCase().includes(linkModalSearchQuery.toLowerCase())
                          )
                          .map((blog) => {
                            const slug = (blog.title || "")
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9\s-]/g, "")
                              .replace(/\s+/g, "-")
                              .replace(/-+/g, "-");
                            const blogPath = `/blog/${slug}`;
                            const isSelected = linkModalUrl === blogPath;
                            return (
                              <button
                                key={blog.id}
                                type="button"
                                onClick={() => {
                                  setLinkModalUrl(blogPath);
                                  if (!linkModalLabel) setLinkModalLabel(blog.title);
                                }}
                                className={`w-full p-2.5 text-left transition flex items-center justify-between hover:bg-paper/60 cursor-pointer
                                  ${isSelected ? "bg-indigo/5 text-indigo font-semibold" : "text-ink"}`}
                              >
                                <div className="flex flex-col pr-4">
                                  <span className="font-medium truncate max-w-[320px]">{blog.title}</span>
                                  <span className="font-mono text-[9px] text-ink-soft mt-0.5">Address: {blogPath}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-indigo shrink-0" />}
                              </button>
                            );
                          })}
                        {blogs.filter(b => 
                          !linkModalSearchQuery || 
                          b.title.toLowerCase().includes(linkModalSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-4 text-center text-ink-soft italic">No matching blog posts found.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Generated target info display */}
                  <div className="bg-paper p-3 rounded-xl border border-line text-xs flex flex-col gap-0.5 font-mono">
                    <span className="text-[10px] text-ink-soft font-bold uppercase tracking-wide">Target Path to Insert</span>
                    <span className="text-indigo font-bold break-all">{linkModalUrl || "No path selected yet"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-5 border-t border-line bg-paper/30 flex gap-3">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="btn btn-ghost flex-1 py-2.5 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!linkModalUrl || linkModalUrl === "https://"}
                onClick={() => handleInsertLinkSubmit(linkModalLabel, linkModalUrl)}
                className="btn btn-solid flex-1 py-2.5 font-semibold text-xs bg-indigo hover:bg-indigo-dark text-white cursor-pointer disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI Image Recommendation & Search Picker Modal */}
      {isImageModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="modal-content bg-card border-1.5 border-line rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-paper/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo animate-pulse" />
                <h3 className="font-display font-bold text-lg text-ink">AI 이미지 자동 추천 및 검색</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 rounded-lg hover:bg-line text-ink-soft hover:text-ink transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main content split */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-left">
              {/* Top Search bar & Tabs */}
              <div className="space-y-4">
                <div className="relative">
                  {isSearchingUnsplash ? (
                    <RefreshCw className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo animate-spin" />
                  ) : (
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                  )}
                  <input
                    type="text"
                    placeholder="원하는 검색어를 입력하거나 아래 추천 카테고리를 선택하세요..."
                    value={imageModalSearch}
                    onChange={(e) => {
                      setImageModalSearch(e.target.value);
                      if (imageModalTab === "AI-Matched (추천)") {
                        setImageModalTab("All");
                      }
                    }}
                    className="w-full pl-10 pr-10 py-2.5 border border-line rounded-xl bg-paper text-sm text-ink focus:outline-none focus:border-indigo transition-all font-medium"
                  />
                  {imageModalSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageModalSearch("");
                        setUnsplashSearchResults([]);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-ink-soft hover:text-ink hover:bg-line rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {searchError && (
                  <p className="text-xs text-red font-medium px-1">⚠️ {searchError}</p>
                )}
                {isSearchingUnsplash && (
                  <p className="text-xs text-indigo font-medium px-1 animate-pulse">실시간 Unsplash 이미지 라이브러리 검색 중...</p>
                )}

                {/* Quick Category Filters */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {["AI-Matched (추천)", "All", "AI & Tech", "Gaming", "Work & Productivity", "Finance & FIRE", "Lifestyle", "Trending & Emojis"].map((tab) => {
                    const isActive = imageModalTab === tab && !imageModalSearch;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setImageModalTab(tab);
                          setImageModalSearch("");
                          setUnsplashSearchResults([]);
                          if (tab === "All") {
                            setShuffleSeed(Math.random());
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer flex items-center gap-1
                          ${isActive 
                            ? "bg-indigo text-white border-indigo shadow-sm" 
                            : "bg-paper/40 text-ink border-line hover:border-ink hover:bg-paper"}`}
                      >
                        {tab === "AI-Matched (추천)" && <Sparkles className="w-3 h-3 text-current animate-pulse" />}
                        <span>{tab}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid content */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
                    {imageModalSearch.trim() !== "" 
                      ? `실시간 이미지 검색 결과 (${displayImages.length}개)` 
                      : imageModalTab === "AI-Matched (추천)" 
                        ? "블로그 본문 분석 추천 이미지" 
                        : `${imageModalTab} 이미지 결과`}
                  </span>
                  <button
                    type="button"
                    onClick={handleShuffleModalPool}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo hover:text-indigo-dark hover:underline transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>순서 섞기 / 새로추천</span>
                  </button>
                </div>

                {displayImages.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-line rounded-xl bg-paper/20">
                    <p className="text-sm text-ink-soft font-medium">
                      {isSearchingUnsplash ? "실시간 검색 중입니다..." : "검색 결과나 추천 이미지 조건에 맞는 이미지가 없습니다."}
                    </p>
                    {!isSearchingUnsplash && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageModalSearch("");
                          setUnsplashSearchResults([]);
                          setImageModalTab("All");
                        }}
                        className="mt-3 text-xs font-bold text-indigo hover:underline cursor-pointer"
                      >
                        전체 이미지 보기
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {displayImages.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setBlogImageUrl(img.url);
                          setBlogImageAlt(img.alt);
                          setIsImageModalOpen(false);
                        }}
                        className="group text-left border border-line hover:border-indigo bg-paper/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col relative h-[155px]"
                      >
                        <div className="relative w-full h-[105px] bg-paper overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.alt}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                          />
                          <div className="absolute top-1.5 right-1.5 bg-indigo text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs font-mono">
                            {img.category}
                          </div>
                        </div>
                        <div className="p-2 flex-1 flex items-center justify-between gap-1 border-t border-line bg-paper/50 overflow-hidden">
                          <span className="text-[10px] font-medium text-ink line-clamp-2 leading-snug pr-3">
                            {img.alt}
                          </span>
                          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-3 h-3 text-indigo" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-line bg-paper/30 flex justify-between items-center text-xs text-ink-soft">
              <span>원하는 이미지를 클릭하면 해당 고화질 URL과 대체텍스트가 즉시 입력됩니다.</span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 border border-line rounded-lg hover:bg-line text-ink font-bold transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOG POST DETAIL PREVIEW MODAL */}
      {previewPost && (
        <div className="overlay" onClick={() => setPreviewPost(null)}>
          <div 
            className="modal relative max-w-3xl w-full bg-card p-6 md:p-8 rounded-2xl border border-line shadow-2xl flex flex-col space-y-6 overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-line">
              <div className="text-left space-y-1.5 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo/10 text-indigo text-[10px] uppercase font-mono">
                    {CATEGORIES.find(c => c.id === previewPost.cat)?.name || "INTERNET & CHAT"}
                  </span>
                  {previewPost.draft && (
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                      임시저장 (Draft)
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-xl md:text-2xl text-ink leading-tight">
                  {previewPost.title}
                </h3>
              </div>
              
              <button
                onClick={() => setPreviewPost(null)}
                className="text-ink-soft hover:text-ink p-1.5 hover:bg-line/40 rounded-lg transition cursor-pointer shrink-0"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-left custom-scrollbar">
              {/* Feature Image */}
              {previewPost.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-line bg-paper/40">
                  <img
                    src={previewPost.imageUrl}
                    alt={previewPost.imageAlt || previewPost.title}
                    className="w-full h-auto max-h-[300px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {previewPost.imageAlt && (
                    <div className="px-4 py-2 bg-paper/80 border-t border-line text-center text-[10px] text-ink-soft italic font-medium">
                      대체 텍스트(Alt): {previewPost.imageAlt}
                    </div>
                  )}
                </div>
              )}

              {/* Meta Stats Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-paper/40 p-4 rounded-xl border border-line/60 text-xs font-mono">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-ink-soft uppercase font-bold tracking-wider block">발행일자</span>
                  <span className="text-ink font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo/60" /> {previewPost.date}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-ink-soft uppercase font-bold tracking-wider block">읽기 시간</span>
                  <span className="text-ink font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo/60" /> {Math.ceil((previewPost.body || "").length / 400) || 1}분 분량
                  </span>
                </div>
                <div className="space-y-0.5 col-span-2">
                  <span className="text-[9px] text-ink-soft uppercase font-bold tracking-wider block">검색 키워드 (Keywords)</span>
                  <span className="text-ink font-semibold block truncate" title={previewPost.keywords || "없음"}>
                    {previewPost.keywords || "지정 안 됨"}
                  </span>
                </div>
              </div>

              {/* Excerpt */}
              {previewPost.excerpt && (
                <div className="bg-paper p-4 rounded-xl border-l-4 border-indigo bg-indigo/[0.02]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo block mb-1">Excerpt (요약)</span>
                  <p className="text-xs text-ink leading-relaxed font-medium">
                    {previewPost.excerpt}
                  </p>
                </div>
              )}

              {/* Rendered Body */}
              <div className="markdown-body text-sm leading-relaxed text-ink pt-2">
                {renderBlogPostContent(previewPost.body, adSlots)}
              </div>

              {/* SEO Specs Sidebar Inside Modal */}
              <div className="pt-4 border-t border-line space-y-2.5">
                <div className="font-display font-semibold text-xs text-ink-soft uppercase tracking-wider font-mono">
                  🔍 SEO 메타데이터 정보
                </div>
                <div className="text-[11px] space-y-1 bg-paper/50 p-3 rounded-lg border border-line/40 font-mono">
                  <div>
                    <span className="text-ink-soft font-bold">SEO Title:</span>{" "}
                    <span className="text-ink">{previewPost.seoTitle || "기본 타이틀 적용"}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft font-bold">Meta Description:</span>{" "}
                    <span className="text-ink">{previewPost.metaDescription || "지정 안 됨 (기본 요약문 사용)"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="btn btn-solid px-6 py-2 bg-indigo hover:bg-indigo-dark text-white font-semibold text-xs cursor-pointer shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
