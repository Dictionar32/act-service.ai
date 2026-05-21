const PAGE_TOKEN = process.env.IG_PAGE_TOKEN;
const API_URL = "https://graph.facebook.com/v19.0/me/messages";

export async function sendDM(recipientId: string, text: string) {
  if (!PAGE_TOKEN) {
    console.warn("[instagram] IG_PAGE_TOKEN belum diset, skip kirim DM");
    console.log("[instagram] Pesan yang harusnya terkirim:", text);
    return;
  }

  const res = await fetch(`${API_URL}?access_token=${PAGE_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[instagram] Gagal kirim DM:", data);
  }
  return data;
}