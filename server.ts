import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBrYD4DhTBLEDblWXXzPyLEUlyOkMRyS4w",
  authDomain: "ai-studio-applet-webapp-f78e7.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-f78e7",
  storageBucket: "ai-studio-applet-webapp-f78e7.firebasestorage.app",
  messagingSenderId: "717940026511",
  appId: "1:717940026511:web:f4aecc4e9a0132257914fa"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-fd31e368-e61b-4d50-87ab-58823b9be109");

// Helper to fetch blogs from Firestore SDK
async function getBlogsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "blogs"));
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        title: data.title || "",
        draft: data.draft || false,
      });
    });
    return list;
  } catch (err) {
    console.error("Error fetching blogs for sitemap:", err);
    return [];
  }
}

// Helper to fetch Google Site Verification code from Firestore SDK
async function getGoogleSiteVerification() {
  try {
    const docSnap = await getDoc(doc(db, "site_settings", "global"));
    if (docSnap.exists()) {
      return docSnap.data()?.googleSiteVerification || "";
    }
    return "";
  } catch (err) {
    console.error("Error fetching google-site-verification:", err);
    return "";
  }
}

// API endpoint to generate blog articles using Gemini
app.post("/api/generate-article", async (req: any, res: any) => {
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: "Keyword is required" });
  }

  try {
    const prompt = `You are an expert copywriter and SEO content developer for the website "whatsthatmean.com".
    Your task is to write a highly informative, entertaining, and search-optimized blog article about the keyword or concept: "${keyword}".
    
    The response MUST be a JSON object with the following fields:
    - title: A catchy, professional blog post title incorporating the keyword.
    - excerpt: A compelling 1-2 sentence search result summary / meta description.
    - body: The complete article body content. Write this in a beautifully styled, friendly, highly scannable format. You can use:
      - ## Heading 2 for sections
      - **bold text** for emphasis
      - - Bulleted lists
      - 1. Numbered lists
      - [Text Link](/browse?search=ABBREVIATION) to link to other abbreviations in our slang dictionary
      - > Blockquotes for examples or quotes
      - [info] Educational/informational alert banners
      - [ad:In-content — after hero] or [ad:Between quiz questions] or [ad:Sidebar] to strategically embed ad slot placeholders in the body of the text.
    - seoTitle: A perfect, punchy SEO title (max 60 characters).
    - metaDescription: A search snippet meta description (max 160 characters).
    - keywords: A string of 3 to 5 relevant comma-separated keywords (e.g. "slang, gen z, communication").

    Make the body article extensive, structured, explaining the meaning, the origins, real-life examples of texting/social media dialogues, and a conclusion.
    Return ONLY a raw valid JSON object. Do not wrap it in markdown codeblocks.`;

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
});

// Dynamic Sitemap API
app.get("/sitemap.xml", async (req, res) => {
  const domain = "https://whatsthatmean.com";
  const dateStr = new Date().toISOString().split("T")[0];
  
  const blogs = await getBlogsFromFirestore();
  
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
  
  // Blog routes (excluding drafts)
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
  
  xml += `</urlset>\n`;
  
  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// Serve assets / static app
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    // Wildcard route for SPA fallback in development mode
    app.get("*", async (req, res, next) => {
      // Exclude API routes and files with extensions (like .js, .css, etc)
      if (req.path.startsWith("/api") || req.path.includes(".")) {
        return next();
      }

      try {
        const indexHtmlPath = path.join(process.cwd(), "index.html");
        let html = await fs.promises.readFile(indexHtmlPath, "utf-8");
        const verificationCode = await getGoogleSiteVerification();
        if (verificationCode) {
          const metaTag = `<meta name="google-site-verification" content="${verificationCode}" />`;
          html = html.replace("<head>", `<head>\n    ${metaTag}`);
        }
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).send(transformedHtml);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false })); // don't serve index.html directly
    
    app.get("*", async (req, res) => {
      try {
        const indexHtmlPath = path.join(distPath, "index.html");
        let html = await fs.promises.readFile(indexHtmlPath, "utf-8");
        const verificationCode = await getGoogleSiteVerification();
        if (verificationCode) {
          const metaTag = `<meta name="google-site-verification" content="${verificationCode}" />`;
          html = html.replace("<head>", `<head>\n    ${metaTag}`);
        }
        res.send(html);
      } catch (err) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
