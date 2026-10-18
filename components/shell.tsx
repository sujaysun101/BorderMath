import { UserButton } from "@clerk/nextjs";
import { Mark } from "@/components/brand";
import { SideNav } from "@/components/side-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import type { StoreMode } from "@/lib/types";

export function Shell({
  children,
  basePath,
  mode,
  demoName,
}: {
  children: React.ReactNode;
  basePath: string;
  mode: StoreMode;
  demoName?: string;
}) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-8 border-b border-border bg-card px-4 py-5 md:min-h-screen md:border-b-0 md:border-r">
        <a href={basePath || "/"} className="flex items-center gap-3 px-2">
          <Mark className="h-10 w-10 text-primary" />
          <span className="leading-tight">
            <span className="block font-serif text-lg">BorderMath</span>
            <span className="block text-xs text-muted-foreground">Never overstay</span>
          </span>
        </a>
        <SideNav basePath={basePath} />
        <p className="mt-auto px-2 text-xs leading-relaxed text-muted-foreground">
          Day counts are informational. The passport stamp wins.
        </p>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <p className="text-sm text-muted-foreground">
            {mode === "memory" ? "Demo data" : "Saved in Postgres"}
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {demoName ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-sm">{demoName}</span>
            ) : (
              <UserButton />
            )}
          </div>
        </header>
        {mode === "memory" ? (
          <p className="border-b border-border bg-muted px-4 py-2 text-sm text-muted-foreground md:px-8">
            Demo data — this server has no database, so trips live in memory for this process. Set DATABASE_URL for Postgres.
          </p>
        ) : null}
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
