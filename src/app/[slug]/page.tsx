import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_CONTENT } from "@/components/guides/registry";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { GUIDES, guideUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  authorNode,
  breadcrumbs,
  faqPage,
  ids,
  websiteNode,
} from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }> };

/** Only the guides listed in site.ts exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

const findGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return {};
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/${guide.slug}`,
    keywords: guide.keywords,
    type: "article",
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = findGuide(slug);
  const content = GUIDE_CONTENT[slug];
  if (!guide || !content) notFound();

  const { Body, faqs, related } = content;
  const url = guideUrl(guide.slug);
  const relatedGuides = related
    .map(findGuide)
    .filter((g): g is (typeof GUIDES)[number] => Boolean(g));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TechArticle",
              "@id": `${url}#article`,
              headline: guide.title,
              description: guide.description,
              url,
              mainEntityOfPage: url,
              image: `${url}/opengraph-image`,
              inLanguage: "en",
              keywords: guide.keywords.join(", "),
              author: { "@id": ids.author },
              publisher: { "@id": ids.author },
              isPartOf: { "@id": ids.website },
              about: { "@id": ids.app },
            },
            breadcrumbs([
              { name: SITE_NAME, url: SITE_URL },
              { name: guide.nav, url },
            ]),
            faqPage(faqs),
            websiteNode,
            authorNode,
          ],
        }}
      />

      <article className="mx-auto max-w-3xl px-4 pt-8 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-t-muted">
            <li>
              <Link href="/" className="hover:text-t-primary">
                Simulator
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3" />
            </li>
            <li aria-current="page" className="text-t-secondary">
              {guide.nav}
            </li>
          </ol>
        </nav>

        <div className="mb-8 space-y-4 border-b border-b-subtle pb-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-t-primary sm:text-4xl">
            {guide.title}
          </h1>
          <p className="text-base leading-7 text-t-secondary">
            {guide.description}
          </p>
        </div>

        <Body />

        {faqs.length > 0 && (
          <section aria-labelledby="faq" className="mt-12 space-y-4">
            <h2
              id="faq"
              className="text-xl font-semibold tracking-tight text-t-primary"
            >
              Frequently asked questions
            </h2>
            {/* Answers stay visible: FAQ markup must match on-page text */}
            <div className="divide-y divide-b-subtle rounded-lg border border-b-default bg-surface-card">
              {faqs.map((f) => (
                <div key={f.q} className="space-y-1.5 px-5 py-4">
                  <h3 className="text-sm font-semibold text-t-primary">
                    {f.q}
                  </h3>
                  <p className="text-sm leading-7 text-t-secondary">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedGuides.length > 0 && (
          <nav aria-labelledby="related" className="mt-12">
            <h2
              id="related"
              className="mb-4 text-xs font-semibold uppercase tracking-wider text-t-muted"
            >
              Related guides
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {relatedGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/${g.slug}`}
                    className="block h-full rounded-lg border border-b-default bg-surface-card p-4 transition-colors hover:border-brand/40 hover:bg-surface-hover"
                  >
                    <span className="block text-sm font-semibold text-t-primary">
                      {g.nav}
                    </span>
                    <span className="mt-1 line-clamp-3 block text-xs leading-5 text-t-secondary">
                      {g.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>
    </>
  );
}
