const PAGE_TOKEN = process.env.IG_PAGE_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const BASE_URL = "https://graph.facebook.com/v25.0";

function createInstagramHeaders(): Record<string, string> | null {
  if (!PAGE_TOKEN) {
    console.warn("[instagram] missing IG_PAGE_TOKEN");
    return null;
  }

  return {
    Authorization: `Bearer ${PAGE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function sendDM(recipientId: string, text: string): Promise<unknown> {
  const headers = createInstagramHeaders();
  if (!headers) {
    return {
      skipped: true,
      reason: "missing_token",
    };
  }
  const instagramUserId = IG_USER_ID?.trim();
  if (!instagramUserId) {
    console.warn("[instagram] missing IG_USER_ID");
    return {
      skipped: true,
      reason: "missing_ig_user_id",
    };
  }

  console.log("[DM] recipient:", recipientId);
  console.log("[DM] ig user:", instagramUserId);
  console.log("[DM] token exists:", !!PAGE_TOKEN);

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

  const res = await fetch(`${BASE_URL}/${instagramUserId}/messages`, {
    method: "POST",

    headers,

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
  const headers = createInstagramHeaders();
  if (!headers) {
    console.warn("[instagram] skip comment reply");
    return;
  }

  const res = await fetch(`${BASE_URL}/${commentId}/replies`, {
    method: "POST",
    headers,
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
  try {
    const headers = createInstagramHeaders();
    if (!headers) {
      return { name: "Kak", username: "" };
    }

    const res = await fetch(`${BASE_URL}/${userId}?fields=name,username`, {
      headers,
    });
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
