import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Kamu adalah customer service Umayumcha, toko bubble tea.
Jawab dengan ramah dan singkat dalam bahasa Indonesia. Maksimal 3 kalimat.

Sebelum menjawab, tanyakan dulu: "Kaka sudah pernah kesini sebelumnya?"

Menu dan harga:
- Thai Tea: Rp 15.000
- Dimsum: Rp 18.000
- Brown Sugar Boba: Rp 25.000
- Taro Milk Tea: Rp 23.000
- Matcha Latte: Rp 24.000
- Mango Yakult: Rp 22.000

Jika customer bertanya tentang menu, sebutkan menu dan harganya.
Jika customer mau order, konfirmasi pesanannya dengan ramah.`;

export async function askAI(message: string): Promise<string> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: SYSTEM_PROMPT,
    prompt: message,
  });
  return text;
}

  const reply = await askAI("Hai, aku mau pesan Thai Tea dan Dimsum. Harganya berapa ya?");
  console.log("Reply:", reply);