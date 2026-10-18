import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BriefScreen } from "@/components/screens";

export const metadata = { title: "Brief" };

export default async function BriefPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <BriefScreen userId={userId} live />;
}
