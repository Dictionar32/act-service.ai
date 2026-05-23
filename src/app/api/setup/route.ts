const PAGE_TOKEN = process.env.IG_PAGE_TOKEN;
const PAGE_ID = process.env.IG_PAGE_ID;

export async function GET() {
  if (!PAGE_TOKEN || !PAGE_ID) {
    return Response.json({ error: "IG_PAGE_TOKEN atau IG_PAGE_ID belum diset" }, { status: 400 });
  }

  const fields = [
    "messages",
    "messaging_postbacks",
    "messaging_referral",
    "messaging_seen",
    "comments",
  ].join(",");

  const res = await fetch(
    `https://graph.facebook.com/v25.0/${PAGE_ID}/subscribed_apps?access_token=${PAGE_TOKEN}&subscribed_fields=${fields}`,
    { method: "POST" }
  );

  const data = await res.json();
  return Response.json(data);
}