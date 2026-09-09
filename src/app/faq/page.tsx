import type { Metadata } from "next";
import { dictionary } from "@/i18n/dictionary";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: `Tunnela — ${dictionary.fr.faq.title}`,
  description: dictionary.fr.faq.subtitle,
};

export default function FaqPage() {
  return <FaqClient />;
}
