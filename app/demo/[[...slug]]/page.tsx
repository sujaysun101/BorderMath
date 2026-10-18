import { notFound } from "next/navigation";
import {
  AlertsScreen,
  BriefScreen,
  DashboardScreen,
  FxScreen,
  TimelineScreen,
  TripScreen,
  TripsScreen,
  VaultScreen,
} from "@/components/screens";
import { DEMO_USER_ID } from "@/lib/demo-data";

export const metadata = { title: { absolute: "BorderMath — Never overstay" } };

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ refresh?: string }>;
}) {
  if (process.env.DEMO_SCREENSHOT !== "1") notFound();
  const { slug = [] } = await params;
  const query = await searchParams;
  const [head, id] = slug;
  const memory = { userId: DEMO_USER_ID, forceMemory: true as const, basePath: "/demo", readOnly: true };

  if (!head) return <DashboardScreen {...memory} />;
  if (head === "dashboard") return <DashboardScreen {...memory} />;
  if (head === "trips" && !id) return <TripsScreen {...memory} />;
  if (head === "trips" && id) return <TripScreen {...memory} tripId={id} />;
  if (head === "timeline") return <TimelineScreen {...memory} />;
  if (head === "alerts") return <AlertsScreen userId={DEMO_USER_ID} forceMemory />;
  if (head === "fx") return <FxScreen basePath="/demo" force={query.refresh === "1"} />;
  if (head === "vault") return <VaultScreen userId={DEMO_USER_ID} forceMemory readOnly />;
  if (head === "brief") return <BriefScreen userId={DEMO_USER_ID} forceMemory live={false} />;
  notFound();
}
