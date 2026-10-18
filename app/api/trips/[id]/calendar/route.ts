import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { tripToIcs } from "@/lib/ics";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  if (!id || id.length > 80) return NextResponse.json({ error: "Invalid trip." }, { status: 400 });
  const trip = await getStore().getTrip(userId, id);
  if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  const body = tripToIcs(trip);
  const filename = `${trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip"}.ics`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
