import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { briefPrompt, briefRequestSchema, briefSchema, buildSampleBrief, DEFAULT_AI_MODEL, MAX_BRIEF_TOKENS } from "@/lib/ai";
import { buildAlerts, personSchengen } from "@/lib/compliance";
import { limitBrief } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const parsed = briefRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A trip id is required." }, { status: 400 });

  const allowed = await limitBrief(userId);
  if (!allowed.ok) return NextResponse.json({ error: "Too many briefs. Try again in a few minutes." }, { status: 429 });

  const store = getStore();
  const [trip, profile, visas, trips] = await Promise.all([
    store.getTrip(userId, parsed.data.tripId),
    store.getProfile(userId),
    store.listVisas(userId),
    store.listTrips(userId),
  ]);
  if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });

  const alerts = buildAlerts(trips, profile, visas);
  const schengen = personSchengen(trips);
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(buildSampleBrief(trip, alerts));
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: process.env.AI_MODEL || DEFAULT_AI_MODEL,
      max_tokens: MAX_BRIEF_TOKENS,
      messages: [
        {
          role: "user",
          content: briefPrompt({
            trip,
            alerts,
            schengen: {
              maxDays: schengen.maxDays,
              isCompliant: schengen.isCompliant,
              overstayDays: schengen.overstayDays,
            },
          }),
        },
      ],
    });
    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) {
      return NextResponse.json({ error: "The model did not return a brief." }, { status: 502 });
    }
    const modelJson: unknown = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    if (!modelJson || typeof modelJson !== "object" || Array.isArray(modelJson)) {
      return NextResponse.json({ error: "The model returned an unexpected brief." }, { status: 502 });
    }
    const brief = briefSchema.safeParse({ ...modelJson, sample: false });
    if (!brief.success) return NextResponse.json({ error: "The model returned an unexpected brief." }, { status: 502 });
    return NextResponse.json(brief.data);
  } catch {
    return NextResponse.json({ error: "The model request failed." }, { status: 502 });
  }
}
