const PAGE_TOKEN = process.env.IG_PAGE_TOKEN;
const BASE_URL = "https://graph.facebook.com/v25.0";

export async function sendDM(recipientId: string, text: string): Promise<void> {
  if (!PAGE_TOKEN) {
    console.warn("[instagram] IG_PAGE_TOKEN belum diset, skip kirim DM");
    console.log("[instagram] Pesan yang harusnya terkirim:", text);
    return;
  }

  const res = await fetch(`${BASE_URL}/me/messages?access_token=${PAGE_TOKEN}`, {
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
    const errMsg = data?.error?.message ?? "Unknown error";
    console.error(`[instagram] Gagal kirim DM ke ${recipientId}: ${errMsg}`);
    throw new Error(`Instagram DM failed: ${errMsg}`);
  }
}

export async function replyComment(commentId: string, text: string): Promise<void> {
  if (!PAGE_TOKEN) {
    console.warn("[instagram] IG_PAGE_TOKEN belum diset, skip reply komentar");
    return;
  }

  const res = await fetch(`${BASE_URL}/${commentId}/replies?access_token=${PAGE_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errMsg = data?.error?.message ?? "Unknown error";
    console.error(`[instagram] Gagal reply komentar ${commentId}: ${errMsg}`);
    throw new Error(`Instagram comment reply failed: ${errMsg}`);
  }
}