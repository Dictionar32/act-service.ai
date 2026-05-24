const PAGE_TOKEN = process.env.IG_PAGE_TOKEN!;
const BASE_URL = "https://graph.facebook.com/v25.0";

export async function sendDM(recipientId: string, text: string): Promise<unknown> {
  try {
    const payload = {
      messaging_product: "instagram",
      recipient: { id: recipientId },
      message: { text },
    };

    console.log("[instagram] RECIPIENT:", recipientId);
    console.log("[instagram] PAYLOAD:", JSON.stringify(payload, null, 2));

    const res = await fetch(`${BASE_URL}/me/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    console.log("[instagram] RAW RESPONSE:", raw);

    let data: unknown = {};

    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    if (!res.ok) {
      console.error("[instagram] ERROR:", JSON.stringify(data, null, 2));
      throw new Error(JSON.stringify(data));
    }

    return data;
  } catch (err) {
    console.error("[instagram] SEND DM FAILED:", err);
    throw err;
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

export async function getUserProfile(userId: string): Promise<{ name: string; username: string }> {
  if (!PAGE_TOKEN) {
    return { name: "Kak", username: "" };
  }

  try {
    const res = await fetch(`${BASE_URL}/${userId}?fields=name,username&access_token=${PAGE_TOKEN}`);
    if (!res.ok) {
      console.warn(`[instagram] Gagal fetch profil user ${userId}: ${res.statusText}`);
      return { name: "Kak", username: "" };
    }
    const data = await res.json();
    return {
      name: data.name || data.username || "Kak",
      username: data.username || "",
    };
  } catch (error) {
    console.error(`[instagram] Error fetch profil user ${userId}:`, error);
    return { name: "Kak", username: "" };
  }
}
