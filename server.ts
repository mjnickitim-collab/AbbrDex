import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Helper to fetch blogs from Firestore REST API
async function getBlogsFromFirestore() {
  try {
    const res = await fetch("https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-f78e7/databases/ai-studio-fd31e368-e61b-4d50-87ab-58823b9be109/documents/blogs?pageSize=100");
    if (!res.ok) {
      console.error(`Firestore REST API returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents.map((doc: any) => {
      const fields = doc.fields || {};
      const title = fields.title?.stringValue || "";
      const draft = fields.draft?.booleanValue || false;
      return { title, draft };
    });
  } catch (err) {
    console.error("Error fetching blogs for sitemap:", err);
    return [];
  }
}

// Helper to fetch Google Site Verification code from Firestore REST API
async function getGoogleSiteVerification() {
  try {
    const res = await fetch("https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-f78e7/databases/ai-studio-fd31e368-e61b-4d50-87ab-58823b9be109/documents/site_settings/global");
    if (!res.ok) return "";
    const data = await res.json();
    return data.fields?.googleSiteVerification?.stringValue || "";
  } catch (err) {
    console.error("Error fetching google-site-verification:", err);
    return "";
  }
}

export { getGoogleSiteVerification };

// API endpoint to generate blog articles using Gemini
app.post("/api/generate-article", async (req: any, res: any) => {
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: "Keyword is required" });
  }

  try {
    const prompt = `You are an elite SEO specialist, professional copywriter, and ad-monetization strategist for the slang and definition authority website "whatsthatmean.com".
    Your ultimate goal is to write a highly exhaustive, engaging, and search-optimized blog article about the main keyword: "${keyword}". This article must satisfy search engines (Google Rank) and keep users on-page while maximizing Google AdSense clicks.
    
    Please strictly enforce the following rules:
    1. Title: The title MUST start with the main keyword followed by a colon and a compelling, catchy title.
       Example: "${keyword}: Why This Trending Term is Taking Over Social Media"
    2. Meta Description: Write a high-CTR meta description under 160 characters. It MUST explicitly contain the exact keyword "${keyword}".
    3. Heading Hierarchy and Structure:
       - Start with an H1 main title (this matches the title field).
       - The body content must use ## (H2) for primary section headings, ### (H3) for nested subheadings, and #### (H4) if needed. Ensure perfect nesting hierarchy.
       - You must write at least 3 to 4 or more distinct subheadings (H2).
       - Each section under an H2 subheading must be substantial, thorough, and extensive—approximately 500 words or characters of high-quality, fully detailed content (not short summaries) explaining the slang definition, deep historical origin, evolution, social media and texting context, and cultural impact.
    4. Ad Optimization (AdSense placeholders):
       - Insert exactly 2 to 3 "[AD]" placeholders (strictly in uppercase as "[AD]") placed strategically on empty lines between text paragraphs (never inside headings or sentences) to monetize the article's traffic.
    5. Feature Image Selection:
       - Find and select an extremely relevant, high-resolution Unsplash image related to communication, texting, smartphone usage, social relationships, or internet culture. Use one of these high-quality, verified Unsplash photos:
         - Mobile/texting/friends: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80"
         - Online/social communication: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
         - Gen Z/smartphone/lifestyle: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80"
         - Neon/cyber/internet: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80"
         - Or any other valid Unsplash photo URL if more appropriate for the topic.
       - Alt Text: Generate a descriptive, keyword-rich imageAlt text. The alt text MUST naturally include the keyword "${keyword}".
    6. Content Features: Use rich formatting: **bold** for key terms, bulleted lists for clear takeaways, blockquotes (>) for real-life text messages or dialogues illustrating how "${keyword}" is used in context, and internal links (e.g. "[Explore whatsthatmean](/browse?search=KEYWORD)" or "[YOLO](/browse?search=YOLO)") where applicable.

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

// Serve assets / static app (Production container server only, not run on Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV === "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on port ${PORT}`);
  });
}

export default app;
