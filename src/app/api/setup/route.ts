import { NextResponse } from "next/server";

const PAGE_TOKEN = process.env.IG_PAGE_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;

async function fetchJSON(url: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PAGE_TOKEN}`,
    },
  });

  const text = await res.text();

  try {
    return {
      ok: res.ok,
      status: res.status,
      data: JSON.parse(text),
    };
  } catch {
    return {
      ok: res.ok,
      status: res.status,
      raw: text,
    };
  }
}

export async function GET() {
  try {
    if (!PAGE_TOKEN) {
      return NextResponse.json({
        ok: false,
        error: "IG_PAGE_TOKEN missing",
      });
    }

    const me = await fetchJSON("https://graph.facebook.com/v25.0/me?fields=id,name");

    const ig = IG_USER_ID
      ? await fetchJSON(`https://graph.facebook.com/v25.0/${IG_USER_ID}?fields=id,username`)
      : null;

    return NextResponse.json({
      ok: true,
      env: {
        hasToken: !!PAGE_TOKEN,
        hasIgUserId: !!IG_USER_ID,
      },
      me,
      instagram: ig,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    });
  }
}
