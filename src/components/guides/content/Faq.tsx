import { faqs as evFaqs } from "./EvChargerSimulator";
import { faqs as v16Faqs } from "./Ocpp16Simulator";
import { faqs as v201Faqs } from "./Ocpp201Simulator";
import { faqs as nodeFaqs } from "./OcppNodejs";
import { faqs as simFaqs } from "./OcppSimulator";
import { faqs as localFaqs } from "./TestCsmsLocally";

const general = [
  {
    q: "What is OCPP?",
    a: "The Open Charge Point Protocol (OCPP) is an open standard, maintained by the Open Charge Alliance, for communication between EV charging stations and the software that manages them (the CSMS). It covers boot and heartbeat, authorization, transactions, meter values, remote control, smart charging and firmware updates.",
  },
  {
    q: "What is a CSMS?",
    a: "A Charging Station Management System — called the Central System in OCPP 1.6 — is the backend that chargers connect to. It authorizes drivers, records transactions, sends remote commands and manages charging profiles.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. The simulator runs in a modern browser. It can also be run locally from its open-source repository with npm install and npm run dev.",
  },
  {
    q: "Can I load-test my CSMS?",
    a: "Yes. Fleet spawn creates and connects up to 50 virtual chargers at once with a common prefix, and scenario macros can run the same charging sequence on every connected charger.",
  },
  {
    q: "Is my data sent anywhere?",
    a: "Only to the CSMS you connect to. Charger configuration is stored in your browser's local storage; the simulator has no backend of its own for your OCPP traffic.",
  },
];

/** Every FAQ on the site, de-duplicated, general questions first. */
export const faqs = [
  ...general,
  ...simFaqs,
  ...evFaqs,
  ...v16Faqs,
  ...v201Faqs,
  ...nodeFaqs,
  ...localFaqs,
].filter((f, i, all) => all.findIndex((o) => o.q === f.q) === i);

/** The FAQ page is its questions; they render in the shared FAQ section. */
export function FaqBody() {
  return null;
}
