"use server";

import { cookies } from "next/headers";
import type { EdgeCookie } from "@/lib/ajo-decisioning";

export async function persistEdgeCookies(edgeCookies: EdgeCookie[]) {
  if (!edgeCookies?.length) return;

  const store = await cookies();
  for (const c of edgeCookies) {
    store.set({
      name: c.name,
      value: c.value,
      ...c.options,
    });
  }
}

