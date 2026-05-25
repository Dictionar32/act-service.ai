import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

import { buildMenuQuickReply, getMenuLookup, hasMenuQuestion } from "@/lib/menu";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

function isGreeting(text: string) {
  const greetings = [
    "halo",
    "hai",
    "hi",
    "p",
    "permisi",
    "assalamualaikum",
    "selamat pagi",
    "selamat siang",
    "selamat malam",
  ];

  return greetings.includes(text.toLowerCase().trim());
}

function hasAskedFirstVisit(history: Message[]) {
  return history.some(
    (msg) =>
      msg.role === "assistant" && msg.content.toLowerCase().includes("sudah pernah ke umayumcha")
  );
}

function hasOrderPhrase(text: string): boolean {
  return ["mau pesan", "pesan", "order", "beli"].some((k) => text.includes(k));
}

/**
 * Memory sederhana in-memory
 * key = senderId instagram
 */
const memoryStore = new Map<string, Message[]>();

const SYSTEM_PROMPT = `
Kamu adalah customer service Umayumcha.

Gaya bicara:
- Ramah
- Natural seperti admin Instagram asli
- Santai tapi sopan
- Maksimal 2 kalimat
- Jangan terlalu panjang
- Jangan mengulang salam atau perkenalan terus menerus

ATURAN:
1. Selalu gunakan kata "Kak" atau "Kakak".
2. Akhiri jawaban dengan "kak".
3. Jangan mengulang pertanyaan yang sudah pernah ditanyakan.
4. Gunakan konteks chat sebelumnya.
5. Jika customer sudah menjawab jumlah orang, jangan tanyakan lagi.
6. Jika customer sudah pernah disapa, jangan ulang pembukaan panjang.
7. Fokus menjawab pertanyaan terakhir customer.
8. Jika customer belum pernah datang, jelaskan singkat Paket Sewa dan Paket Makan.
9. Jika customer sudah menjawab apakah pernah datang atau belum, jangan tanyakan lagi.
10. Setelah customer menjawab belum pernah datang, tanyakan apakah datang sendiri atau bareng teman.
11. Jika customer menjawab sendiri, rekomendasikan Paket Single minimal Rp17.000.
12. Jangan langsung menjelaskan semua informasi sekaligus. Bangun percakapan bertahap dan natural.

INFORMASI UMAYUMCHA

PAKET:
- Paket Sewa → boleh bawa makanan dari luar
- Paket Makan → harus order menu dari Umayumcha

REKOMENDASI:
- Sendiri → Paket Single minimal Rp17.000
- 2-3 orang → Paket Group

MENU:
- Gunakan menu terbaru dari data sistem, jangan pakai daftar hardcoded lama.

CONTOH YANG BENAR:

User: saya sendiri
AI: Baik Kak, kalau sendiri kami rekomendasikan Paket Single dengan minimal order Rp17.000 ya kak.

User: ada apa saja?
AI: Ada Paket Sewa dan Paket Makan kak. Kalau Paket Sewa boleh bawa makanan dari luar, sedangkan Paket Makan order dari menu kami ya kak.

User: menu apa saja?
AI: Menu kami mengikuti data terbaru kami ya kak.
`;

