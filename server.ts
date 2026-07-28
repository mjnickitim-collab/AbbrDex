import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, where, limit } from "firebase/firestore";
import { generateTermArticle } from "./src/utils/termArticleGenerator";

dotenv.config();

const app = express();
const PORT = 3000;

// Body Parser middleware compatible with Vercel Serverless Functions and local Express
app.use((req: any, res: any, next: any) => {
  if (req.body && typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {}
  }
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.json()(req, res, next);
});

// Path Normalization Middleware for Vercel Rewrites
app.use((req, res, next) => {
  if (req.url && req.url.startsWith("/api/index")) {
    try {
      const urlObj = new URL(req.url, "http://localhost");
      const subPath = urlObj.searchParams.get("path");
      if (subPath) {
        req.url = subPath.startsWith("/") ? `/api${subPath}` : `/api/${subPath}`;
      } else {
        const restored = req.url.replace(/^\/api\/index/, "");
        req.url = restored ? (restored.startsWith("/") ? `/api${restored}` : `/api/${restored}`) : "/api";
      }
    } catch (_) {
      req.url = "/api";
    }
  }
  next();
});


// CORS Middleware for API routes
app.use((req, res, next) => {
  const path = req.path || "";
  if (path.startsWith("/api") || path.startsWith("/sitemap") || path.startsWith("/generate-article") || path.startsWith("/search-unsplash")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
  }
  next();
});

// SEO 308 Redirect Middleware for non-canonical domains (e.g. Cloud Run .run.app URL)
app.use((req, res, next) => {
  // Skip redirect for API routes and sitemaps completely
  const path = req.path || "";
  if (path.includes("/api/") || path.includes("sitemap") || path.includes("generate-article") || path.includes("search-unsplash")) {
    return next();
  }

  const host = req.headers.host || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const isPreview = host.includes("aistudio") || host.includes("google") || host.includes("vercel");
  const isCanonical = host === "www.whatsthatmean.com";

  if (!isLocal && !isPreview && !isCanonical) {
    // 308 Permanent Redirect to canonical domain (www.whatsthatmean.com)
    console.log(`Redirecting non-canonical host ${host} to www.whatsthatmean.com`);
    return res.redirect(308, `https://www.whatsthatmean.com${req.originalUrl}`);
  }
  next();
});

// Using process.cwd() as the project root for both local, container, and serverless runtimes
const projectRoot = process.cwd();

// Safely load Firebase Config with fallback defaults for local, container, and serverless runtimes
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrYD4DhTBLEDblWXXzPyLEUlyOkMRyS4w",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-studio-applet-webapp-f78e7.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "ai-studio-applet-webapp-f78e7",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-studio-applet-webapp-f78e7.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "717940026511",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:717940026511:web:f4aecc4e9a0132257914fa",
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-fd31e368-e61b-4d50-87ab-58823b9be109"
};

let firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
try {
  const configPath = path.join(projectRoot, "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const loaded = JSON.parse(fs.readFileSync(configPath, "utf8"));
    firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG, ...loaded };
  }
} catch (err) {
  console.warn("Could not read firebase-applet-config.json from disk, using default config:", err);
}

// Initialize server-side Firebase instance safely avoiding duplicate app error in serverless contexts
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId);

// Helper to race Firestore async queries against a timeout so serverless functions never hang
async function withFirestoreTimeout<T>(promise: Promise<T>, ms = 8000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`Firestore query timed out after ${ms}ms, returning fallback data.`);
      resolve(fallback);
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    console.error("Firestore query error:", err);
    return fallback;
  }
}

// Helper to lazily initialize Gemini SDK with telemetry User-Agent
let aiClient: GoogleGenAI | null = null;
function getGoogleGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper to fetch blogs from Firestore securely using Firebase JS SDK
async function getBlogsFromFirestore() {
  return withFirestoreTimeout((async () => {
    const blogsCol = collection(firestoreDb, "blogs");
    const q = query(blogsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        title: data.title || "",
        draft: data.draft || false,
        excerpt: data.excerpt || "",
        seoTitle: data.seoTitle || "",
        metaDescription: data.metaDescription || "",
        date: data.date || ""
      };
    });
  })(), 3500, []);
}

