import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TimelineScreen } from "@/components/screens";

export const metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <TimelineScreen userId={userId} basePath="" />;
}
