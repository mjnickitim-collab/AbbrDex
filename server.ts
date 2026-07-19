import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// SEO 308 Redirect Middleware for non-canonical domains (e.g. Cloud Run .run.app URL)
app.use((req, res, next) => {
  const host = req.headers.host || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const isPreview = host.includes("aistudio") || host.includes("google");
  const isCanonical = host === "whatsthatmean.com" || host === "www.whatsthatmean.com";

  if (!isLocal && !isPreview && !isCanonical) {
    // 308 Permanent Redirect to canonical domain
    console.log(`Redirecting non-canonical host ${host} to whatsthatmean.com`);
    return res.redirect(308, `https://whatsthatmean.com${req.originalUrl}`);
  }
  next();
});

// Using process.cwd() as the project root for both local, container, and serverless runtimes
const projectRoot = process.cwd();

// Safely load Firebase Config from local json with fallbacks for local and serverless runtimes
let firebaseConfig: any;
try {
  // Statically analyzeable by Vercel NFT using process.cwd()
  const configPath = path.join(projectRoot, "firebase-applet-config.json");
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (err) {
  try {
    const configPath = path.join(projectRoot, "../firebase-applet-config.json");
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err2) {
    console.error("Critical error: Failed to load Firebase config on server, using hardcoded environment defaults:", err2);
    firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrYD4DhTBLEDblWXXzPyLEUlyOkMRyS4w",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-studio-applet-webapp-f78e7.firebaseapp.com",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "ai-studio-applet-webapp-f78e7",
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-studio-applet-webapp-f78e7.firebasestorage.app",
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "717940026511",
      appId: process.env.VITE_FIREBASE_APP_ID || "1:717940026511:web:f4aecc4e9a0132257914fa",
      firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-fd31e368-e61b-4d50-87ab-58823b9be109"
    };
  }
}

// Initialize server-side Firebase instance safely avoiding duplicate app error in serverless contexts
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Helper to lazily initialize Gemini SDK with telemetry User-Agent
let aiClient: GoogleGenAI | null = null;
function getGoogleGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MISSING_KEY",
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
  try {
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
        metaDescription: data.metaDescription || ""
      };
    });
  } catch (err) {
    console.error("Error fetching blogs for sitemap:", err);
    return [];
  }
}

// Helper to fetch slang terms and emojis from Firestore securely using Firebase JS SDK
async function getTermsFromFirestore() {
  try {
    const termsCol = collection(firestoreDb, "terms");
    const q = query(termsCol, orderBy("code", "asc"));
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
  } catch (err) {
    console.error("Error fetching terms for sitemap:", err);
    return [];
  }
}

// Helper to resolve SEO metadata based on URL path
async function getSeoMetadata(urlPath: string) {
  let title = "whatsthatmean | Ultimate Abbreviation, Acronym & Slang Dictionary";
  let desc = "Decode the world's abbreviations, modern chat acronyms, gaming shorthand, military codes, and business terminology. Take interactive quizzes and learn on whatsthatmean.";

  try {
    const pathname = urlPath.split("?")[0];

    if (pathname === "/" || pathname === "/home" || pathname === "") {
      title = "whatsthatmean | Home - Decode Chat, Gaming, Business & Military Slang";
      desc = "Discover trending abbreviations and modern acronyms. Search our real-time slang dictionary and test your knowledge.";
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
      }
    } else if (pathname.startsWith("/term/")) {
      const code = decodeURIComponent(pathname.substring(6)).toUpperCase();
      const terms = await getTermsFromFirestore();
      const foundTerm = terms.find((t: any) => t.code.toUpperCase() === code);
      if (foundTerm) {
        const categoryName = foundTerm.cat ? (foundTerm.cat.charAt(0).toUpperCase() + foundTerm.cat.slice(1)) : "Slang";
        title = `${foundTerm.code} Meaning: What Does ${foundTerm.code} Mean? | whatsthatmean`;
        desc = `What does ${foundTerm.code} stand for? It means "${foundTerm.full}". Learn its definition, category (${categoryName}), and see real-world texting examples like: "${foundTerm.ex || ""}"`;
      }
    }
  } catch (err) {
    console.error("Error generating SEO metadata:", err);
  }

  return { title, desc };
}

