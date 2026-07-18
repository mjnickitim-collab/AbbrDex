import app from "./server";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { getGoogleSiteVerification, injectSeoMetadata } from "./server";

const PORT = 3000;

async function startDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  
  // Serve static assets and run Vite middleware first
  app.use(vite.middlewares);

  // Fallback for all other GET requests (SPA client-side routing)
  app.get("*", async (req, res, next) => {
    // Skip API routes and sitemap
    if (req.url.startsWith("/api/") || req.url === "/sitemap.xml") {
      return next();
    }
    try {
      const url = req.originalUrl || req.url;
      const indexHtmlPath = path.join(process.cwd(), "index.html");
      let html = await fs.promises.readFile(indexHtmlPath, "utf-8");
      
      // Inject Google site verification meta tag
      const verificationCode = await getGoogleSiteVerification();
      if (verificationCode) {
        const metaTag = `<meta name="google-site-verification" content="${verificationCode}" />`;
        html = html.replace("<head>", `<head>\n    ${metaTag}`);
      }

      // Inject dynamic, server-side rendered SEO meta tags
      html = await injectSeoMetadata(html, url);

      // Transform index.html through Vite to inject HMR and module resolution scripts
      html = await vite.transformIndexHtml(url, html);
      
      return res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (err) {
      return next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Development server running on http://localhost:${PORT}`);
  });
}

startDevServer();
