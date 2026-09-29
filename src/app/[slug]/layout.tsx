import { SiteFooter, SiteHeader } from "@/components/guides/SiteChrome";

/**
 * Content pages. The root layout locks the document for the full-screen
 * simulator, so this wrapper is the page's scroll container.
 */
export default function GuidesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="custom-scrollbar h-full overflow-y-auto">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
