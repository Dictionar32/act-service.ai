import { askAI } from "@/lib/ai";
import { saveOrder } from "@/lib/sheets";
import { generateInvoice } from "@/lib/invoice";

export async function POST(req: Request) {
  const body = await req.json();

  const message = body.message;

  const aiReply = await askAI(message);

  const isOrder =
    message.toLowerCase().includes("order");

  if (isOrder) {
    await saveOrder({
      customer: "Budi",
      item: "Thai Tea",
      total: 40000,
      status: "PENDING",
    });

    const invoice = generateInvoice(
      "Budi",
      40000
    );

    return Response.json({
      reply: invoice,
    });
  }

  return Response.json({
    reply: aiReply,
  });
}