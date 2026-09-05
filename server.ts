import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, where, limit } from "firebase/firestore";
import { generateTermArticle } from "./src/utils/termArticleGenerator";
import { PUBLISHED_BLOGS } from "./src/data/publishedBlogs";
import { TERMS } from "./src/data/seedData";

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
  const fallbackList = PUBLISHED_BLOGS.map(b => ({
    id: b.id,
    title: b.title || "",
    draft: b.draft || false,
    excerpt: b.excerpt || "",
    content: b.body || "",
    seoTitle: b.seoTitle || "",
    metaDescription: b.metaDescription || "",
    category: b.cat || "General",
    date: b.date || "",
    slug: b.slug || "",
    createdAt: { seconds: (b as any).createdAtSeconds || 0 }
  }));

  return withFirestoreTimeout((async () => {
    const blogsCol = collection(firestoreDb, "blogs");
    const snapshot = await getDocs(blogsCol);
    if (snapshot.empty) {
      return fallbackList;
    }
    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        draft: data.draft || false,
        excerpt: data.excerpt || "",
        content: data.body || data.content || "",
        seoTitle: data.seoTitle || "",
        metaDescription: data.metaDescription || "",
        category: data.cat || data.category || "General",
        date: data.date || "",
        slug: data.slug || "",
        createdAt: data.createdAt
      };
    });

    // Sort in memory safely
    list.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return list.length > 0 ? list : fallbackList;
  })(), 3500, fallbackList);
}

