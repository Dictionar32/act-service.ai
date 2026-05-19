import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,

  key: process.env.GOOGLE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  ),

  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEET_ID!,
  auth
);

export async function saveOrder(order: {
  customer: string;
  item: string;
  qty: number;
  total: number;
  status: string;
}) {
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle["Orders"];

  await sheet.addRow({
    customer: order.customer,
    item: order.item,
    qty: order.qty,
    total: order.total,
    status: order.status,
  });

  console.log("Order saved!");
}