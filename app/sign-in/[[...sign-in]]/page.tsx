import { SignIn } from "@clerk/nextjs";
import { Mark } from "@/components/brand";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#143f3b] p-10 text-[#f6f1e8] md:flex">
        <div className="flex items-center gap-3">
          <Mark className="h-10 w-10" />
          <span className="font-serif text-2xl">BorderMath</span>
        </div>
        <div>
          <p className="font-serif text-5xl leading-tight">90 days. Any 180.</p>
          <p className="mt-4 max-w-sm text-[#f6f1e8]/80">
            Sign in to keep the nomad year, the passport date, and the overstay alerts on your account.
          </p>
        </div>
        <p className="text-sm text-[#f6f1e8]/70">Never overstay.</p>
      </section>
      <section className="flex items-center justify-center bg-background p-6">
        <SignIn appearance={clerkAppearance} />
      </section>
    </div>
  );
}
