import { askAI } from "@/lib/ai";
import { saveOrder } from "@/lib/sheets";
import { generateInvoice } from "@/lib/invoice";
import { trackAnalytics } from "@/lib/analytics";
import { parseOrder } from "@/lib/parser";
import { sendDM } from "@/lib/instagram";

export async function POST(req: Request) {
  const body = await req.json();
  const { message, senderId, customerName = "Kak" } = body;

  if (!message) {
    return Response.json({ error: "message required" }, { status: 400 });
  }

  const parsed = parseOrder(message);
  const isOrder = parsed !== null;

  // Track analytics (tiap pesan masuk dihitung)
  await trackAnalytics({ isOrder, revenue: parsed?.total ?? 0 });

  if (isOrder) {
    // Simpan order ke Google Sheets
    await saveOrder({
      customer: customerName,
      item: parsed!.item,
      qty: parsed!.qty,
      total: parsed!.total,
      status: "PENDING",
    });

    // Generate & kirim invoice
    const invoice = generateInvoice(customerName, parsed!.item, parsed!.qty, parsed!.total);

    if (senderId) {
      await sendDM(senderId, invoice);
    }

    return Response.json({ reply: invoice, isOrder: true });
  }

  // Bukan order → AI reply biasa
  const reply = await askAI(message);

  if (senderId) {
    await sendDM(senderId, reply);
  }

  return Response.json({ reply, isOrder: false });
}