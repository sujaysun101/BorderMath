import { FxScreen } from "@/components/screens";

export const metadata = { title: "Currency" };

export default async function FxPage({ searchParams }: { searchParams: Promise<{ refresh?: string }> }) {
  const params = await searchParams;
  return <FxScreen basePath="" force={params.refresh === "1"} />;
}
