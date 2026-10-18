import { SignUp } from "@clerk/nextjs";
import { AuthFrame, ClerkMissing, clerkUiReady } from "@/components/auth-panel";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthFrame title="Leave on the right day." lede="A workspace for the trips, the sourced stay limits, and the calendar you can drop into any phone.">
      {clerkUiReady() ? <SignUp appearance={clerkAppearance} /> : <ClerkMissing />}
    </AuthFrame>
  );
}
