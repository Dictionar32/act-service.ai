import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { OrderItem } from "./parser";

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);

export async function saveOrder(order: {
  customer: string;
  items: OrderItem[];
  total: number;
  status: string;
}) {
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["Orders"];
  const date = new Date().toISOString().split("T")[0];

  // Simpan satu row per item
  for (const i of order.items) {
    await sheet.addRow({
      date,
      customer: order.customer,
      item: i.item,
      qty: i.qty,
      total: i.subtotal,
      status: order.status,
    });
  }
}