// Injects dynamic metadata tags in HTML head
async function injectSeoMetadata(html: string, urlPath: string): Promise<string> {
  const { title, desc } = await getSeoMetadata(urlPath);
  
  let updatedHtml = html;
  
  // Replace standard tags cleanly
  updatedHtml = updatedHtml.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  updatedHtml = updatedHtml.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${desc}" />`);
  updatedHtml = updatedHtml.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  updatedHtml = updatedHtml.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${desc}" />`);
  
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
app.post("/api/generate-article", async (req: any, res: any) => {
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: "Keyword is required" });
  }

  try {
    const prompt = `You are an elite SEO specialist, professional copywriter, and ad-monetization strategist.
    Your ultimate goal is to write a highly exhaustive, engaging, and search-optimized blog article about the main keyword: "${keyword}". The article MUST focus purely, faithfully, and extensively on this given keyword, its core topic, usage, and practical meaning, regardless of whether it is an internet slang, technical concept, lifestyle topic, or any other subject. Do not force slang or dictionary framing if the keyword points to a different subject. This article must satisfy search engines (Google Rank) and keep users on-page while maximizing Google AdSense clicks.
    
    Please strictly enforce the following rules:
    1. Title: The title MUST start with the main keyword followed by a colon and a compelling, catchy title.
       Example: "${keyword}: The Ultimate Comprehensive Guide and Latest Trends"
    2. Meta Description: Write a high-CTR meta description under 160 characters. It MUST explicitly contain the exact keyword "${keyword}".
    3. Heading Hierarchy and Structure:
       - Start with an H1 main title (this matches the title field).
       - The body content must use ## (H2) for primary section headings, ### (H3) for nested subheadings, and #### (H4) if needed. Ensure perfect nesting hierarchy.
       - You must write at least 3 to 4 or more distinct subheadings (H2).
       - Each section under an H2 subheading must be substantial, thorough, and extensive—approximately 500 words or characters of high-quality, fully detailed content (not short summaries) explaining the definition, deep concepts, historical background, evolution, practical context, real-world examples, and cultural or industry impact of "${keyword}".
    4. Ad Optimization (AdSense placeholders):
       - Insert exactly 2 to 3 "[AD]" placeholders (strictly in uppercase as "[AD]") placed strategically on empty lines between text paragraphs (never inside headings or sentences) to monetize the article's traffic.
    5. Feature Image Selection:
       - Find and select an extremely relevant, high-resolution Unsplash image related to "${keyword}". Use one of these high-quality, verified Unsplash photos if applicable, or specify any other valid, topic-appropriate Unsplash photo URL (e.g. from Source Unsplash):
         - Tech/Business/Modern: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
         - Mobile/Texting/Social: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80"
         - Lifestyle/Friends: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80"
         - Modern Abstract/Neon: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80"
         - Or any other valid Unsplash photo URL if more appropriate for the topic.
       - Alt Text: Generate a descriptive, keyword-rich imageAlt text. The alt text MUST naturally include the keyword "${keyword}".
    6. Content Features: Use rich formatting: **bold** for key terms, bulleted lists for clear takeaways, blockquotes (>) for real-life examples, scenarios, or dialogues illustrating "${keyword}", and internal links where appropriate (e.g., "[whatsthatmean](/)").

    The response MUST be a JSON object with the exact fields below:
    - title: The generated catchy blog title starting with "${keyword}: ".
    - excerpt: A compelling, high-CTR 1-2 sentence search engine summary.
    - body: The full markdown content containing H2 headings, H3 subheadings, detailed paragraphs (approx. 500 words/chars per section), lists, text examples in blockquotes, and strategically placed [AD] tags.
    - seoTitle: A perfect SEO title tag (max 60 characters), preferably matching or resembling the main title.
    - metaDescription: A search snippet under 160 characters containing "${keyword}".
    - keywords: A string of 3-5 comma-separated SEO keywords (e.g., "${keyword}, slang meaning, Gen Z slang, internet dictionary").
    - imageUrl: The selected Unsplash image URL.
    - imageAlt: The keyword-rich image description.

    Return ONLY a raw valid JSON object. Do not wrap it in markdown codeblocks.`;

    const ai = getGoogleGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const generatedData = JSON.parse(text);

    return res.json(generatedData);
  } catch (error: any) {
    console.error("Gemini article generation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate article" });
  }
});// Dynamic Sitemap API
app.get("/sitemap.xml", async (req, res) => {
  const domain = "https://whatsthatmean.com";
  const dateStr = new Date().toISOString().split("T")[0];
  
  // Fetch real-time blogs and terms from database concurrently
  const [blogs, terms] = await Promise.all([
    getBlogsFromFirestore(),
    getTermsFromFirestore()
  ]);
  
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
  
  res.header("Content-Type", "application/xml");
  res.header("Cache-Control", "public, max-age=0, must-revalidate");
  res.send(xml);
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
