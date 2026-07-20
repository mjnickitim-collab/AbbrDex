export default function handler(req, res) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://whatsthatmean.com/</loc>
      <priority>1.0</priority>
    </url>
  </urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
