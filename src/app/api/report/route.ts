import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);

export async function GET() {
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["Analytics"];
  const rows = await sheet.getRows();

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];

  const getRow = (date: string) =>
    rows.find((r) => r.get("date") === date);

  const todayRow = getRow(today);
  const yesterdayRow = getRow(yesterday);

  const extract = (row: ReturnType<typeof getRow>) => ({
    total_chat: Number(row?.get("total_chat") ?? 0),
    total_order: Number(row?.get("total_order") ?? 0),
    revenue: Number(row?.get("revenue") ?? 0),
  });

  const t = extract(todayRow);
  const y = extract(yesterdayRow);

  const conversionRate = t.total_chat > 0
    ? ((t.total_order / t.total_chat) * 100).toFixed(1)
    : "0.0";

  return Response.json({
    today: { date: today, ...t, conversion_rate: `${conversionRate}%` },
    yesterday: { date: yesterday, ...y },
    delta: {
      total_chat: t.total_chat - y.total_chat,
      total_order: t.total_order - y.total_order,
      revenue: t.revenue - y.revenue,
    },
  });
}