// Helper to fetch a single term by its code securely from Firestore
async function getTermFromFirestoreByCode(code: string) {
  const normalizedCode = (code || "").toUpperCase().trim();
  const dbTerm = await withFirestoreTimeout((async () => {
    const termsCol = collection(firestoreDb, "terms");
    const q = query(termsCol, where("code", "==", normalizedCode), limit(1));
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

  if (dbTerm) return dbTerm;

  // Immediate static seed fallback (ensures 100% SSR coverage for all 4,500+ terms including sports & countries)
  const found = TERMS.find((t: any) => t.code && t.code.toUpperCase().trim() === normalizedCode);
  if (found) {
    return {
      code: found.code,
      full: found.full,
      cat: found.cat,
      ex: found.ex
    };
  }
  return null;
}

// Helper to fetch slang terms and emojis from Firestore securely using Firebase JS SDK (without costly database-side sorting)
async function getTermsFromFirestore() {
  const dbTerms = await withFirestoreTimeout((async () => {
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

  return dbTerms.length > 0 ? dbTerms : TERMS;
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
      bodyArticleHtml = `
        <div id="ssr-about-article" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">About Whatsthatmean</h1>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">Human-Curated Digital Reference Portal • Established 2026</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>Whatsthatmean.com</strong> was founded with a singular educational mission: to provide clear, verified, and culturally accurate interpretations of modern digital shorthand, online slang, gaming abbreviations, and corporate acronyms.
          </p>
          <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 28px; margin-bottom: 12px;">Our Lexicographical Approach</h2>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            Unlike automated scraper sites, every entry in our 4,400+ abbreviation dictionary is manually evaluated by human lexicographers. We cross-reference conversational data across digital platforms (TikTok, Discord, Reddit, corporate Slack channels) to capture tone, nuances, and generational shifts.
          </p>
          <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 28px; margin-bottom: 12px;">Contact Our Editorial Team</h2>
          <p style="font-size: 15px; color: #334155;">
            Have questions, feedback, or need a correction? Reach us directly at <a href="mailto:contact@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">contact@whatsthatmean.com</a> or visit our <a href="/contact" style="color: #4f46e5; font-weight: 600;">Contact Us page</a>.
          </p>
        </div>
      `;
    } else if (pathname === "/editorial") {
      title = "Editorial Policy | whatsthatmean - Quality & Verification Standards";
      desc = "Read our editorial standards ensuring all definitions, etymologies, and usage examples published on whatsthatmean.com are accurate, human-written, and neutral.";
      bodyArticleHtml = `
        <div id="ssr-editorial-article" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Editorial Standards & Fact-Checking Policy</h1>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">Ensuring High Utility, Original Research & Neutrality</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Whatsthatmean.com maintains rigorous editorial oversight across our entire lexicographical repository. We prioritize reader trust and factual reliability through a 5-step verification workflow:
          </p>
          <ol style="padding-left: 24px; font-size: 15px; color: #334155; margin-bottom: 24px;">
            <li style="margin-bottom: 8px;"><strong>Corpus Cross-Referencing:</strong> Verification against conversational corpora and digital messaging archives.</li>
            <li style="margin-bottom: 8px;"><strong>Contextual Distinction:</strong> Distinguishing between sincere, sarcastic, and platform-specific meanings.</li>
            <li style="margin-bottom: 8px;"><strong>Original Explanations:</strong> Comprehensive breakdowns of pronunciation, nuance, and grammatical category written by human authors.</li>
            <li style="margin-bottom: 8px;"><strong>Regular Auditing:</strong> Bi-weekly reviews of trending slang and changing meanings.</li>
            <li style="margin-bottom: 8px;"><strong>Reader Corrections SLA:</strong> Community correction inquiries addressed within 24 to 48 hours.</li>
          </ol>
        </div>
      `;
    } else if (pathname === "/privacy") {
      title = "Privacy Policy & Advertising Disclosures | whatsthatmean";
      desc = "Privacy Policy for whatsthatmean.com. Details our data handling, Google AdSense cookies, third-party advertising partners, opt-out choices, GDPR, and CCPA.";
      bodyArticleHtml = `
        <div id="ssr-privacy-article" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Privacy Policy</h1>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">Last Updated: September 2026 • Legal & Advertising Disclosure</p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            This Privacy Policy explains how <strong>Whatsthatmean.com</strong> collects, uses, and safeguards information when you visit our website.
          </p>

          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">1. Information We Collect & Log Files</h2>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            Whatsthatmean.com uses standard web server log files. The information gathered includes Internet Protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamps, referring/exit pages, and click statistics. This technical data is not linked to personally identifiable information.
          </p>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">2. Google AdSense & Third-Party Advertising Disclosures</h2>
            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 12px;">
              Whatsthatmean.com is funded by third-party advertising partners, primarily <strong>Google AdSense</strong>.
            </p>
            <ul style="padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
              <li style="margin-bottom: 8px;"><strong>Third-party vendors, including Google, use cookies</strong> to serve ads based on a user's prior visits to Whatsthatmean.com or other websites.</li>
              <li style="margin-bottom: 8px;"><strong>Google's use of advertising cookies (including the DoubleClick DART cookie)</strong> enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.</li>
              <li style="margin-bottom: 8px;">Whatsthatmean.com has no control over these third-party advertiser cookies.</li>
            </ul>
            <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">How Users Can Opt Out of Personalized Advertising:</p>
            <p style="font-size: 14px; color: #334155; margin-bottom: 12px;">
              You may opt out of personalized advertising by visiting:
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 14px; background: #e0e7ff; color: #4338ca; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">Google Ads Settings (adssettings.google.com) ↗</a>
              <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 14px; background: #e0e7ff; color: #4338ca; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">AboutAds.info Choices ↗</a>
              <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 14px; background: #e0e7ff; color: #4338ca; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">Network Advertising Initiative Opt-Out ↗</a>
            </div>
          </div>

          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">3. GDPR, CCPA & Data Rights</h2>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            We respect the privacy rights of all users, including European GDPR rights and California CCPA rights. We do not sell or rent personal information. To request data deletion or inquire about our privacy policies, contact <a href="mailto:privacy@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">privacy@whatsthatmean.com</a>.
          </p>

          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px;">4. Contact Us</h2>
          <p style="font-size: 15px; color: #334155;">
            For privacy-related inquiries, reach out to our team at <a href="mailto:contact@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">contact@whatsthatmean.com</a>.
          </p>
        </div>
      `;
    } else if (pathname === "/terms") {
      title = "Terms of Service | whatsthatmean - User Agreement";
      desc = "Terms of Service governing your access to and use of whatsthatmean.com dictionary portal and reference content.";
      bodyArticleHtml = `
        <div id="ssr-terms-article" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Terms of Service</h1>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">Effective Date: 2026 • Whatsthatmean Reference Portal</p>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            By accessing Whatsthatmean.com, you agree to these Terms of Service. Content is provided for educational and linguistic reference purposes. Unauthorized scraping, automated harvesting, or commercial replication of our proprietary definitions without written permission is strictly prohibited.
          </p>
          <p style="font-size: 15px; color: #334155;">
            Questions regarding licensing or terms of use should be directed to <a href="mailto:contact@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">contact@whatsthatmean.com</a>.
          </p>
        </div>
      `;
    } else if (pathname === "/contact") {
      title = "Contact Us | whatsthatmean - Editorial Office & Support";
      desc = "Contact the editorial team at whatsthatmean.com for term suggestions, factual corrections, legal inquiries, advertising, and partnership opportunities.";
      bodyArticleHtml = `
        <div id="ssr-contact-article" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Contact Us</h1>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">Editorial Office, Term Corrections & Publisher Inquiries</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            We welcome inquiries, feedback, term corrections, and partnership proposals from our readers and industry partners.
          </p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Direct Inquiries</h2>
            <ul style="list-style: none; padding-left: 0; font-size: 15px; color: #334155; line-height: 2;">
              <li><strong>General & Editorial Desk:</strong> <a href="mailto:contact@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">contact@whatsthatmean.com</a></li>
              <li><strong>Privacy & Compliance:</strong> <a href="mailto:privacy@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">privacy@whatsthatmean.com</a></li>
              <li><strong>Advertising & Partnerships:</strong> <a href="mailto:ads@whatsthatmean.com" style="color: #4f46e5; font-weight: 600;">ads@whatsthatmean.com</a></li>
            </ul>
          </div>
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Editorial SLA</h2>
          <p style="font-size: 15px; color: #334155;">
            Our editorial staff reviews all incoming queries and factual correction requests within 24 to 48 business hours.
          </p>
        </div>
      `;
    } else if (pathname === "/browse") {
      title = "Explore Dictionary | whatsthatmean - Find Abbreviations & Meanings";
      desc = "Browse through hundreds of curated acronyms, digital shorthand, and slang meanings. Filter by category or search terms instantly.";
    } else if (pathname === "/quiz") {
      title = "Interactive Acronym Quiz | whatsthatmean - Test Your Slang Knowledge";
      desc = "Think you know modern slang and business terminology? Challenge yourself with our challenging, adaptive abbreviation quizzes.";
    } else if (pathname === "/blog") {
      title = "Word Feed Blog | whatsthatmean - Insightful Slang Articles & Trends";
      desc = "Stay up to date with deep-dives into modern internet culture, business acronym origins, and the evolution of digital shorthand.";

      const blogs = await getBlogsFromFirestore();
      const publishedBlogs = blogs.filter((b: any) => !b.draft);

      bodyArticleHtml = `
        <div id="ssr-blog-list" style="max-width: 1080px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
          <header style="margin-bottom: 32px;">
            <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Word Feed Blog</h1>
            <p style="color: #64748b; font-size: 16px;">Explore comprehensive guides and insights on the evolution of internet slang, business jargon, and digital communication patterns.</p>
          </header>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
            ${publishedBlogs.map((post: any) => {
              const slug = post.slug || (post.title || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
              return `
                <article style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <div style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 8px;">${post.category || 'Article'} • ${post.date || 'whatsthatmean'}</div>
                  <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;"><a href="/blog/${slug}" style="color: #0f172a; text-decoration: none;">${post.title}</a></h2>
                  <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px;">${post.excerpt || ''}</p>
                  <a href="/blog/${slug}" style="color: #4338ca; font-size: 13px; font-weight: 700; text-decoration: none;">Read Full Article →</a>
                </article>
              `;
            }).join("")}
          </div>
        </div>
      `;
    } else if (pathname === "/emoji") {
      title = "Emoji Meanings & Dictionary | whatsthatmean";
      desc = "Browse modern emojis, their actual slang meanings, examples, and texting context in our ultimate real-time emoji dictionary.";
    } else if (pathname.startsWith("/browse/")) {
      const category = decodeURIComponent(pathname.substring(8)).toLowerCase();
      if (category === "sports") {
        title = "Sports & Football Team Abbreviations Dictionary (EPL, Clubs & Rules) | whatsthatmean";
        desc = "Discover 3-letter football club abbreviations (ARS, MCI, CHE, FCB, RMA), World Cup country codes, and match acronyms (VAR, FT, xG) decoded with real examples.";
      } else if (category === "business") {
        title = "Business Acronyms & Workplace Slang Dictionary (SOP, KPI, ROI, EOD) | whatsthatmean";
        desc = "Comprehensive dictionary of business acronyms, corporate operations shorthand, financial metrics, and executive meeting abbreviations.";
      } else if (category === "countries") {
        title = "Country Codes & FIFA 3-Letter Abbreviations Directory | whatsthatmean";
        desc = "Browse official 3-letter country codes, ISO nation standards, and international tournament abbreviations decoded with full names.";
      } else {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        title = `${categoryName} Abbreviations & Meanings | whatsthatmean`;
        desc = `Explore the best dictionary for ${categoryName} abbreviations, acronyms, and modern chat terms. Learn their meanings and real-world examples.`;
      }
    } else if (pathname.startsWith("/blog/")) {
      const rawSlug = pathname.substring(6);
      const slug = decodeURIComponent(rawSlug).replace(/\/+$/, "").trim().toLowerCase();
      const blogs = await getBlogsFromFirestore();
      const foundBlog = blogs.find((b: any) => {
        const s = (b.slug || (b.title || "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")).toLowerCase().trim();
        return s === slug || b.id === rawSlug || (b.slug && b.slug.toLowerCase() === slug);
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

        // Build SSR HTML text block for blog posts
        bodyArticleHtml = `
          <div id="ssr-blog-article">
            <article style="max-width: 800px; margin: 0 auto; padding: 24px; font-family: sans-serif; line-height: 1.6;">
              <header>
                <p style="color: #4f46e5; font-weight: bold; text-transform: uppercase; font-size: 14px;">${foundBlog.category || 'Article'}</p>
                <h1 style="font-size: 32px; margin: 12px 0;">${foundBlog.title}</h1>
                <p style="color: #64748b; font-size: 14px;">Published on ${foundBlog.date || 'whatsthatmean'}</p>
              </header>
              ${foundBlog.excerpt ? `<p style="font-size: 18px; color: #334155; font-weight: 500; margin: 16px 0;">${foundBlog.excerpt}</p>` : ''}
              <div style="font-size: 16px; color: #1e293b; margin-top: 20px;">
                ${(foundBlog.content || '').split('\n\n').map((p: string) => `<p style="margin-bottom: 16px;">${p}</p>`).join('')}
              </div>
            </article>
          </div>
        `;
      }
    } else if (pathname.startsWith("/term/")) {
      const code = decodeURIComponent(pathname.substring(6)).toUpperCase();
      const foundTerm = await getTermFromFirestoreByCode(code);
      if (foundTerm) {
        const categoryName = foundTerm.cat ? (foundTerm.cat.charAt(0).toUpperCase() + foundTerm.cat.slice(1)) : "Slang";
        const articleData = generateTermArticle(foundTerm);
        const codeUpper = foundTerm.code.toUpperCase();

        if (foundTerm.cat === "sports") {
          title = `${codeUpper} Meaning: What Does ${codeUpper} Stand For in Football & Sports? | whatsthatmean`;
          desc = `What does ${codeUpper} mean in football and sports? ${codeUpper} stands for "${foundTerm.full}". Discover its full definition, scoreboard usage, and real examples.`;
        } else if (foundTerm.cat === "countries") {
          title = `${codeUpper} Country Code: What Country Does ${codeUpper} Stand For? | whatsthatmean`;
          desc = `What country is ${codeUpper}? ${codeUpper} is the official 3-letter FIFA and ISO country code for "${foundTerm.full}". Learn its international tournament usage.`;
        } else if (foundTerm.cat === "business") {
          title = `${codeUpper} Meaning: What Does the Business Acronym ${codeUpper} Stand For? | whatsthatmean`;
          desc = `What does ${codeUpper} stand for in business operations? It means "${foundTerm.full}". Discover its corporate definition, workflow context, and real examples.`;
        } else {
          title = `${foundTerm.code} Meaning: What Does ${foundTerm.code} Mean? | whatsthatmean`;
          desc = `What does ${foundTerm.code} stand for? It means "${foundTerm.full}". Learn its definition, etymology, tone guide, and see real-world texting examples.`;
        }
        
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
          <div id="ssr-term-article">
            <article style="max-width: 800px; margin: 0 auto; padding: 24px; font-family: sans-serif; line-height: 1.6;">
              <h1 style="font-size: 32px; margin-bottom: 12px;">What Does ${foundTerm.code} Mean? Definition, Origin & Usage</h1>
              <p><strong>Spelled-out phrase:</strong> ${foundTerm.full}</p>
              <p><strong>Category:</strong> ${categoryName}</p>
              <h2>Overview</h2>
              <p>${articleData.overview}</p>
              <h2>Etymology & History</h2>
              <p>${articleData.etymology}</p>
              <h2>Usage Scenarios</h2>
              ${articleData.usageScenarios.map(s => `<h3>${s.title}</h3><p>${s.desc}</p><pre style="background: #f1f5f9; padding: 12px; border-radius: 8px;">${s.example}</pre>`).join("")}
              <h2>Comparisons</h2>
              ${articleData.comparisons.map(c => `<h3>${c.term}</h3><p>${c.difference}</p>`).join("")}
              <h2>Common Pitfalls</h2>
              <ul>${articleData.pitfalls.map(p => `<li>${p}</li>`).join("")}</ul>
              <h2>Cultural Context</h2>
              <p>${articleData.culturalLore}</p>
              <h2>Frequently Asked Questions</h2>
              ${articleData.faqs.map(f => `<details style="margin-bottom: 12px;"><summary style="font-weight: bold; cursor: pointer;">${f.question}</summary><p style="margin-top: 6px;">${f.answer}</p></details>`).join("")}
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

// Helper to safely escape strings for HTML attributes
function escapeHtmlAttr(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Injects dynamic metadata tags in HTML head and body
async function injectSeoMetadata(html: string, urlPath: string): Promise<string> {
  const { title, desc, schemaMarkup, bodyArticleHtml } = await getSeoMetadata(urlPath);
  
  let updatedHtml = html;
  const escapedTitle = escapeHtmlAttr(title);
  const escapedDesc = escapeHtmlAttr(desc);
  
  // Replace standard tags cleanly
  updatedHtml = updatedHtml.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  updatedHtml = updatedHtml.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapedDesc}" />`);
  updatedHtml = updatedHtml.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapedTitle}" />`);
  updatedHtml = updatedHtml.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapedDesc}" />`);
  
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
    const prompt = `You are a top-tier expert SEO copywriter, Google AdSense revenue optimization specialist, and Growth Marketing Director specializing in creating top-ranking Google Search content with exceptional content depth (Depth) and reader readability (Readability).

Your mission is to write an IN-DEPTH, EXHAUSTIVE, ORIGINAL, and HIGHLY ENGAGING blog article about the topic/keyword: "${keyword}".
Never produce a shallow summary ("Thin Content"). Write like a seasoned industry expert delivering a masterclass feature article.

TARGET LENGTH: 1,800 to 2,500 WORDS (strictly measured by WORD COUNT, NOT character count, matching top 10 Google search results).

================================================================================
1. TONE, VOICE & STYLE ("PROFESSIONAL YET APPROACHABLE")
================================================================================
- Authority & Trust: Demonstrate deep domain expertise and authority while remaining warm, accessible, and friendly.
- Peer-to-Peer Tone: Speak to the reader like an experienced, helpful colleague explaining complex ideas clearly—never patronizing or preachy.
- Jargon Clarity: Whenever specialized jargon or technical terms are introduced, immediately accompany them with a simple, intuitive explanation.
- Decisive & Warm Endings: Sentences should conclude with clear conviction and warmth.
- Native English: Written in 100% fluent, native-level English. Absolutely zero translation awkwardness or machine-generated feel.

================================================================================
2. TOPIC-SPECIFIC CUSTOM STRUCTURE (NO COOKIE-CUTTER TEMPLATES)
================================================================================
- DEEP TOPIC ANALYSIS: Analyze "${keyword}" to identify its true real-world domain (e.g., Global Sports Events, Financial Markets, Tech/AI, Health & Wellness, World History/News, or Slang/Acronyms).
- NO GENERIC HEADINGS: Strictly forbidden from using generic boilerplate headers like "Practical Scenario A/B", "Executive Summary", "Fundamental Principles", or "Slang Meaning".
- CRAFT 5–6 UNIQUE, TOPIC-SPECIFIC H2 & H3 HEADINGS:
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

================================================================================
3. INTERNAL PRE-RESEARCH & CONCRETE DEPTH (STEP 0 SIMULATION)
================================================================================
- Search Intent: Address the exact searcher intent (Informational, Transactional, Navigational).
- Sub-Topic Breakdown: Address 5–8 critical sub-questions (e.g., background history, core mechanics, comparative breakdown, practical applications, costs/risks, real-world case studies, future trends, FAQs).
- Specific Facts & Figures: Include specific statistics, years, concrete data points, or real-world comparison examples in at least 3 places (avoid vague generalities).
- ABSOLUTELY FORBIDDEN CLICHES:
  * "In today's fast-paced world"
  * "It is important to note that"
  * "Needless to say"
  * "At the end of the day"
  * "In conclusion" (Allowed AT MOST 1 time in the entire article)
- NO DISCLAIMER: Do NOT include any "Disclaimer:", "YMYL Disclaimer", or legal notice text at the end or anywhere in the article.

================================================================================
4. READABILITY, PACING & FORMATTING RULES
================================================================================
1. Sentence Length:
   - Sentences with 20+ words MUST NOT exceed 15% of total sentences.
   - Over 75% of sentences must be under 15 words. Break complex sentences with clean periods.
2. Transition Words:
   - Use natural transition words (e.g., Therefore, Moreover, However, In contrast, For example, As a result, In fact, Meanwhile, Furthermore, In short, Ultimately, That said, Consequently, In addition, To sum up) in at least 30% of sentences.
   - Limit transition word density to 1–2 per paragraph to avoid unnatural repetition.
3. Paragraph Pacing:
   - Keep paragraphs short (maximum 5–6 lines / 100–120 words per paragraph) for mobile ease.
   - Each H2 section should be ~250–400 words to provide natural visual pacing for AdSense ad insertion.
4. Introduction Hook & Key Takeaways:
   - Introduction (first 100–150 words): Start with a compelling hook and an immediate summary answering search intent.
   - Key Takeaways: Include a 3–5 point summary bullet list using standard Markdown dashes (- Point) BEFORE the first H2 heading.
5. Content Elements & Formatting Strict Rules (STRICT PURE MARKDOWN ONLY):
   - ABSOLUTELY NO RAW HTML TAGS: Strictly forbidden from writing raw HTML tags in the text like blockquote, ul, li, strong, or p. Always use standard Markdown formatting!
   - BLOCKQUOTES SYNTAX: For quotes, expert insights, or case studies, use standard Markdown quote syntax starting with a greater-than symbol (> ) (e.g., > "AI tools do not replace human marketing strategy..."). NEVER write raw HTML blockquote tags!
   - BULLET LISTS SYNTAX: Use standard Markdown dashes (- ) or asterisks (* ) for bullet lists.
   - BOLD TEXT SYNTAX: Use double asterisks (**text**) for bolding key terms.
   - NO MARKDOWN TABLES: Strictly forbidden from generating Markdown tables (using |---|---|). Tables frequently break and misalign on mobile viewports. Instead, represent comparative data, metrics, or summaries using clean Markdown bulleted lists (- ), numbered lists, bold key-value pairs (e.g., **Key Feature**: Explanation), or Markdown blockquotes (> ).
   - Active Voice: Maintain active voice in over 90% of sentences.
   - Key Terminology: Use **bold** for important keywords and concepts.
   - FAQ Section Formatting (CRITICAL):
     * Near the end, include an "## Frequently Asked Questions (FAQ)" heading.
     * Include 3 to 5 long-tail questions using H3 format: "### Q: [Question text]".
     * MANDATORY SPACING: You MUST insert a full blank line (empty newline) between the "### Q: [Question]" header and the answer paragraph.
     * MANDATORY SPACING: You MUST insert a full blank line after the answer paragraph before starting the next question.
     * Example FAQ format:
       ## Frequently Asked Questions (FAQ)

       ### Q: What makes this topic important for readers today?

       Understanding this concept allows readers to make informed decisions by providing clear, actionable insights...

       ### Q: How can I stay updated on future developments?

       You can follow authoritative industry sources and explore our dictionary portal...

================================================================================
6. LINKING & ADSENSE ADS PLACEMENT
================================================================================
- Internal Links (STRICT CONTEXTUAL RELEVANCE RULES):
  * Do NOT force unnatural or irrelevant internal links. Include internal links ONLY if they naturally fit the article context.
  * ABSOLUTE RESTRICTION FOR GENERAL TOPICS: If "${keyword}" is a general topic (e.g., sports events like World Cup, financial markets, technology, health, news) and NOT an internet slang term or acronym, you MUST NOT include links to Slang/Acronym Quizzes (/quiz), Emoji Dictionaries (/emoji), or slang reference pages.
  * Allowed optional internal links ONLY when relevant:
    - Main Blog Hub: [whatsthatmean Blog](https://www.whatsthatmean.com/blog)
    - Term Search (only if search/lookup is genuinely applicable): [Search "${keyword}"](https://www.whatsthatmean.com/?search=${encodeURIComponent(keyword)})
  * If no internal link fits naturally without feeling forced, do NOT include any internal link.
- External Links (1–2 authoritative, relevant HTTPS links):
  - Must point to an established domain matching the topic (e.g. https://www.fifa.com, https://en.wikipedia.org, https://www.investopedia.com, https://www.cdc.gov, https://developer.mozilla.org, https://www.merriam-webster.com).
- AdSense Ad Placeholders:
  - Insert EXACTLY THREE (3) "[AD]" placeholders on empty lines between major sections (e.g., after the intro summary, after section 3, and before the FAQ). Strictly format as "[AD]" on its own line.
- AdSense Policy Compliance: Zero ad click incentive phrases, zero clickbait or exaggerated claims.

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
            description: "In-depth, rich markdown article (1,800 to 2,500 words) with custom topic-tailored H2/H3 subheadings, detailed paragraphs, summary bullet list, blockquotes, internal links, external authoritative links, and 3 [AD] tags (no disclaimer)."
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

    const isAuthErr = (err: any) => {
      const msg = (err?.message || err?.toString() || "").toLowerCase();
      return msg.includes("unauthenticated") || msg.includes("401") || msg.includes("invalid authentication") || msg.includes("access_token_type_unsupported") || msg.includes("api_key_invalid");
    };

    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: generationConfig
      });
    } catch (modelError: any) {
      console.warn("Primary model gemini-3.6-flash failed, attempting fallback to gemini-3.1-pro-preview:", modelError?.message || modelError);
      if (isAuthErr(modelError)) {
        return res.status(401).json({
          error: "GEMINI_API_KEY_INVALID: 서버 환경변수(Vercel Environment Variables)에 설정된 GEMINI_API_KEY가 올바르지 않거나 401 인증 오류가 발생하였습니다. Vercel 설정에서 유효한 Gemini API 키를 다시 등록해 주세요."
        });
      }
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
        if (isAuthErr(fallbackError)) {
          return res.status(401).json({
            error: "GEMINI_API_KEY_INVALID: 서버 환경변수(Vercel Environment Variables)에 설정된 GEMINI_API_KEY가 올바르지 않거나 401 인증 오류가 발생하였습니다. Vercel 설정에서 유효한 Gemini API 키를 다시 등록해 주세요."
          });
        }
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
    
    const slug = blog.slug || (blog.title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    
    if (!slug) return;
    
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
