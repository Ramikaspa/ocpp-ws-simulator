import type { Metadata } from "next";
import { AUTHOR, SITE_NAME } from "./site";

/**
 * Per-page metadata. Next.js replaces (not merges) nested objects such as
 * `openGraph`, so each page sets the full set: canonical, Open Graph and the
 * X/Twitter card, all pointing at the page's own URL and preview image.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  absoluteTitle = false,
  type = "website",
}: {
  title: string;
  description: string;
  /** Path from the site root, e.g. "/" or "/ocpp-simulator". */
  path: string;
  keywords?: string[];
  /** Use the title as-is instead of the "%s · site" template. */
  absoluteTitle?: boolean;
  type?: "website" | "article";
}): Metadata {
  const image = `${path === "/" ? "" : path}/opengraph-image`;
  const socialTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "en_US",
      siteName: SITE_NAME,
      url: path,
      title: socialTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      creator: AUTHOR.xHandle,
      site: AUTHOR.xHandle,
      images: [image],
    },
  };
}
