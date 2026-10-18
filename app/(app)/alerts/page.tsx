import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AlertsScreen } from "@/components/screens";

export const metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <AlertsScreen userId={userId} />;
}
