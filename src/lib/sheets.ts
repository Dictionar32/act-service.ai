import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEET_ID!,
  serviceAccountAuth
);

export async function saveOrder(data: any) {
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle["Orders"];

  await sheet.addRow({
    customer: data.customer,
    item: data.item,
    total: data.total,
    status: data.status,
  });
}