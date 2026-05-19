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

export async function trackAnalytics({
  revenue = 0,
  isOrder = false,
}: {
  revenue?: number;
  isOrder?: boolean;
}) {
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle["Analytics"];

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const rows = await sheet.getRows();

  const todayRow = rows.find(
    (row: any) => row.get("date") === today
  );

  // kalau hari ini belum ada row
  if (!todayRow) {
    await sheet.addRow({
      date: today,

      total_chat: 1,

      total_order: isOrder ? 1 : 0,

      revenue,
    });

    console.log("Analytics created!");

    return;
  }

  // update analytics hari ini
  const currentChat =
    Number(todayRow.get("total_chat")) || 0;

  const currentOrder =
    Number(todayRow.get("total_order")) || 0;

  const currentRevenue =
    Number(todayRow.get("revenue")) || 0;

  todayRow.set(
    "total_chat",
    currentChat + 1
  );

  if (isOrder) {
    todayRow.set(
      "total_order",
      currentOrder + 1
    );
  }

  todayRow.set(
    "revenue",
    currentRevenue + revenue
  );

  await todayRow.save();

  console.log("Analytics updated!");
}