import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">404</p>
      <h1 className="mt-2 font-serif text-5xl">That page is not on the itinerary.</h1>
      <Link href="/" className="mt-6 text-primary hover:underline">
        Back to BorderMath
      </Link>
    </div>
  );
}
