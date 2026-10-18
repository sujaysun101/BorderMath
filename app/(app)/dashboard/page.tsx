import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardScreen } from "@/components/screens";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <DashboardScreen userId={userId} basePath="" />;
}
