// src/app/api/track/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendExperienceEvent, extractEcidFromCookies, buildPropositionEvent } from "@/lib/ajo-decisioning";
import type { Proposition } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as
      | "display"
      | "click"
      | "dismiss"
      | "interact"
      | "conversion"
      | undefined;
    const trackingData = body.trackingData;

    const cookieStore = await cookies();
    const rawCookies = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const realEcid = extractEcidFromCookies(cookieStore);
    const pocEcid = cookieStore.get("poc_ecid")?.value;
    const ecid = realEcid || pocEcid || "fallback-ecid-123";

    // New-style proposition actions using the shared Proposition shape.
    if (action === "interact" || action === "dismiss") {
      const proposition = body.proposition as Proposition | undefined;
      if (!proposition) {
        return NextResponse.json({ error: "Missing proposition" }, { status: 400 });
      }

      const eventType =
        action === "interact"
          ? "decisioning.propositionInteract"
          : "decisioning.propositionDismiss";

      const payload = buildPropositionEvent({
        eventType,
        proposition,
        action:
          action === "interact"
            ? {
                id: "clicked",
                label: "clicked",
              }
            : undefined,
      });

      console.log(`[AJO SERVER] ${eventType}`, JSON.stringify(payload, null, 2));

      // Also send the real Edge experience event using the existing helper,
      // so the POC keeps end-to-end Edge tracking.
      if (action === "interact") {
        await sendExperienceEvent(ecid, "click", proposition, rawCookies, cookieStore);
      } else if (action === "dismiss") {
        await sendExperienceEvent(ecid, "dismiss", proposition, rawCookies, cookieStore);
      }

      return NextResponse.json({ success: true, ecid });
    }

    if (!trackingData) return NextResponse.json({ error: "Missing tracking data" }, { status: 400 });

    // Display is now sent server-side during SSR of `/offers`.
    if (action !== "display") {
      const result = await sendExperienceEvent(
        ecid,
        action as "click" | "dismiss" | "display",
        trackingData,
        rawCookies,
        cookieStore,
      );
      const res = NextResponse.json({ success: true, ecid });
      for (const c of result.edgeCookies ?? []) {
        res.cookies.set({
          name: c.name,
          value: c.value,
          ...c.options,
        });
      }
      return res;
    }

    return NextResponse.json({ success: true, ecid });
  } catch (error) {
    console.error("Tracking Error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
