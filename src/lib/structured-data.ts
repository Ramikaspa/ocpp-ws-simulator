/** Schema.org building blocks shared by the home page and the guides. */

import {
  AUTHOR,
  DEFAULT_DESCRIPTION,
  FEATURES,
  GITHUB_URL,
  LIB_GITHUB_URL,
  LIB_NAME,
  LIB_URL,
  SITE_NAME,
  SITE_URL,
  SITE_VERSION,
} from "./site";

export const ids = {
  website: `${SITE_URL}/#website`,
  app: `${SITE_URL}/#app`,
  author: `${SITE_URL}/#author`,
  library: `${SITE_URL}/#ocpp-ws-io`,
};

export const authorNode = {
  "@type": "Person",
  "@id": ids.author,
  name: AUTHOR.name,
  url: AUTHOR.url,
  sameAs: [AUTHOR.github, AUTHOR.x],
};

export const websiteNode = {
  "@type": "WebSite",
  "@id": ids.website,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: [
    "OCPP Emulator",
    "OCPP Simulator",
    "EV Charger Emulator",
    "EV Charger Simulator",
    "ocpp-ws-simulator",
  ],
  description: DEFAULT_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": ids.author },
};

export const libraryNode = {
  "@type": "SoftwareSourceCode",
  "@id": ids.library,
  name: LIB_NAME,
  description:
    "OCPP RPC WebSocket client and server library for Node.js and TypeScript, supporting OCPP 1.6J, 2.0.1 and 2.1.",
  url: LIB_URL,
  codeRepository: LIB_GITHUB_URL,
  programmingLanguage: "TypeScript",
  runtimePlatform: "Node.js",
  license: "https://opensource.org/licenses/MIT",
  author: { "@id": ids.author },
};

export const appNode = {
  "@type": "WebApplication",
  "@id": ids.app,
  name: SITE_NAME,
  alternateName: [
    "OCPP Emulator",
    "OCPP Charge Point Emulator",
    "OCPP Simulator",
  ],
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "EV charging protocol testing",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript and WebSocket support",
  softwareVersion: SITE_VERSION,
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [...FEATURES],
  image: `${SITE_URL}/opengraph-image`,
  license: "https://opensource.org/licenses/MIT",
  author: { "@id": ids.author },
  publisher: { "@id": ids.author },
  isBasedOn: { "@id": ids.library },
  sameAs: [GITHUB_URL],
};

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
