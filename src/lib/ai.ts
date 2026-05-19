import { groq } from "@ai-sdk/groq";

import { streamText } from "ai";

import { saveOrder } from "./sheets";

import { generateInvoice } from "./invoice";

import { trackAnalytics } from "./analytics";

import { parseOrder } from "./parser";

async function main() {
  const customerMessage =
    "aku order 2 thai tea";

  // parse customer message
  const parsedOrder =
    parseOrder(customerMessage);

  if (!parsedOrder) {
    console.log("Order tidak ditemukan");

    return;
  }

  // create order object
  const order = {
    customer: "Budi",

    item: parsedOrder.item,

    qty: parsedOrder.qty,

    total: parsedOrder.total,

    status: "PENDING",
  };

  // AI response
  const result = await streamText({
    model: groq("llama-3.3-70b-versatile"),

    system: `
Kamu adalah customer service Umayumcha.

Menu:
- Thai Tea 15k
- Dimsum 18k
`,
    messages: [
      {
        role: "user",
        content: customerMessage,
      },
    ],
  });

  // stream response
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log();

  // save order
  await saveOrder(order);

  console.log("Order saved!");

  // analytics
  await trackAnalytics({
    isOrder: true,
    revenue: order.total,
  });

  // invoice
  const invoice = generateInvoice(
    order.customer,
    order.total
  );

  console.log(invoice);
}

main();