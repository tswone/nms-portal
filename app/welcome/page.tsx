import type { Metadata } from "next";

import { WelcomeView } from "@/components/portal/welcome-view";

export const metadata: Metadata = {
  title: "Welcome · NMS Parent Portal",
  description: "What a brand-new National Math Stars family sees on their first visit",
};

export default function WelcomePage() {
  return <WelcomeView />;
}
