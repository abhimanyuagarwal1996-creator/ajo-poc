// src/app/offers/offer-card.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function OfferCard({
  htmlContent,
  trackingData,
}: {
  htmlContent: string;
  trackingData: any;
}) {
  const router = useRouter();
  const hasTrackedDisplay = useRef(false);

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

  const handleInteract = async (action: "click" | "dismiss") => {
    if (trackingData) {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, trackingData }),
      });
    }
    action === "click" ? router.push("/success") : router.push("/");
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="mb-6" />
      <div className="flex gap-4 border-t pt-4">
        <button
          onClick={() => handleInteract("click")}
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
