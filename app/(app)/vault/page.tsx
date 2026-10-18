import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { VaultScreen } from "@/components/screens";

export const metadata = { title: "Vault" };

export default async function VaultPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <VaultScreen userId={userId} />;
}
