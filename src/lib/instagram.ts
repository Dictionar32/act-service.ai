const PAGE_TOKEN = process.env.IG_PAGE_TOKEN!;
const IG_USER_ID = process.env.IG_USER_ID;
const BASE_URL = "https://graph.facebook.com/v25.0";

export async function sendDM(recipientId: string, text: string): Promise<unknown> {
  console.log("[instagram] function called");
  console.log("[instagram] recipientId:", recipientId);
  const messagingTarget = IG_USER_ID?.trim() ? IG_USER_ID.trim() : "me";
  console.log("[instagram] target:", messagingTarget);

  const payload = {
    messaging_product: "instagram",

    recipient: {
      id: recipientId,
    },

    message: {
      text,
    },
  };

  console.log("[instagram] payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(`${BASE_URL}/${messagingTarget}/messages`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${PAGE_TOKEN}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });

  const raw = await res.text();

  console.log("[instagram] STATUS:", res.status);
  console.log("[instagram] RAW RESPONSE:", raw);

  if (!res.ok) {
    throw new Error(raw);
  }

  return JSON.parse(raw);
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
