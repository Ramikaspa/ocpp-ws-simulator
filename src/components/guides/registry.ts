import type { ComponentType } from "react";
import {
  EvChargerSimulatorBody,
  faqs as evFaqs,
} from "./content/EvChargerSimulator";
import { FaqBody, faqs as allFaqs } from "./content/Faq";
import {
  Ocpp16SimulatorBody,
  faqs as v16Faqs,
} from "./content/Ocpp16Simulator";
import {
  Ocpp201SimulatorBody,
  faqs as v201Faqs,
} from "./content/Ocpp201Simulator";
import { OcppNodejsBody, faqs as nodeFaqs } from "./content/OcppNodejs";
import { OcppSimulatorBody, faqs as simFaqs } from "./content/OcppSimulator";
import {
  TestCsmsLocallyBody,
  faqs as localFaqs,
} from "./content/TestCsmsLocally";

export type Faq = { q: string; a: string };

/** Guide slug → article body and the FAQs shown (and marked up) under it. */
export const GUIDE_CONTENT: Record<
  string,
  { Body: ComponentType; faqs: Faq[]; related: string[] }
> = {
  "ocpp-simulator": {
    Body: OcppSimulatorBody,
    faqs: simFaqs,
    related: [
      "ev-charger-simulator",
      "ocpp-1-6-simulator",
      "test-csms-locally",
    ],
  },
  "ev-charger-simulator": {
    Body: EvChargerSimulatorBody,
    faqs: evFaqs,
    related: ["ocpp-simulator", "ocpp-2-0-1-simulator", "faq"],
  },
  "ocpp-1-6-simulator": {
    Body: Ocpp16SimulatorBody,
    faqs: v16Faqs,
    related: ["ocpp-2-0-1-simulator", "ocpp-nodejs", "test-csms-locally"],
  },
  "ocpp-2-0-1-simulator": {
    Body: Ocpp201SimulatorBody,
    faqs: v201Faqs,
    related: ["ocpp-1-6-simulator", "ocpp-nodejs", "ev-charger-simulator"],
  },
  "ocpp-nodejs": {
    Body: OcppNodejsBody,
    faqs: nodeFaqs,
    related: ["test-csms-locally", "ocpp-simulator", "ocpp-1-6-simulator"],
  },
  "test-csms-locally": {
    Body: TestCsmsLocallyBody,
    faqs: localFaqs,
    related: ["ocpp-nodejs", "ocpp-simulator", "faq"],
  },
  faq: {
    Body: FaqBody,
    faqs: allFaqs,
    related: ["ocpp-simulator", "ev-charger-simulator", "ocpp-nodejs"],
  },
};
