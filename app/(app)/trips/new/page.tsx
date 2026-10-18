import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TripScreen } from "@/components/screens";

export const metadata = { title: "New trip" };

export default async function NewTripPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <TripScreen userId={userId} tripId={randomUUID()} basePath="" blank />;
}
