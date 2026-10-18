"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-8 md:grid-cols-[1.2fr_0.8fr] md:pt-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">For people who live out of a carry-on</p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Never overstay.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Visa-day math for nomads. Plan a year of borders, watch the Schengen window fill, and leave before the cap.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-up" className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-primary-foreground">
            Start a trip
          </Link>
          <Link href="/sign-in" className="inline-flex h-12 items-center rounded-full border border-border px-6">
            I already have an account
          </Link>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-[2rem] border border-border bg-card p-8"
        aria-hidden
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Rolling window</p>
        <p className="mt-2 font-serif text-6xl">89</p>
        <p className="text-muted-foreground">of 90 Schengen days</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[89%] bg-primary" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Safety buffer starts at 88. The legal line is 90.</p>
      </motion.div>
    </section>
  );
}