// Helper to fetch a single term by its code securely from Firestore
async function getTermFromFirestoreByCode(code: string) {
  return withFirestoreTimeout((async () => {
    const termsCol = collection(firestoreDb, "terms");
    const q = query(termsCol, where("code", "==", code.toUpperCase().trim()), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        code: data.code || "",
        full: data.full || "",
        cat: data.cat || "",
        ex: data.ex || ""
      };
    }
    return null;
  })(), 3500, null);
}

// Helper to fetch slang terms and emojis from Firestore securely using Firebase JS SDK (without costly database-side sorting)
async function getTermsFromFirestore() {
  return withFirestoreTimeout((async () => {
    const termsCol = collection(firestoreDb, "terms");
    const q = query(termsCol);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        code: data.code || "",
        full: data.full || "",
        cat: data.cat || "",
        ex: data.ex || ""
      };
    });
  })(), 3500, []);
}

// Helper to resolve SEO metadata based on URL path
async function getSeoMetadata(urlPath: string) {
  let title = "Online Abbreviation Dictionary & Acronym Finder | whatsthatmean";
  let desc = "Decode 4,400+ text slangs, gaming acronyms, business shorthands, and military jargon easily with whatsthatmean dictionary.";
  let schemaMarkup = "";
  let bodyArticleHtml = "";

  try {
    const pathname = urlPath.split("?")[0];

    if (pathname === "/" || pathname === "/home" || pathname === "") {
      title = "Online Abbreviation Dictionary & Acronym Finder | whatsthatmean";
      desc = "Decode 4,400+ text slangs, gaming acronyms, business shorthands, and military jargon easily with whatsthatmean dictionary.";
      
      const homeSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "whatsthatmean",
        "url": "https://www.whatsthatmean.com",
        "description": desc,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.whatsthatmean.com/?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      };
      schemaMarkup = `<script type="application/ld+json">${JSON.stringify(homeSchema)}</script>`;
    } else if (pathname === "/about") {
      title = "About Us | whatsthatmean - Modern Digital Reference Platform";
      desc = "Learn about whatsthatmean.com, an independent digital reference platform dedicated to decoding acronyms, slang, emojis, and modern internet expressions.";
    } else if (pathname === "/editorial") {
      title = "Editorial Policy | whatsthatmean - Quality & Verification Standards";
      desc = "Read our editorial standards ensuring all definitions, etymologies, and usage examples published on whatsthatmean.com are accurate, human-written, and neutral.";
    } else if (pathname === "/privacy") {
      title = "Privacy Policy | whatsthatmean - Data Protection & Privacy";
      desc = "Privacy Policy for whatsthatmean.com. Learn how we handle technical data, cookies, and privacy rights in compliance with GDPR and CCPA.";
    } else if (pathname === "/terms") {
      title = "Terms of Service | whatsthatmean - User Agreement";
      desc = "Terms of Service governing your access to and use of whatsthatmean.com dictionary portal and reference content.";
    } else if (pathname === "/browse") {
      title = "Explore Dictionary | whatsthatmean - Find Abbreviations & Meanings";
      desc = "Browse through hundreds of curated acronyms, digital shorthand, and slang meanings. Filter by category or search terms instantly.";
    } else if (pathname === "/quiz") {
      title = "Interactive Acronym Quiz | whatsthatmean - Test Your Slang Knowledge";
      desc = "Think you know modern slang and business terminology? Challenge yourself with our challenging, adaptive abbreviation quizzes.";
    } else if (pathname === "/blog") {
      title = "Word Feed Blog | whatsthatmean - Insightful Slang Articles & Trends";
      desc = "Stay up to date with deep-dives into modern internet culture, business acronym origins, and the evolution of digital shorthand.";
    } else if (pathname === "/emoji") {
      title = "Emoji Meanings & Dictionary | whatsthatmean";
      desc = "Browse modern emojis, their actual slang meanings, examples, and texting context in our ultimate real-time emoji dictionary.";
    } else if (pathname.startsWith("/browse/")) {
      const category = decodeURIComponent(pathname.substring(8));
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      title = `${categoryName} Abbreviations & Meanings | whatsthatmean`;
      desc = `Explore the best dictionary for ${categoryName} abbreviations, acronyms, and modern chat terms. Learn their meanings and real-world examples.`;
    } else if (pathname.startsWith("/blog/")) {
      const slug = pathname.substring(6);
      const blogs = await getBlogsFromFirestore();
      const foundBlog = blogs.find((b: any) => {
        const s = (b.title || "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
        return s === slug;
      });
      if (foundBlog && !foundBlog.draft) {
        title = foundBlog.seoTitle || foundBlog.title || title;
        desc = foundBlog.metaDescription || foundBlog.excerpt || desc;
        
        const blogSchema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": foundBlog.title,
          "description": foundBlog.excerpt || desc,
          "datePublished": foundBlog.date || new Date().toISOString().split("T")[0],
          "author": {
            "@type": "Organization",
            "name": "whatsthatmean",
            "url": "https://www.whatsthatmean.com"
          },
          "publisher": {
            "@type": "Organization",
            "name": "whatsthatmean",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.whatsthatmean.com/logo.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://www.whatsthatmean.com/blog/${slug}`
          }
        };
        schemaMarkup = `<script type="application/ld+json">${JSON.stringify(blogSchema)}</script>`;
      }
    } else if (pathname.startsWith("/term/")) {
      const code = decodeURIComponent(pathname.substring(6)).toUpperCase();
      const foundTerm = await getTermFromFirestoreByCode(code);
      if (foundTerm) {
        const categoryName = foundTerm.cat ? (foundTerm.cat.charAt(0).toUpperCase() + foundTerm.cat.slice(1)) : "Slang";
        const articleData = generateTermArticle(foundTerm);
        title = `${foundTerm.code} Meaning: What Does ${foundTerm.code} Mean? | whatsthatmean`;
        desc = `What does ${foundTerm.code} stand for? It means "${foundTerm.full}". Learn its definition, etymology, tone guide, and see real-world texting examples.`;
        
        const cleanFull = foundTerm.full ? foundTerm.full.replace(/"/g, '\\"') : "";
        
        const termSchema = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "DefinedTerm",
              "@id": `https://www.whatsthatmean.com/term/${encodeURIComponent(foundTerm.code)}#defined-term`,
              "name": foundTerm.code,
              "description": `Means: ${cleanFull}. Category: ${categoryName}. Tone: ${articleData.formalityLevel}.`,
              "inDefinedTermSet": {
                "@type": "DefinedTermSet",
                "name": "whatsthatmean Dictionary",
                "url": "https://www.whatsthatmean.com"
              }
            },
            {
              "@type": "Article",
              "@id": `https://www.whatsthatmean.com/term/${encodeURIComponent(foundTerm.code)}#article`,
              "headline": `What Does ${foundTerm.code} Mean? Definition, Origin & Usage Guide`,
              "description": articleData.overview,
              "articleBody": `${articleData.overview} ${articleData.etymology} ${articleData.culturalLore}`,
              "wordCount": articleData.fullWordCount,
              "publisher": {
                "@type": "Organization",
                "name": "whatsthatmean",
                "url": "https://www.whatsthatmean.com"
              }
            },
            {
              "@type": "FAQPage",
              "@id": `https://www.whatsthatmean.com/term/${encodeURIComponent(foundTerm.code)}#faq`,
              "mainEntity": articleData.faqs.map((faq) => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            }
          ]
        };
        schemaMarkup = `<script type="application/ld+json">${JSON.stringify(termSchema)}</script>`;

        // Build SSR HTML text block for AdSense and search engine crawlers
        bodyArticleHtml = `
          <div id="ssr-term-article" style="display:none;" aria-hidden="true">
            <article>
              <h1>What Does ${foundTerm.code} Mean? Definition, Origin & Usage</h1>
              <p><strong>Spelled-out phrase:</strong> ${foundTerm.full}</p>
              <p><strong>Category:</strong> ${categoryName}</p>
              <h2>Overview</h2>
              <p>${articleData.overview}</p>
              <h2>Etymology & History</h2>
              <p>${articleData.etymology}</p>
              <h2>Usage Scenarios</h2>
              ${articleData.usageScenarios.map(s => `<h3>${s.title}</h3><p>${s.desc}</p><pre>${s.example}</pre>`).join("")}
              <h2>Comparisons</h2>
              ${articleData.comparisons.map(c => `<h3>${c.term}</h3><p>${c.difference}</p>`).join("")}
              <h2>Common Pitfalls</h2>
              <ul>${articleData.pitfalls.map(p => `<li>${p}</li>`).join("")}</ul>
              <h2>Cultural Context</h2>
              <p>${articleData.culturalLore}</p>
              <h2>Frequently Asked Questions</h2>
              ${articleData.faqs.map(f => `<details><summary>${f.question}</summary><p>${f.answer}</p></details>`).join("")}
            </article>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("Error generating SEO metadata:", err);
  }

  return { title, desc, schemaMarkup, bodyArticleHtml };
}

// Injects dynamic metadata tags in HTML head and body
async function injectSeoMetadata(html: string, urlPath: string): Promise<string> {
  const { title, desc, schemaMarkup, bodyArticleHtml } = await getSeoMetadata(urlPath);
  
  let updatedHtml = html;
  
  // Replace standard tags cleanly
  updatedHtml = updatedHtml.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  updatedHtml = updatedHtml.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${desc}" />`);
  updatedHtml = updatedHtml.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  updatedHtml = updatedHtml.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${desc}" />`);
  
  // Inject schema markup if available
  if (schemaMarkup) {
    if (updatedHtml.includes("</head>")) {
      updatedHtml = updatedHtml.replace("</head>", `${schemaMarkup}\n</head>`);
    } else {
      updatedHtml = `${schemaMarkup}\n${updatedHtml}`;
    }
  }

  // Inject body article HTML for crawlers if present
  if (bodyArticleHtml && updatedHtml.includes("<body>")) {
    updatedHtml = updatedHtml.replace("<body>", `<body>\n${bodyArticleHtml}`);
  }
  
  return updatedHtml;
}

