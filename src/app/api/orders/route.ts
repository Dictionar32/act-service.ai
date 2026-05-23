import { askAI } from "@/lib/ai";
import { saveOrder } from "@/lib/sheets";
import { generateInvoice } from "@/lib/invoice";
import { trackAnalytics } from "@/lib/analytics";
import { parseOrder } from "@/lib/parser";
import { sendDM } from "@/lib/instagram";

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

      if (senderId) {
        await sendDM(senderId, invoice);
      }

      return Response.json({ reply: invoice, isOrder: true });
    }

    const reply = await askAI(message);

    if (senderId) {
      await sendDM(senderId, reply);
    }

    return Response.json({ reply, isOrder: false });
  } catch (err) {
    console.error("[orders] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}