// News headlines via Google News RSS (no key). Server-side to avoid browser CORS.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=600");
  const q = (req.query.q || "FIFA World Cup 2026").toString().slice(0, 120);
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 KhelKelMain" } });
    const xml = await r.text();
    const items = [];
    const blocks = xml.split("<item>").slice(1);
    for (const b of blocks.slice(0, 18)) {
      const get = (tag) => {
        const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        if (!m) return "";
        return m[1].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      };
      let title = get("title");
      const link = get("link");
      const source = get("source") || (title.includes(" - ") ? title.split(" - ").pop() : "");
      if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3));
      const pubRaw = get("pubDate");
      const pubDate = pubRaw ? new Date(pubRaw).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      if (title && link) items.push({ title, link, source, pubDate });
    }
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(200).json({ items: [], error: String(e) });
  }
}
