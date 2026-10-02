import { ExternalLink, Mail, ShieldCheck } from "lucide-react";

const SITE = "https://nationalmathstars.org";

const LEARN_MORE = [
  { label: "Voyager Stars", href: `${SITE}/voyager-program/` },
  { label: "Pathfinder Stars", href: `${SITE}/pathfinder-program/` },
  { label: "Star Stories", href: `${SITE}/star-stories/` },
  { label: "Our mission", href: `${SITE}/mission/` },
  { label: "Meet the team", href: `${SITE}/team/` },
  { label: "News", href: `${SITE}/news/` },
];

// Pledge points restate commitments from NMS's published privacy policy — nothing more.
const PLEDGE = [
  "We never share your family's information with third parties for marketing.",
  "For Stars under 13, we only collect information with a parent's consent.",
  "Your information is used to support your Star and run the program, and nothing else.",
];

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-brand-slate text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <section aria-labelledby="pledge-heading" className="grid content-start gap-3">
          <h2
            id="pledge-heading"
            className="flex items-center gap-2 text-base font-semibold text-white"
          >
            <ShieldCheck className="size-5 text-brand-gold" />
            Our promise to your family
          </h2>
          <ul className="grid gap-2 text-sm">
            {PLEDGE.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Questions about your data? Email{" "}
            <a
              href="mailto:operations@nationalmathstars.org"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              operations@nationalmathstars.org
            </a>{" "}
            or read our{" "}
            <a
              href={`${SITE}/cookies-privacy-policy/`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              privacy policy
            </a>
            .
          </p>
        </section>

        <nav aria-labelledby="learn-heading" className="grid content-start gap-3">
          <h2 id="learn-heading" className="text-base font-semibold text-white">
            Learn more about NMS
          </h2>
          <ul className="grid gap-2 text-sm">
            {LEARN_MORE.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white hover:underline underline-offset-4"
                >
                  {label}
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="help-heading" className="grid content-start gap-3">
          <h2 id="help-heading" className="text-base font-semibold text-white">
            Need help?
          </h2>
          <p className="text-sm">
            Your Family Advisor is the best first stop. You can also reach the whole team any time.
          </p>
          <a
            href="mailto:info@nationalmathstars.org"
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:underline underline-offset-4"
          >
            <Mail className="size-4 text-brand-gold" />
            info@nationalmathstars.org
          </a>
          <a
            href={`${SITE}/contact/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm hover:text-white hover:underline underline-offset-4"
          >
            Contact page
            <ExternalLink className="size-3 opacity-60" />
          </a>
        </section>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} National Math Stars</p>
          <a
            href={SITE}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white hover:underline underline-offset-4"
          >
            nationalmathstars.org
          </a>
        </div>
      </div>
    </footer>
  );
}
