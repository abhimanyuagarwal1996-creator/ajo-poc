// src/app/offers/page.tsx
import { cookies } from "next/headers";
import { fetchOffers, extractEcidFromCookies } from "@/lib/ajo-decisioning";
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

  const surface = process.env.AJO_SURFACE_URI || "web://ajo-poc-nine.vercel.app/offers";

  const ajoData = await fetchOffers(ecid, surface, rawCookies);

  const handle = ajoData?.handle?.find((h: any) => h.type === "personalization:decisions");
  const proposition = handle?.payload?.[0];
  const item = proposition?.items?.[0];

  const htmlContent =
    item?.data?.content ||
    `
    <div class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <h2 class="text-xl text-gray-600 mb-2">Default Fallback Offer</h2>
      <p class="text-sm text-gray-500">No AJO campaign matched for ECID: <br/><span class="font-mono text-xs">${ecid}</span></p>
    </div>
  `;

  const trackingData = proposition
    ? {
        id: proposition.id,
        scope: proposition.scope,
        scopeDetails: proposition.scopeDetails,
      }
    : null;

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
