import { SignIn } from "@clerk/nextjs";
import { AuthFrame, ClerkMissing, clerkUiReady } from "@/components/auth-panel";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthFrame title="90 days. Any 180." lede="Sign in to keep the nomad year, the passport date, and the overstay alerts on your account.">
      {clerkUiReady() ? <SignIn appearance={clerkAppearance} /> : <ClerkMissing />}
    </AuthFrame>
  );
}
