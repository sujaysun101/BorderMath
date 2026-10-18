import { SignUp } from "@clerk/nextjs";
import { Mark } from "@/components/brand";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#143f3b] p-10 text-[#f6f1e8] md:flex">
        <div className="flex items-center gap-3">
          <Mark className="h-10 w-10" />
          <span className="font-serif text-2xl">BorderMath</span>
        </div>
        <div>
          <p className="font-serif text-5xl leading-tight">Leave on the right day.</p>
          <p className="mt-4 max-w-sm text-[#f6f1e8]/80">
            A workspace for the trips, the sourced stay limits, and the calendar you can drop into any phone.
          </p>
        </div>
        <p className="text-sm text-[#f6f1e8]/70">Visa-day math for nomads.</p>
      </section>
      <section className="flex items-center justify-center bg-background p-6">
        <SignUp appearance={clerkAppearance} />
      </section>
    </div>
  );
}
