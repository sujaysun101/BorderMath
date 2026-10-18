import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarRange, Scale } from "lucide-react";
import { Mark } from "@/components/brand";
import { LandingHero } from "@/components/landing-hero";

export const metadata: Metadata = {
  title: { absolute: "BorderMath — Never overstay" },
  description: "Visa-day math for nomads. Schengen 90/180, sourced stay limits, overstay alerts, and calendar export.",
};

const features = [
  {
    icon: Scale,
    title: "Real 90/180 math",
    body: "Every Schengen day, entry and exit included, is counted inside a rolling 180-day window. The legal cap is 90. A two-day buffer warns you earlier.",
  },
  {
    icon: CalendarRange,
    title: "Sourced stay rules",
    body: "Schengen, the UK, the US, Canada, Japan, Thailand, Mexico, and the UAE ship as JSON with a source URL and a last-verified date.",
  },
  {
    icon: Bell,
    title: "Alerts and a calendar",
    body: "Overstays, full-stay caps, and short passport validity surface before you fly. Export the plan as an .ics file.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Mark className="h-9 w-9 text-primary" />
          <span className="font-serif text-xl">BorderMath</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/sign-in" className="hover:underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-full bg-primary px-4 py-2 text-primary-foreground">
            Open the planner
          </Link>
        </nav>
      </header>
      <LandingHero />
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-border bg-card p-6">
            <feature.icon className="mb-4 h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-serif text-2xl">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
          </article>
        ))}
      </section>
      <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p>BorderMath · visa-day math for nomads</p>
          <p>Not legal advice. The stamp in your passport controls the stay.</p>
        </div>
      </footer>
    </div>
  );
}
