import type { MetadataRoute } from "next";
import { GUIDES, guideUrl, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [`${SITE_URL}/opengraph-image`],
    },
    ...GUIDES.map((g) => ({
      url: guideUrl(g.slug),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: g.slug === "ocpp-simulator" ? 0.9 : 0.8,
      images: [`${guideUrl(g.slug)}/opengraph-image`],
    })),
  ];
}