// Helper to fetch Google Site Verification code from Firestore
async function getGoogleSiteVerification() {
  try {
    const docRef = doc(firestoreDb, "site_settings", "global");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.googleSiteVerification || "";
    }
    return "";
  } catch (err) {
    console.error("Error fetching google-site-verification:", err);
    return "";
  }
}

export { getGoogleSiteVerification, injectSeoMetadata };

// API endpoint to generate blog articles using Gemini
app.post(["/api/generate-article", "/generate-article"], async (req: any, res: any) => {
  const body = req.body || {};
  const keyword = body.keyword;
  if (!keyword) {
    return res.status(400).json({ error: "Keyword is required" });
  }

  const ai = getGoogleGenAI();
  if (!ai) {
    return res.status(400).json({
      error: "GEMINI_API_KEY가 서버 환경 변수에 설정되어 있지 않습니다. Vercel Project Settings -> Environment Variables에서 GEMINI_API_KEY를 추가해주시기 바랍니다."
    });
  }

  try {
    const prompt = `You are a world-class digital magazine editor, SEO strategist, and subject-matter expert specializing in creating highly engaging, comprehensive, and top-ranking Google Search blog posts with optimal AdSense revenue performance.

Your task is to write an EXHAUSTIVE, IN-DEPTH, ORIGINAL, and HIGHLY ENGAGING blog article about the topic/keyword: "${keyword}".

TARGET LENGTH: 1,200 to 2,000 WORDS (approx. 2,500 to 4,000+ CHARACTERS).

================================================================================
1. TOPIC-SPECIFIC CUSTOM STRUCTURE (ABSOLUTELY NO FIXED TEMPLATES)
================================================================================
- DEEP TOPIC ANALYSIS: Analyze "${keyword}" and determine its real-world domain (e.g., Global Sports Events, Technology/AI, Financial Markets, Health & Wellness, Entertainment/Culture, World News, or Slang/Acronyms).
- NO COOKIE-CUTTER HEADINGS: You are STRICTLY FORBIDDEN from using generic template headings like "Practical Scenario A/B", "Executive Summary", "Fundamental Principles and Technical Breakdown", "Core Conceptual Background", or "Slang Meaning".
- CREATE UNIQUE, ENGAGING H2 & H3 HEADINGS TAILORED SPECIFICALLY TO "${keyword}":
  * Example for "2026 World Cup":
    - H1: 2026 World Cup: Complete Guide to Teams, Venues, Schedule & Format Expansion
    - H2: Overview & Historic 48-Team Format Expansion
    - H2: Host Cities & World-Class Stadium Venues across USA, Canada, and Mexico
    - H2: Key Qualification Highlights, Favorite Contenders & Tactical Outlook
    - H2: Fan Travel Guide, Ticket Expectations & Economic Impact
    - H2: Frequently Asked Questions About the 2026 FIFA World Cup
  * Example for "S&P 500":
    - H1: S&P 500 Index: Historical Performance, Top Holdings & Investment Guide
    - H2: What Is the S&P 500 and How Does It Work?
    - H2: Top Sector Holdings, Weighting Methodology & Key Drivers
    - H2: Historical Returns vs. Active Investing Strategies
    - H2: Key Risks, Market Volatility & Long-Term Outlook
    - H2: Frequently Asked Questions
- Make every article read like a captivating, authoritative feature story written by a seasoned industry journalist.

================================================================================
2. CONTENT DEPTH, ENGAGEMENT & READABILITY
================================================================================
- Write with rich facts, specific details, background history, key statistics, and practical context.
- Keep paragraphs short (maximum 100-120 words per paragraph) for effortless mobile reading.
- Keep average sentence length under 20 words and use ACTIVE VOICE for over 90% of sentences.
- Use logical transition words (e.g., however, consequently, in addition, furthermore, specifically, for instance, ultimately, as a result) in at least 30% of sentences.
- Never start consecutive sentences with the exact same word or phrase.
- Place an H2 or H3 subheading every 250-300 words.

================================================================================
3. LINKING & ADSENSE ADS PLACEMENT
================================================================================
- Internal Links (seamlessly embedded in relevant sentences):
  - Home/Dictionary: [whatsthatmean Dictionary](/)
  - Keyword Search: [Search "${keyword}"](/?search=${encodeURIComponent(keyword)})
  - Interactive Quiz: [Slang & Acronym Quiz](/quiz)
  - Blog Main: [whatsthatmean Blog](/blog)
- External Link (EXACTLY ONE authoritative, relevant HTTPS link):
  - Must point to an established domain matching the topic (e.g. https://www.fifa.com, https://en.wikipedia.org, https://www.investopedia.com, https://www.cdc.gov, https://developer.mozilla.org, https://www.merriam-webster.com).
- AdSense Ad Placeholders:
  - Insert EXACTLY THREE (3) "[AD]" placeholders on empty lines between major sections (e.g. after section 1, section 3, and before the FAQ). Strictly format as "[AD]" on its own line.

Return ONLY a raw valid JSON object matching the requested schema.`;

    const ai = getGoogleGenAI();
    const generationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: `A captivating, high-CTR blog title starting with "${keyword}: "`
          },
          excerpt: {
            type: Type.STRING,
            description: "A compelling 2-sentence summary for search engines."
          },
          body: {
            type: Type.STRING,
            description: "Long, rich markdown article (1,200 to 2,000 words / 2,500 to 4,000+ characters) with custom topic-tailored H2/H3 subheadings, detailed paragraphs, lists, internal links, 1 external authoritative link, and 3 [AD] tags."
          },
          seoTitle: {
            type: Type.STRING,
            description: "SEO title tag under 60 characters."
          },
          metaDescription: {
            type: Type.STRING,
            description: `Meta description under 160 characters containing "${keyword}".`
          },
          keywords: {
            type: Type.STRING,
            description: `A string of 3-5 comma-separated SEO keywords for "${keyword}".`
          },
          imageUrl: {
            type: Type.STRING,
            description: "Selected Unsplash image URL relevant to the topic."
          },
          imageAlt: {
            type: Type.STRING,
            description: "Keyword-rich image alt text."
          }
        },
        required: ["title", "excerpt", "body", "seoTitle", "metaDescription", "keywords", "imageUrl", "imageAlt"]
      }
    };

    let response;
    const isQuotaErr = (err: any) => {
      const msg = (err?.message || err?.toString() || "").toLowerCase();
      return msg.includes("quota") || msg.includes("exceeded") || msg.includes("429") || msg.includes("resource_exhausted");
    };

    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: generationConfig
      });
    } catch (modelError: any) {
      console.warn("Primary model gemini-3.6-flash failed, attempting fallback to gemini-3.1-pro-preview:", modelError?.message || modelError);
      if (isQuotaErr(modelError)) {
        return res.status(429).json({
          error: "You exceeded your current quota. Please check your plan and billing details, or try again later."
        });
      }
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: generationConfig
        });
      } catch (fallbackError: any) {
        console.error("Both gemini-3.6-flash and gemini-3.1-pro-preview failed:", fallbackError?.message || fallbackError);
        if (isQuotaErr(fallbackError)) {
          return res.status(429).json({
            error: "You exceeded your current quota. Please check your plan and billing details, or try again later."
          });
        }
        return res.status(500).json({
          error: `Gemini API call failed: ${modelError?.message || fallbackError?.message || "Model error"}`
        });
      }
    }


    const text = response.text || "{}";
    
    // Helper to safely parse and clean JSON output from Gemini
    const cleanAndParseJson = (rawText: string) => {
      let cleaned = rawText.trim();
      
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
      
      try {
        return JSON.parse(cleaned);
      } catch (err: any) {
        console.error("Standard JSON.parse failed. Text length:", cleaned.length, "Error:", err.message);
        try {
          let inString = false;
          let result = "";
          for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            if (char === '"' && (i === 0 || cleaned[i-1] !== '\\')) {
              inString = !inString;
              result += char;
            } else if (char === '\n' && inString) {
              result += "\\n";
            } else if (char === '\r' && inString) {
              result += "\\r";
            } else {
              result += char;
            }
          }
          return JSON.parse(result);
        } catch (fallbackErr: any) {
          console.error("Heuristic JSON fallback parse failed:", fallbackErr.message);
          throw new Error(`Failed to parse generated article JSON: ${err.message}`);
        }
      }
    };

    const generatedData = cleanAndParseJson(text);
    return res.json(generatedData);
  } catch (error: any) {
    console.error("Gemini article generation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate article" });
  }
});

