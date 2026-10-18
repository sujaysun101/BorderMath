import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEMO_SCREENSHOT !== "1") notFound();
  return (
    <Shell basePath="/demo" mode="memory" demoName="Maya Chen">
      {children}
    </Shell>
  );
}
