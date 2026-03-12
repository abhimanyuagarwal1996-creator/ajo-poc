import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchOffers } from "@/lib/ajo-decisioning";
import { OfferCard } from "./offer-card";

const COOKIE_NAME = "ajo_user";

export default async function OffersPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) redirect("/");

  const offer = await fetchOffers(userId);
  const eventId = `${userId}:${offer.offerId}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your Offers</h1>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          This page is a <span className="font-medium">Server Component</span>.
          Before rendering, it performs a mock server-to-server decisioning call
          based on your selected user (<span className="font-mono">{userId}</span>
          ) and embeds the offer into the server-rendered HTML.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <OfferCard offer={offer} eventId={eventId} />
        </section>

        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              What’s happening (server-side)
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <li>
                - `fetchOffers(userId)` returns JSON including a mock tracking
                token
              </li>
              <li>- The offer card HTML is rendered on the server</li>
              <li>
                - Client events post to <span className="font-mono">/api/track</span>
              </li>
            </ul>
            <div className="mt-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/40">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Offer preview image source
              </div>
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Image
                  src={offer.imageUrl}
                  alt=""
                  width={800}
                  height={500}
                  className="h-36 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

