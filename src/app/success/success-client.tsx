"use client";

import { useEffect } from "react";

type Props = {
  eventId: string;
  trackingToken: string;
};

export function SuccessClient({ eventId, trackingToken }: Props) {
  useEffect(() => {
    if (!eventId || !trackingToken) return;

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventId,
        trackingToken,
        action: "conversion",
      }),
    }).catch(() => {});
  }, [eventId, trackingToken]);

  if (!eventId || !trackingToken) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Conversion tracking skipped (missing `eventId` or tracking token in the
        URL).
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
      Conversion event triggered (check server logs for the mocked AJO payload).
    </div>
  );
}

