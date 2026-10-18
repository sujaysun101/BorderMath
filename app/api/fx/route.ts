import { NextResponse } from "next/server";
import { z } from "zod";
import { getFxQuote, isFxCode } from "@/lib/fx";

const querySchema = z.object({
  from: z.string().length(3).default("USD"),
  force: z.enum(["0", "1"]).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from") ?? "USD",
    force: url.searchParams.get("force") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid currency request." }, { status: 400 });
  }
  if (!isFxCode(parsed.data.from)) {
    return NextResponse.json(
      { error: "That currency is not in the Frankfurter set used by BorderMath." },
      { status: 400 },
    );
  }
  try {
    const quote = await getFxQuote(parsed.data.from, { force: parsed.data.force === "1" });
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json(
      { error: "Frankfurter is unreachable right now. No made-up rates are shown." },
      { status: 503 },
    );
  }
}
