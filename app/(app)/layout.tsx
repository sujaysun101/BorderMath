import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <Shell basePath="" mode={process.env.DATABASE_URL ? "postgres" : "memory"}>
      {children}
    </Shell>
  );
}
