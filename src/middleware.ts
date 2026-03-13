import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const EDGE_URL =
  "https://edge.adobedc.net/ee/v2/interact?dataStreamId=251a1e44-93eb-4222-bc5a-63b5e16a57e7";

const AJO_SURFACE_URI = "web://ajo-poc-nine.vercel.app/#ajo_poc";
const AJO_DOMAIN = "ajo-poc-nine.vercel.app";

function getKndctrEntriesFromRequestCookies(req: NextRequest) {
  const entries: { key: string; value: string }[] = [];
  for (const c of req.cookies.getAll()) {
    if (/^kndctr_.*_AdobeOrg_identity$/i.test(c.name) || /^kndctr_.*_AdobeOrg_cluster$/i.test(c.name)) {
      entries.push({ key: c.name, value: c.value });
    }
  }
  return entries;
}

function getEcidFromCookies(req: NextRequest): string | null {
  const all = req.cookies.getAll();
  const amcv = all.find((c) => c.name.startsWith("AMCV_"));
  if (amcv) {
    const decodedValue = decodeURIComponent(amcv.value);
    const match = decodedValue.match(/MCMID\|(\d+)/);
    if (match?.[1]) return match[1];
  }

  const kndctrIdentity = all.find((c) => c.name.includes("_identity"));
  if (kndctrIdentity) {
    const decodedValue = decodeURIComponent(kndctrIdentity.value);
    const match = decodedValue.match(/ecid\|([^|]+)/i);
    if (match?.[1]) return match[1];
  }

  return null;
}

function parsePersonalization(edgeJson: any) {
  const handles: any[] = Array.isArray(edgeJson?.handle) ? edgeJson.handle : [];
  const decisionHandle = handles.find((h) => h?.type === "personalization:decisions");
  const payloads: any[] = Array.isArray(decisionHandle?.payload) ? decisionHandle.payload : [];

  for (const proposition of payloads) {
    const items: any[] = Array.isArray(proposition?.items) ? proposition.items : [];
    for (const item of items) {
      const content = item?.data?.content;
      if (content === undefined || content === null) continue;

      const propositionRef =
        proposition && proposition.id && proposition.scope
          ? { id: proposition.id, scope: proposition.scope, scopeDetails: proposition.scopeDetails }
          : null;

      return { content, proposition: propositionRef };
    }
  }

  return { content: null, proposition: null };
}

function parseStateStoreCookies(edgeJson: any) {
  const handles: any[] = Array.isArray(edgeJson?.handle) ? edgeJson.handle : [];
  const storeHandles = handles.filter((h) => h?.type === "state:store");

  const cookies: Array<{ name: string; value: string; attrs?: any }> = [];
  for (const h of storeHandles) {
    const payload = Array.isArray(h?.payload) ? h.payload : [];
    for (const p of payload) {
      if (typeof p?.key !== "string" || typeof p?.value !== "string") continue;
      cookies.push({ name: p.key, value: p.value, attrs: p.attrs ?? {} });
    }
  }
  return cookies;
}

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/offers")) return NextResponse.next();

  const rawCookieString = req.headers.get("cookie") ?? "";
  const ecid = getEcidFromCookies(req) ?? req.cookies.get("poc_ecid")?.value ?? "fallback-ecid-123";

  const body = {
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
      identity: {
        fetch: ["ECID"],
      },
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
        entries: getKndctrEntriesFromRequestCookies(req),
      },
    },
  };

  const res = NextResponse.next();
  res.cookies.set({ name: "ajo_mw_ran", value: "1", path: "/", sameSite: "lax" });

  let edgeJson: any = null;
  try {
    const resp = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: rawCookieString },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.warn("Edge interact non-200", resp.status, resp.statusText);
      return res;
    }

    edgeJson = await resp.json();
  } catch (e) {
    console.warn("Edge interact failed", e);
    return res;
  }

  const { content, proposition } = parsePersonalization(edgeJson);
  const storedCookies = parseStateStoreCookies(edgeJson);

  res.cookies.set({
    name: "ajo_edge_content",
    value: encodeURIComponent(JSON.stringify(content ?? null)),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  res.cookies.set({
    name: "ajo_edge_proposition",
    value: encodeURIComponent(JSON.stringify(proposition ?? null)),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  res.cookies.set({
    name: "ajo_edge_ecid",
    value: ecid,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  for (const c of storedCookies) {
    const attrs = c.attrs ?? {};
    const sameSiteRaw = typeof attrs?.sameSite === "string" ? attrs.sameSite.toLowerCase() : undefined;
    const sameSite =
      sameSiteRaw === "lax" || sameSiteRaw === "strict" || sameSiteRaw === "none" ? sameSiteRaw : undefined;

    res.cookies.set({
      name: c.name,
      value: c.value,
      domain: typeof attrs?.domain === "string" ? attrs.domain : undefined,
      path: typeof attrs?.path === "string" ? attrs.path : undefined,
      secure: typeof attrs?.secure === "boolean" ? attrs.secure : undefined,
      httpOnly: typeof attrs?.httpOnly === "boolean" ? attrs.httpOnly : undefined,
      sameSite,
      maxAge: typeof attrs?.maxAge === "number" ? attrs.maxAge : undefined,
      expires: typeof attrs?.expires === "string" ? new Date(attrs.expires) : undefined,
    });
  }

  return res;
}

export const config = {
  matcher: ["/offers/:path*"],
};