export async function askAI(senderId: string, message: string): Promise<string> {
  /**
   * Ambil memory user
   */
  const history = memoryStore.get(senderId) || [];
  const previousUserMessage =
    history.filter((m) => m.role === "user").slice(-1)[0]?.content.toLowerCase().trim() || "";
  const normalizedMessage = message.toLowerCase().trim();

  /**
   * Simpan pesan user
   */
  history.push({
    role: "user",
    content: message,
  });

  /**
   * Batasi memory
   * hanya simpan 10 chat terakhir
   */
  const limitedHistory = history.slice(-10);
  const userHasAnsweredVisit = limitedHistory.some(
    (m) =>
      m.role === "user" && ["sudah", "belum", "udah", "pernah"].some((v) => m.content.toLowerCase().includes(v))
  );
  const lastAssistantMessage =
    limitedHistory.filter((m) => m.role === "assistant").slice(-1)[0]?.content || "";
  const lastUserMessage =
    limitedHistory.filter((m) => m.role === "user").slice(-2)[0]?.content.toLowerCase().trim() || "";

  if (["belum", "belom"].includes(normalizedMessage)) {
    const reply =
      "Baik Kak 😊 Di sini ada Paket Sewa dan Paket Makan ya kak. Kalau boleh tahu datang sendiri atau bareng teman kak?";

    limitedHistory.push({
      role: "assistant",
      content: reply,
    });

    memoryStore.set(senderId, limitedHistory);
    return reply;
  }

  if (isGreeting(normalizedMessage) && !hasAskedFirstVisit(limitedHistory)) {
    const welcome = "Halo Kak 😊 Sebelumnya Kakak sudah pernah ke Umayumcha belum kak?";

    limitedHistory.push({
      role: "assistant",
      content: welcome,
    });

    memoryStore.set(senderId, limitedHistory);
    return welcome;
  }

  if (normalizedMessage === previousUserMessage || (isGreeting(normalizedMessage) && isGreeting(lastUserMessage))) {
    const duplicateReply = userHasAnsweredVisit
      ? "Hehe iya Kak 😊 Ada yang ingin ditanyakan terkait paket atau menu kami kak?"
      : "Hehe iya Kak 😊 Sebelumnya Kakak sudah pernah ke Umayumcha belum kak?";

    limitedHistory.push({
      role: "assistant",
      content: duplicateReply,
    });

    memoryStore.set(senderId, limitedHistory);
    return duplicateReply;
  }

  if (hasOrderPhrase(normalizedMessage) && !normalizedMessage.includes("atas nama")) {
    const reply = "Baik Kak 😊 Mau pesan menu apa dan berapa jumlahnya ya kak?";
    limitedHistory.push({
      role: "assistant",
      content: reply,
    });
    memoryStore.set(senderId, limitedHistory);
    return reply;
  }

  if (hasMenuQuestion(normalizedMessage)) {
    const reply = buildMenuQuickReply();
    limitedHistory.push({
      role: "assistant",
      content: reply,
    });
    memoryStore.set(senderId, limitedHistory);
    return reply;
  }

  const menuNamesPattern = Object.keys(getMenuLookup())
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const menuWithQtyPattern = new RegExp(`(${menuNamesPattern})\\s*\\d+`, "i");
  if (menuWithQtyPattern.test(normalizedMessage)) {
    const match = normalizedMessage.match(menuWithQtyPattern);
    const normalizedOrder = match ? match[0].replace(/\s+/g, " ").trim() : "pesanan Kak";
    const reply = `Baik Kak 😊 Pesanan ${normalizedOrder} ya kak. Atas nama siapa pesanannya kak?`;
    limitedHistory.push({
      role: "assistant",
      content: reply,
    });
    memoryStore.set(senderId, limitedHistory);
    return reply;
  }

  if (normalizedMessage.startsWith("atas nama ")) {
    const customerName = message.replace(/^atas nama\s+/i, "").trim();
    const safeName = customerName || "Kak";
    const reply = `Baik Kak 😊 Nama pesanan sudah kami ubah menjadi ${safeName} ya kak.`;
    limitedHistory.push({
      role: "assistant",
      content: reply,
    });
    memoryStore.set(senderId, limitedHistory);
    return reply;
  }

  /**
   * Generate AI
   */
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `${SYSTEM_PROMPT}

Jangan mengulangi jawaban ini lagi:
"${lastAssistantMessage}"
`,
    messages: limitedHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature: 0.7,
  });

  /**
   * Simpan jawaban AI
   */
  limitedHistory.push({
    role: "assistant",
    content: text,
  });

  /**
   * Update memory
   */
  memoryStore.set(senderId, limitedHistory);

  let response = text.trim();
  if (response.length > 1000) {
    response = response.slice(0, 1000);
  }
  console.log("[AI RESPONSE]", response);
  return response;
}
