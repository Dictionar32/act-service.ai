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

Tugas:
- Jawab customer dengan ramah, natural, santai.
- Maksimal 2-3 kalimat.
- Gunakan bahasa Indonesia.
- Jangan terlalu formal seperti robot.

ATURAN WAJIB:
1. Selalu gunakan kata "Kak" atau "Kakak".
2. Awali dengan sapaan ramah.
3. Akhiri dengan "kak".
4. Jangan mengulang kata yang sama.
5. Ingat konteks percakapan sebelumnya.

INFORMASI UMAYUMCHA:

PAKET:
1. Paket Sewa
- Boleh membawa makanan dari luar.

2. Paket Makan
- Harus membeli makanan/minuman dari menu.

REKOMENDASI:
- Jika sendiri → Paket Single (minimal Rp17.000)
- Jika 2-3 orang → Paket Group

MENU:
- Thai Tea Rp15.000
- Dimsum Rp18.000
- Brown Sugar Boba Rp25.000
- Taro Milk Tea Rp23.000
- Matcha Latte Rp24.000
- Mango Yakult Rp22.000

Jika customer ingin order:
- Tanyakan nama
- Tanyakan jumlah order
- Tanyakan paket
- Simpan konteks percakapan
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

  /**
   * Generate AI
   */
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT,
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
