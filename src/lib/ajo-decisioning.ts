// src/lib/ajo-decisioning.ts

const DATASTREAM_ID = process.env.AJO_DATASTREAM_ID;
const EDGE_URL = `https://edge.adobedc.net/ee/v2/interact?dataStreamId=${DATASTREAM_ID}`;

export function extractEcidFromCookies(cookieStore: any): string | null {
  const allCookies = cookieStore.getAll();

  // 1. Look for the traditional AMCV cookie
  const amcvCookie = allCookies.find((c: any) => c.name.startsWith("AMCV_"));
  if (amcvCookie) {
    const decodedValue = decodeURIComponent(amcvCookie.value);
    const match = decodedValue.match(/MCMID\|(\d+)/);
    if (match && match[1]) return match[1];
  }

  // 2. Look for the modern Web SDK identity cookie
  const kndctrCookie = allCookies.find((c: any) => c.name.includes("_identity"));
  if (kndctrCookie) {
    const decodedValue = decodeURIComponent(kndctrCookie.value);
    const match = decodedValue.match(/ecid\|([^|]+)/i);
    if (match && match[1]) return match[1];
  }

  return null;
}

function buildBasePayload(ecid: string, eventType: string) {
  return {
    events: [
      {
        xdm: {
          timestamp: new Date().toISOString(),
          eventType: eventType,
          identityMap: {
            ECID: [{ id: ecid, authenticatedState: "ambiguous", primary: true }],
          },
        },
      },
    ],
    meta: {
      state: { domain: "localhost", cookiesEnabled: true },
    },
  };
}

export async function fetchOffers(ecid: string, surface: string, rawCookieString: string) {
  const payload = buildBasePayload(ecid, "decisioning.propositionFetch");
  // @ts-ignore
  payload.events[0].query = { personalization: { surfaces: [surface] } };

  const response = await fetch(EDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: rawCookieString },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return null;
  return response.json();
}

export async function sendExperienceEvent(
  ecid: string,
  actionType: "display" | "click" | "dismiss",
  trackingData: { id: string; scope: string; scopeDetails: any },
  rawCookieString: string,
) {
  const eventType =
    actionType === "display"
      ? "decisioning.propositionDisplay"
      : "decisioning.propositionInteract";
  const payload = buildBasePayload(ecid, eventType);

  const decisioningBlock: any = {
    propositions: [
      {
        id: trackingData.id,
        scope: trackingData.scope,
        scopeDetails: trackingData.scopeDetails,
      },
    ],
  };

  if (actionType !== "display") {
    decisioningBlock.propositionEventType = { interact: 1 };
    decisioningBlock.propositionAction = { id: actionType, label: actionType };
  }

  // @ts-ignore
  payload.events[0].xdm._experience = { decisioning: decisioningBlock };

  await fetch(EDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: rawCookieString },
    body: JSON.stringify(payload),
  });

  return { success: true };
}
