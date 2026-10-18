import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TripScreen } from "@/components/screens";

export const metadata = { title: "Trip" };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;
  return <TripScreen userId={userId} tripId={id} basePath="" />;
}
