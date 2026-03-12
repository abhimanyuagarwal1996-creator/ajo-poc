// src/app/api/track/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendExperienceEvent, extractEcidFromCookies } from "@/lib/ajo-decisioning";

export async function POST(request: Request) {
  try {
    const { action, trackingData } = await request.json();

    const cookieStore = await cookies();
    const rawCookies = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const realEcid = extractEcidFromCookies(cookieStore);
    const pocEcid = cookieStore.get("poc_ecid")?.value;
    const ecid = realEcid || pocEcid || "fallback-ecid-123";

    if (!trackingData) return NextResponse.json({ error: "Missing tracking data" }, { status: 400 });

    await sendExperienceEvent(ecid, action, trackingData, rawCookies);

    return NextResponse.json({ success: true, ecid });
  } catch (error) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
