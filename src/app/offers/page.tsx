// src/app/offers/page.tsx
import { cookies } from "next/headers";
import { after } from "next/server";
import { extractEcidFromCookies, sendExperienceEvent } from "@/lib/ajo-decisioning";
import OfferCard from "./offer-card";

export default async function OffersPage() {
  const cookieStore = await cookies();
  const rawCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const realEcid = extractEcidFromCookies(cookieStore);
  const pocEcid = cookieStore.get("poc_ecid")?.value;
  const ecid = realEcid || pocEcid || "fallback-ecid-123";

  const cookieContent = cookieStore.get("ajo_edge_content")?.value ?? null;
  const cookieProposition = cookieStore.get("ajo_edge_proposition")?.value ?? null;

  const content = safeParseHeaderJson(cookieContent);
  const trackingData = safeParseHeaderJson(cookieProposition);

  const htmlContent =
    (typeof content === "string"
      ? content
      : content && typeof content === "object"
        ? `<pre style="white-space:pre-wrap">${escapeHtml(JSON.stringify(content, null, 2))}</pre>`
        : null) ||
    `
    <div class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <h2 class="text-xl text-gray-600 mb-2">Default Fallback Offer</h2>
      <p class="text-sm text-gray-500">No AJO campaign matched for ECID: <br/><span class="font-mono text-xs">${ecid}</span></p>
    </div>
  `;

  if (trackingData) {
    after(async () => {
      try {
        await sendExperienceEvent(ecid, "display", trackingData, rawCookies, cookieStore);
      } catch (e) {
        console.error("Edge propositionDisplay failed", e);
      }
    });
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-end border-b pb-4">
        <h1 className="text-2xl font-bold">Your Personalized Offer</h1>
        <div className="text-right">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Active ECID</span>
          <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{ecid}</p>
        </div>
      </div>
      <OfferCard htmlContent={htmlContent} trackingData={trackingData} />
    </main>
  );
}

function safeParseHeaderJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
