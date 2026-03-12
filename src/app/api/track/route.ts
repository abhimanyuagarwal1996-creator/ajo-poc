import { NextResponse } from "next/server";
import { sendExperienceEvent, type AjoAction } from "@/lib/ajo-decisioning";

type TrackPayload = {
  eventId: string;
  trackingToken: string;
  action: AjoAction;
};

export async function POST(req: Request) {
  let payload: TrackPayload | null = null;

  try {
    payload = (await req.json()) as TrackPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const { eventId, trackingToken, action } = payload ?? {};

  if (
    typeof eventId !== "string" ||
    typeof trackingToken !== "string" ||
    (action !== "view" &&
      action !== "click" &&
      action !== "dismiss" &&
      action !== "conversion")
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload shape" },
      { status: 400 },
    );
  }

  await sendExperienceEvent(eventId, trackingToken, action);
  return NextResponse.json({ ok: true });
}

