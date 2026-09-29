import { renderOgImage } from "@/lib/og";
import { GUIDES, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} guide`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  // Titles read "Topic: detail" — the topic makes the headline, the detail the subtitle.
  const [headline, detail] = (guide?.title ?? SITE_NAME).split(": ");
  return renderOgImage({
    eyebrow: "Guide",
    title: headline,
    subtitle: detail,
  });
}