// Dynamic Unsplash & Wikimedia Image Search API Proxy (With multi-source fallback, no-key, bypasses CORS)
app.get(["/api/search-unsplash", "/search-unsplash"], async (req: any, res: any) => {
  const query = req.query.query as string;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const results: any[] = [];

  // 1. Try official Unsplash API if access key is available
  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const officialResults = (data.results || []).map((img: any) => ({
          id: img.id,
          url: img.urls?.regular || img.urls?.small || "",
          alt: img.alt_description || img.description || query,
          category: "Unsplash (Official)",
          keywords: [query]
        }));
        if (officialResults.length > 0) {
          return res.json({ results: officialResults });
        }
      }
    } catch (err) {
      console.warn("Unsplash official API failed, falling back to other sources:", err);
    }
  }

  // 2. Try Unsplash napi (unofficial web client API)
  try {
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=24`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      const napiResults = (data.results || []).map((img: any) => ({
        id: img.id,
        url: img.urls?.regular || img.urls?.small || "",
        alt: img.alt_description || img.description || query,
        category: "Unsplash",
        keywords: [query]
      }));
      if (napiResults.length > 0) {
        return res.json({ results: napiResults });
      }
    }
  } catch (error: any) {
    console.warn("Unsplash napi search failed (possibly due to anti-bot challenge), trying Wikimedia Commons fallback...", error);
  }

  // 3. Fallback to Wikimedia Commons (Completely free, open, keyless, and reliable)
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=24&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
    const response = await fetch(wikiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.query && data.query.pages) {
        for (const pageId of Object.keys(data.query.pages)) {
          const page = data.query.pages[pageId];
          if (page.imageinfo && page.imageinfo.length > 0) {
            const img = page.imageinfo[0];
            const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(img.url || "");
            if (img.url && isImage) {
              results.push({
                id: `wiki-${page.pageid}`,
                url: img.url,
                alt: page.title.replace(/^File:/i, "").replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                category: "Wikimedia Commons",
                keywords: [query]
              });
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Wikimedia Commons fallback failed too:", error);
  }

  // Always return whatever we got, even if empty (no error to client, prevents crash)
  return res.json({ results });
});

// Sitemap caching states to prevent heavy database queries on every request
let cachedSitemapXml: string | null = null;
let lastSitemapGenTime = 0;
const SITEMAP_CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours cache duration

async function getCachedSitemapXml(forceRefresh = false): Promise<string> {
  const now = Date.now();
  
  if (!forceRefresh && cachedSitemapXml && (now - lastSitemapGenTime) <= SITEMAP_CACHE_DURATION) {
    return cachedSitemapXml;
  }
  
  console.log(`Generating sitemap.xml (Force: ${forceRefresh})...`);
  
  const [blogs, terms] = await Promise.all([
    getBlogsFromFirestore(),
    getTermsFromFirestore()
  ]);
  
  const isDataEmpty = blogs.length === 0 && terms.length === 0;
  const xml = buildSitemapXmlStringWithData(blogs, terms);
  
  // Crucial: ONLY cache if we actually retrieved either blogs or terms!
  // This prevents caching empty sitemaps for 12 hours due to cold starts or temporary connection issues.
  if (!isDataEmpty) {
    cachedSitemapXml = xml;
    lastSitemapGenTime = now;
    console.log(`Successfully generated and cached sitemap.xml with ${blogs.length} blogs and ${terms.length} terms.`);
  } else {
    console.warn("Sitemap data is completely empty (0 blogs and 0 terms retrieved). Serving transient un-cached sitemap to allow auto-recovery.");
  }
  
  return xml;
}

// Helper to construct sitemap XML string using retrieved database items
function buildSitemapXmlStringWithData(blogs: any[], terms: any[]): string {
  const domain = "https://www.whatsthatmean.com";
  const dateStr = new Date().toISOString().split("T")[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // 1. Core routes
  const routes = ["", "/browse", "/quiz", "/blog", "/about", "/editorial", "/privacy", "/terms"];
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
  blogs.forEach((blog: any) => {
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
  terms.forEach((term: any) => {
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
}

// API endpoint to apply/write sitemap.xml to static directories (bypassing dynamic route issues on custom domains)
app.post(["/api/sitemap/apply", "/sitemap/apply"], async (req: any, res: any) => {
  try {
    const xml = await getCachedSitemapXml(true);
    
    // On Vercel / serverless read-only environment, skip writing to disk to prevent filesystem errors
    if (process.env.VERCEL) {
      return res.json({
        success: true,
        message: "서버리스(Vercel) 환경입니다. 사이트맵이 메모리에 최신 데이터로 실시간 반영되었으며, /sitemap.xml 엔드포인트에서 최신 사이트맵을 제공합니다!"
      });
    }

    // Save to source public directory if writable (syncs to GitHub/ZIP exports automatically)
    let savedPublic = false;
    try {
      const publicDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const publicPath = path.join(publicDir, "sitemap.xml");
      fs.writeFileSync(publicPath, xml, "utf8");
      console.log(`Saved sitemap.xml to ${publicPath}`);
      savedPublic = true;
    } catch (fsErr: any) {
      console.warn(`Could not write sitemap.xml to public folder:`, fsErr?.message);
    }

    // Check and save to dist directory if build folder is present and writable
    let savedDist = false;
    try {
      const distFolder = path.join(process.cwd(), "dist");
      if (fs.existsSync(distFolder)) {
        const distPath = path.join(distFolder, "sitemap.xml");
        fs.writeFileSync(distPath, xml, "utf8");
        console.log(`Saved sitemap.xml to ${distPath}`);
        savedDist = true;
      }
    } catch (fsErr: any) {
      console.warn(`Could not write sitemap.xml to dist folder:`, fsErr?.message);
    }

    let successMessage = "사이트맵이 성공적으로 최신 데이터로 저장 및 변경 적용되었습니다!";
    if (!savedPublic && !savedDist) {
      successMessage = "서버리스(읽기전용) 환경입니다. 사이트맵이 메모리/동적 엔드포인트(/sitemap.xml)에 최신 데이터로 실시간 반영되었습니다!";
    }

    return res.json({ success: true, message: successMessage });
  } catch (error: any) {
    console.error("Error applying sitemap.xml:", error);
    return res.status(500).json({ error: error?.message || "Failed to apply sitemap changes" });
  }
});

// Dynamic Sitemap API
app.get(["/sitemap.xml", "/api/sitemap.xml"], async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const xml = await getCachedSitemapXml(forceRefresh);
    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=0, must-revalidate");
    res.send(xml);
  } catch (err: any) {
    console.error("Dynamic sitemap fetch error:", err);
    res.status(500).send("Failed to load sitemap");
  }
});

// Serve assets / static app (Production container server only, not run on Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath, { index: false })); // don't serve index.html directly
  
  app.get("*", async (req, res) => {
    try {
      const indexHtmlPath = path.join(distPath, "index.html");
      let html = await fs.promises.readFile(indexHtmlPath, "utf-8");
      
      // Inject Google site verification meta tag
      const verificationCode = await getGoogleSiteVerification();
      if (verificationCode) {
        const metaTag = `<meta name="google-site-verification" content="${verificationCode}" />`;
        html = html.replace("<head>", `<head>\n    ${metaTag}`);
      }
      
      // Inject dynamic, server-side rendered SEO meta tags
      html = await injectSeoMetadata(html, req.url);
      
      res.send(html);
    } catch (err) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on port ${PORT}`);
  });
}

export default app;
