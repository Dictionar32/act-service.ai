import { askAI } from "@/lib/ai";
import { saveOrder } from "@/lib/sheets";
import { generateInvoice } from "@/lib/invoice";
import { trackAnalytics } from "@/lib/analytics";
import { parseOrder } from "@/lib/parser";
import { sendDM } from "@/lib/instagram";

function isValidInstagramRecipientId(senderId: string): boolean {
  return /^\d{10,30}$/.test(senderId);
}

function normalizeSenderId(senderId: unknown): string {
  return String(senderId ?? "").trim();
}

async function sendDMIfPossible(senderId: unknown, text: string): Promise<void> {
  const normalizedSenderId = normalizeSenderId(senderId);
  console.log("[orders] raw senderId:", senderId);
  console.log("[orders] normalized senderId:", normalizedSenderId);
  console.log("[orders] isValid:", isValidInstagramRecipientId(normalizedSenderId));

  if (!isValidInstagramRecipientId(normalizedSenderId)) {
    if (senderId) {
      console.warn(`[orders] Skip Instagram DM because senderId is invalid: ${String(senderId)}`);
    }
    return;
  }

  try {
    console.log("[orders] before sendDM");
    await sendDM(normalizedSenderId, text);
  } catch (error) {
    console.warn("[orders] Failed to send Instagram DM:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, senderId, customerName = "Kak" } = body;

    if (!message) {
      return Response.json({ error: "message required" }, { status: 400 });
    }

    const parsed = parseOrder(message);
    const isOrder = parsed !== null;

    await trackAnalytics({ isOrder, revenue: parsed?.total ?? 0 });

    if (isOrder) {
      await saveOrder({
        customer: customerName,
        items: parsed!.items,
        total: parsed!.total,
        status: "PENDING",
      });

      const invoice = generateInvoice(customerName, parsed!.items, parsed!.total);

      await sendDMIfPossible(senderId, invoice);

      return Response.json({ reply: invoice, isOrder: true });
    }

    const aiSenderId = typeof senderId === "string" && senderId.trim() ? senderId.trim() : "web-guest";
    const reply = await askAI(aiSenderId, message);

    await sendDMIfPossible(senderId, reply);

    return Response.json({ reply, isOrder: false });
  } catch (err) {
    console.error("[orders] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
