import { Mark } from "@/components/brand";

export function clerkUiReady() {
  return process.env.NODE_ENV !== "production" || Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function AuthFrame({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#143f3b] p-10 text-[#f6f1e8] md:flex">
        <div className="flex items-center gap-3">
          <Mark className="h-10 w-10" />
          <span className="font-serif text-2xl">BorderMath</span>
        </div>
        <div>
          <p className="font-serif text-5xl leading-tight">{title}</p>
          <p className="mt-4 max-w-sm text-[#f6f1e8]/80">{lede}</p>
        </div>
        <p className="text-sm text-[#f6f1e8]/70">Never overstay.</p>
      </section>
      <section className="flex items-center justify-center bg-background p-6">{children}</section>
    </div>
  );
}

export function ClerkMissing() {
  return (
    <div className="max-w-md space-y-3">
      <h1 className="font-serif text-4xl">Clerk is not configured</h1>
      <p className="text-muted-foreground">
        Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, then rebuild. Local `npm run dev` uses Clerk keyless mode without those keys.
      </p>
    </div>
  );
}
