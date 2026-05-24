import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

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

INFORMASI UMAYUMCHA

PAKET:
- Paket Sewa → boleh bawa makanan dari luar
- Paket Makan → harus order menu dari Umayumcha

REKOMENDASI:
- Sendiri → Paket Single minimal Rp17.000
- 2-3 orang → Paket Group

MENU:
- Thai Tea Rp15.000
- Dimsum Rp18.000
- Brown Sugar Boba Rp25.000
- Taro Milk Tea Rp23.000
- Matcha Latte Rp24.000
- Mango Yakult Rp22.000

CONTOH YANG BENAR:

User: saya sendiri
AI: Baik Kak, kalau sendiri kami rekomendasikan Paket Single dengan minimal order Rp17.000 ya kak.

User: ada apa saja?
AI: Ada Paket Sewa dan Paket Makan kak. Kalau Paket Sewa boleh bawa makanan dari luar, sedangkan Paket Makan order dari menu kami ya kak.

User: menu apa saja?
AI: Menu kami ada Thai Tea, Dimsum, Brown Sugar Boba, Taro Milk Tea, Matcha Latte, dan Mango Yakult ya kak.
`;

export async function askAI(senderId: string, message: string): Promise<string> {
  /**
   * Ambil memory user
   */
  const history = memoryStore.get(senderId) || [];

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
  const lastAssistantMessage =
    limitedHistory.filter((m) => m.role === "assistant").slice(-1)[0]?.content || "";

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

  return text.trim();
}
