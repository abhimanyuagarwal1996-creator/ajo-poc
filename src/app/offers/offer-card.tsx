"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AjoOffer, AjoAction } from "@/lib/ajo-decisioning";

async function track(eventId: string, trackingToken: string, action: AjoAction) {
  await fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventId, trackingToken, action }),
  });
}

export function OfferCard({ offer, eventId }: { offer: AjoOffer; eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<AjoAction | null>(null);

  const successUrl = useMemo(() => {
    const params = new URLSearchParams({
      eventId,
      tt: offer.trackingToken,
      offerId: offer.offerId,
    });
    return `/success?${params.toString()}`;
  }, [eventId, offer.offerId, offer.trackingToken]);

  useEffect(() => {
    // Client-side "view" event once the offer is visible to the user.
    void track(eventId, offer.trackingToken, "view");
  }, [eventId, offer.trackingToken]);

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative h-52 w-full">
        <Image
          src={offer.imageUrl}
          alt={offer.title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {offer.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {offer.description}
            </p>
          </div>
          <div className="hidden shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 md:block">
            <div className="font-medium text-zinc-900 dark:text-zinc-50">
              Offer ID
            </div>
            <div className="font-mono">{offer.offerId}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("click");
              try {
                await track(eventId, offer.trackingToken, "click");
              } finally {
                router.push(successUrl);
              }
            }}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {busy === "click" ? "Sending..." : "Interested"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("dismiss");
              try {
                await track(eventId, offer.trackingToken, "dismiss");
              } finally {
                router.push("/");
              }
            }}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            {busy === "dismiss" ? "Sending..." : "Dismiss"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            Mock tracking token
          </div>
          <div className="mt-1 break-all font-mono">{offer.trackingToken}</div>
        </div>
      </div>
    </div>
  );
}

