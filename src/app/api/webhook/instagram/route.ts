import { sendDM } from "@/lib/instagram";
import { askAI } from "@/lib/ai";
import { parseOrder } from "@/lib/parser";
import { saveOrder } from "@/lib/sheets";
import { generateInvoice } from "@/lib/invoice";
import { trackAnalytics } from "@/lib/analytics";

const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "ngrok-skip-browser-warning": "true",
      },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

// Terima pesan masuk dari Instagram
export async function POST(req: Request) {
  const body = await req.json();
  console.log("WEBHOOK MASUK:", JSON.stringify(body, null, 2));

  for (const entry of body?.entry ?? []) {
    // Format Instagram API: entry.changes
    for (const change of entry?.changes ?? []) {
      if (change.field !== "messages") continue;

      const senderId: string = change.value?.sender?.id;
      const text: string = change.value?.message?.text;

      if (!senderId || !text) continue;

      const parsed = parseOrder(text);
      const isOrder = parsed !== null;

      await trackAnalytics({ isOrder, revenue: parsed?.total ?? 0 });

      if (isOrder) {
        await saveOrder({
          customer: senderId,
          item: parsed!.item,
          qty: parsed!.qty,
          total: parsed!.total,
          status: "PENDING",
        });

        const invoice = generateInvoice("Kak", parsed!.item, parsed!.qty, parsed!.total);
        await sendDM(senderId, invoice);
      } else {
        const reply = await askAI(text);
        await sendDM(senderId, reply);
      }
    }
  }

  return Response.json({ ok: true });
}