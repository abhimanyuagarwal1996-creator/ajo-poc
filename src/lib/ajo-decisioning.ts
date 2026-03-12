export type AjoOffer = {
  offerId: string;
  title: string;
  description: string;
  imageUrl: string;
  trackingToken: string;
};

export type AjoAction = "view" | "click" | "dismiss" | "conversion";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeTrackingToken(userId: string, offerId: string) {
  const raw = `${userId}:${offerId}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

const MOCK_OFFERS_BY_USER: Record<string, Omit<AjoOffer, "trackingToken">> = {
  "user-a": {
    offerId: "offer_spring_10",
    title: "User A: 10% off Spring Essentials",
    description:
      "Personalized server-side offer for User A. Great for showcasing server-rendered decisioning.",
    imageUrl:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
  },
  "user-b": {
    offerId: "offer_free_shipping",
    title: "User B: Free Shipping This Week",
    description:
      "Personalized server-side offer for User B. Same layout, different decisioning output.",
    imageUrl:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80",
  },
};

export async function fetchOffers(userId: string): Promise<AjoOffer> {
  // Simulate a server-to-server call to Adobe Edge Network decisioning.
  await sleep(250);

  const base =
    MOCK_OFFERS_BY_USER[userId] ??
    ({
      offerId: "offer_generic",
      title: "Welcome offer",
      description:
        "Fallback server-side offer when no known user is selected.",
      imageUrl:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    } satisfies Omit<AjoOffer, "trackingToken">);

  return {
    ...base,
    trackingToken: makeTrackingToken(userId, base.offerId),
  };
}

export async function sendExperienceEvent(
  eventId: string,
  trackingToken: string,
  action: AjoAction,
): Promise<{ ok: true }> {
  // Simulate a server-to-server call sending event metrics back to AJO.
  await sleep(120);

  // For a POC, logging is enough to demonstrate the feedback loop.
  // In a real integration, this would be an authenticated HTTP request.
  console.log(
    JSON.stringify(
      {
        source: "mock-ajo",
        ts: new Date().toISOString(),
        eventId,
        action,
        trackingToken,
      },
      null,
      2,
    ),
  );

  return { ok: true };
}

