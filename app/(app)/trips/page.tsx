import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TripsScreen } from "@/components/screens";

export const metadata = { title: "Trips" };

export default async function TripsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <TripsScreen userId={userId} basePath="" />;
}
