import Link from "next/link";
import { SuccessClient } from "./success-client";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const eventId = typeof sp.eventId === "string" ? sp.eventId : "";
  const trackingToken = typeof sp.tt === "string" ? sp.tt : "";
  const offerId = typeof sp.offerId === "string" ? sp.offerId : "";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Success
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          You “accepted” the offer. This page simulates a{" "}
          <span className="font-medium">conversion</span> event sent back to AJO
          via the server.
        </p>

        <div className="mt-6">
          <SuccessClient eventId={eventId} trackingToken={trackingToken} />
        </div>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            Context
          </div>
          <div className="mt-1">
            Offer ID: <span className="font-mono">{offerId || "(missing)"}</span>
          </div>
          <div className="mt-1">
            Event ID: <span className="font-mono">{eventId || "(missing)"}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/offers"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Back to offers
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Switch user
          </Link>
        </div>
      </div>
    </main>
  );
}

