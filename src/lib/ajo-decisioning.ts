// src/lib/ajo-decisioning.ts
import "server-only";
import { randomUUID } from "crypto";
import type { Proposition } from "@/lib/types";

const EDGE_URL =
  "https://edge.adobedc.net/ee/v2/interact?dataStreamId=251a1e44-93eb-4222-bc5a-63b5e16a57e7";

export const AJO_SURFACE_URI = "web://ajo-poc-nine.vercel.app/#ajo_poc";
const AJO_DOMAIN = "ajo-poc-nine.vercel.app";

type CookieLike = { name: string; value: string };
type CookieStoreLike = { getAll: () => CookieLike[] };

export type PropositionRef = Proposition;

export type EdgeCookie = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
    expires?: Date;
  };
};

export type FetchOffersResult = {
  content: unknown | null;
  proposition: PropositionRef | null;
  ecid: string;
  edgeCookies: EdgeCookie[];
  rawEdgeResponse: any;
};

export function extractEcidFromCookies(cookieStore: CookieStoreLike): string | null {
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

function getKndctrStateEntriesFromCookies(cookieStore: CookieStoreLike) {
  const all = cookieStore.getAll();
  const matches = all.filter(
    (c) =>
      /^kndctr_.*_AdobeOrg_identity$/i.test(c.name) || /^kndctr_.*_AdobeOrg_cluster$/i.test(c.name),
  );

  return matches.map((c) => ({ key: c.name, value: c.value }));
}

function buildPropositionFetchBody(ecid: string, cookieStore: CookieStoreLike) {
  return {
    event: {
      xdm: {
        eventType: "decisioning.propositionFetch",
        identityMap: {
          ECID: [{ id: ecid, authenticatedState: "ambiguous", primary: true }],
        },
        timestamp: new Date().toISOString(),
      },
      data: {},
    },
    query: {
      identity: { fetch: ["ECID"] },
      personalization: {
        schemas: [
          "https://ns.adobe.com/personalization/default-content-item",
          "https://ns.adobe.com/personalization/html-content-item",
          "https://ns.adobe.com/personalization/json-content-item",
          "https://ns.adobe.com/personalization/redirect-item",
          "https://ns.adobe.com/personalization/dom-action",
        ],
        surfaces: [AJO_SURFACE_URI],
      },
    },
    meta: {
      state: {
        domain: AJO_DOMAIN,
        cookiesEnabled: true,
        entries: getKndctrStateEntriesFromCookies(cookieStore),
      },
    },
  };
}

function buildPropositionEventBody(
  ecid: string,
  eventType: "decisioning.propositionDisplay" | "decisioning.propositionInteract",
  proposition: PropositionRef,
  cookieStore: CookieStoreLike,
  actionType?: "click" | "dismiss",
) {
  const decisioning: any = {
    propositions: [
      {
        id: proposition.id,
        scope: proposition.scope,
        scopeDetails: proposition.scopeDetails,
      },
    ],
  };

  if (eventType === "decisioning.propositionInteract" && actionType) {
    decisioning.propositionEventType = { interact: 1 };
    decisioning.propositionAction = { id: actionType, label: actionType };
  }

  return {
    event: {
      xdm: {
        eventType,
        identityMap: {
          ECID: [{ id: ecid, authenticatedState: "ambiguous", primary: true }],
        },
        timestamp: new Date().toISOString(),
        _experience: { decisioning },
      },
      data: {},
    },
    query: {
      identity: { fetch: ["ECID"] },
    },
    meta: {
      state: {
        domain: AJO_DOMAIN,
        cookiesEnabled: true,
        entries: getKndctrStateEntriesFromCookies(cookieStore),
      },
    },
  };
}

function parseEdgeStateStoreCookies(edgeJson: any): EdgeCookie[] {
  const handles: any[] = Array.isArray(edgeJson?.handle) ? edgeJson.handle : [];
  const storeHandle = handles.filter((h) => h?.type === "state:store");

  const out: EdgeCookie[] = [];
  for (const h of storeHandle) {
    const payload = Array.isArray(h?.payload) ? h.payload : [];
    for (const p of payload) {
      const name = p?.key;
      const value = p?.value;
      if (!name || typeof name !== "string" || typeof value !== "string") continue;

      const attrs = p?.attrs ?? {};
      const sameSiteRaw = typeof attrs?.sameSite === "string" ? attrs.sameSite.toLowerCase() : null;
      const sameSite: "lax" | "strict" | "none" | undefined =
        sameSiteRaw === "lax" || sameSiteRaw === "strict" || sameSiteRaw === "none"
          ? sameSiteRaw
          : undefined;

      out.push({
        name,
        value,
        options: {
          domain: typeof attrs?.domain === "string" ? attrs.domain : undefined,
          path: typeof attrs?.path === "string" ? attrs.path : undefined,
          secure: typeof attrs?.secure === "boolean" ? attrs.secure : undefined,
          httpOnly: typeof attrs?.httpOnly === "boolean" ? attrs.httpOnly : undefined,
          sameSite,
          maxAge: typeof attrs?.maxAge === "number" ? attrs.maxAge : undefined,
          expires: typeof attrs?.expires === "string" ? new Date(attrs.expires) : undefined,
        },
      });
    }
  }
  return out;
}

function parsePersonalization(edgeJson: any): { content: unknown | null; proposition: PropositionRef | null } {
  const handles: any[] = Array.isArray(edgeJson?.handle) ? edgeJson.handle : [];
  const decisionHandle = handles.find((h) => h?.type === "personalization:decisions");
  const payloads: any[] = Array.isArray(decisionHandle?.payload) ? decisionHandle.payload : [];

  for (const proposition of payloads) {
    const items: any[] = Array.isArray(proposition?.items) ? proposition.items : [];
    for (const item of items) {
      const content = item?.data?.content;
      if (content === undefined || content === null) continue;

      const propositionRef: PropositionRef | null =
        proposition && proposition.id && proposition.scope
          ? {
              id: proposition.id,
              scope: proposition.scope,
              scopeDetails: proposition.scopeDetails,
            }
          : null;

      return { content, proposition: propositionRef };
    }
  }

  return { content: null, proposition: null };
}

async function callEdgeInteract(body: any, rawCookieString: string) {
  const response = await fetch(EDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: rawCookieString },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Edge interact failed: ${response.status} ${response.statusText} ${text}`);
  }

  return response.json();
}

export function buildPropositionEvent(params: {
  eventType: "decisioning.propositionInteract" | "decisioning.propositionDismiss";
  proposition: Proposition;
  action?: { id: string; label: string };
}) {
  const { eventType, proposition, action } = params;

  const base: any = {
    events: [
      {
        xdm: {
          _id: randomUUID(),
          eventType,
          timestamp: new Date().toISOString(),
          _experience: {
            decisioning: {
              propositions: [
                {
                  id: proposition.id,
                  scope: proposition.scope,
                  scopeDetails: proposition.scopeDetails,
                },
              ],
            },
          },
        },
      },
    ],
  };

  const decisioning = base.events[0].xdm._experience.decisioning;

  if (eventType === "decisioning.propositionInteract") {
    decisioning.propositionEventType = { interact: 1 };
    if (action) {
      decisioning.propositionAction = { id: action.id, label: action.label };
    }
  }

  if (eventType === "decisioning.propositionDismiss") {
    decisioning.propositionEventType = { dismiss: 1 };
  }

  return base;
}

export async function fetchOffers(ecid: string, cookieStore: CookieStoreLike, rawCookieString: string) {
  const body = buildPropositionFetchBody(ecid, cookieStore);

  const edgeJson = await callEdgeInteract(body, rawCookieString);
  const { content, proposition } = parsePersonalization(edgeJson);
  const edgeCookies = parseEdgeStateStoreCookies(edgeJson);

  const result: FetchOffersResult = {
    content,
    proposition,
    ecid,
    edgeCookies,
    rawEdgeResponse: edgeJson,
  };

  return result;
}

export async function sendExperienceEvent(
  ecid: string,
  actionType: "display" | "click" | "dismiss",
  trackingData: { id: string; scope: string; scopeDetails: any },
  rawCookieString: string,
  cookieStore?: CookieStoreLike,
) {
  const effectiveCookieStore: CookieStoreLike = cookieStore ?? { getAll: () => [] };

  const eventType =
    actionType === "display" ? "decisioning.propositionDisplay" : "decisioning.propositionInteract";

  const body = buildPropositionEventBody(
    ecid,
    eventType,
    {
      id: trackingData.id,
      scope: trackingData.scope,
      scopeDetails: trackingData.scopeDetails,
    },
    effectiveCookieStore,
    actionType === "display" ? undefined : actionType,
  );

  const edgeJson = await callEdgeInteract(body, rawCookieString);
  const edgeCookies = parseEdgeStateStoreCookies(edgeJson);

  return { success: true, edgeCookies, rawEdgeResponse: edgeJson };
}
