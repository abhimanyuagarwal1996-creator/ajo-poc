// src/app/offers/offer-card.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Proposition } from "@/lib/types";

export default function OfferCard({
  htmlContent,
  trackingData,
}: {
  htmlContent: string;
  trackingData: Proposition | null;
}) {
  const router = useRouter();
  const hasTrackedDisplay = useRef(false);
  const hasPushedDisplayToDataLayer = useRef(false);

  useEffect(() => {
    if (trackingData && !hasTrackedDisplay.current) {
      hasTrackedDisplay.current = true;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "display", trackingData }),
      });
    }
  }, [trackingData]);

  // Push offer metadata to the client-side adobeDataLayer once per mount.
  useEffect(() => {
    if (!trackingData || hasPushedDisplayToDataLayer.current) return;
    hasPushedDisplayToDataLayer.current = true;

    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.adobeDataLayer = w.adobeDataLayer || [];
    w.adobeDataLayer.push({
      event: "ajo.offerDisplayed",
      proposition: {
        id: trackingData.id,
        scope: trackingData.scope,
        scopeDetails: trackingData.scopeDetails,
      },
    });
  }, [trackingData]);

  const handleInteract = async (kind: "interact" | "dismiss") => {
    if (trackingData && typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.adobeDataLayer = w.adobeDataLayer || [];

      if (kind === "interact") {
        console.log("[AJO CLIENT] propositionInteract", trackingData);
        w.adobeDataLayer.push({
          event: "ajo.propositionInteract",
          proposition: {
            id: trackingData.id,
            scope: trackingData.scope,
            scopeDetails: trackingData.scopeDetails,
          },
          action: {
            id: "clicked",
            label: "clicked",
          },
          propositionEventType: {
            interact: 1,
          },
        });
      } else {
        console.log("[AJO CLIENT] propositionDismiss", trackingData);
        w.adobeDataLayer.push({
          event: "ajo.propositionDismiss",
          proposition: {
            id: trackingData.id,
            scope: trackingData.scope,
            scopeDetails: trackingData.scopeDetails,
          },
          action: {
            id: "dismissed",
            label: "dismissed",
          },
          propositionEventType: {
            dismiss: 1,
          },
        });
      }

      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: kind,
          proposition: {
            id: trackingData.id,
            scope: trackingData.scope,
            scopeDetails: trackingData.scopeDetails,
          },
        }),
      });
    }

    kind === "interact" ? router.push("/success") : router.push("/");
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="mb-6" />
      <div className="flex gap-4 border-t pt-4">
        <button
          onClick={() => handleInteract("interact")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Interested
        </button>
        <button
          onClick={() => handleInteract("dismiss")}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
