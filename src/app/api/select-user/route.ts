import { NextResponse } from "next/server";

const COOKIE_NAME = "ajo_user";

export async function POST(req: Request) {
  const form = await req.formData();
  const userId = String(form.get("userId") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/offers");

  if (!userId) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const res = NextResponse.redirect(new URL(redirectTo, req.url), 302);
  res.cookies.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return res;
}

