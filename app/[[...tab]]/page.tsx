import { Portal } from "@/components/portal/portal";
import { TAB_SLUGS } from "@/lib/routes";

// One page renders every tab: /, /pinbook, /progress, /mentor, /family.
// Anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ tab: [] }, ...TAB_SLUGS.map((slug) => ({ tab: [slug] }))];
}

export default function Page() {
  return <Portal />;
}
