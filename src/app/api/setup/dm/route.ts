import { NextResponse } from "next/server";

const PAGE_TOKEN = process.env.IG_PAGE_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;

export async function GET() {
  try {
    const recipientId = process.env.TEST_RECIPIENT_ID;

    if (!recipientId) {
      return NextResponse.json({
        ok: false,
        error: "TEST_RECIPIENT_ID missing",
      });
    }

    const res = await fetch(`https://graph.facebook.com/v25.0/${IG_USER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "instagram",
        recipient: {
          id: recipientId,
        },
        message: {
          text: "Test DM dari setup endpoint",
        },
      }),
    });

    const text = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      response: text,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}
