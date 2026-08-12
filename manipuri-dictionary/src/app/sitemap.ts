import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Fetch all approved words for sitemap (limit for now)
  try {
    const words = await prisma.$queryRaw<Array<{ slug: string }>>`
      SELECT DISTINCT w.slug
      FROM words w
      JOIN word_senses ws ON ws.word_id = w.id AND ws.status = 'approved'
      ORDER BY w.word
      LIMIT 10000
    `;

    const wordRoutes: MetadataRoute.Sitemap = words.map((w) => ({
      url: `${BASE_URL}/word/${w.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...routes, ...wordRoutes];
  } catch {
    return routes;
  }
}