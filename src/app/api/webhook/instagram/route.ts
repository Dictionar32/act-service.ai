import { sendDM, replyComment, getUserProfile } from "@/lib/instagram";
import { askAI } from "@/lib/ai";
import { hasOrderIntent, parseOrder } from "@/lib/parser";
import { saveOrder, saveCustomer } from "@/lib/sheets";
import { generateInvoice } from "@/lib/invoice";
import { trackAnalytics } from "@/lib/analytics";

const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "ngrok-skip-browser-warning": "true",
      },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

async function registerCustomerIfNeeded(senderId: string) {
  try {
    const profile = await getUserProfile(senderId);
    await saveCustomer({
      instagram_id: senderId,
      name: profile.name,
      status: "ACTIVE",
    });
    return profile;
  } catch (error) {
    console.error(`[webhook] Gagal meregistrasi customer ${senderId}:`, error);
    return { name: "Kak", username: "" };
  }
}

async function handleComment(senderId: string, commentId: string, text: string) {
  console.log(`[webhook] Komentar dari ${senderId}: "${text}"`);

  // Registrasi customer baru dan dapatkan namanya
  const profile = await registerCustomerIfNeeded(senderId);
  const customerName = profile.name || "Kak";

  const parsed = parseOrder(text);

  if (parsed) {
    // Order lewat komentar — reply publik singkat + DM invoice
    await replyComment(
      commentId,
      `Halo Kak! Pesanan kamu sudah kami terima 🧋 Cek DM ya untuk detail invoice-nya!`
    );

    await saveOrder({
      customer: customerName,
      items: parsed.items,
      total: parsed.total,
      status: "PENDING",
    });

    const invoice = generateInvoice(customerName, parsed.items, parsed.total);
    await sendDM(senderId, invoice);

    await trackAnalytics({ isOrder: true, revenue: parsed.total });
  } else {
    // Pertanyaan biasa — reply publik via AI (singkat)
    const reply = await askAI(
      senderId,
      `Balas komentar Instagram ini dengan singkat (1 kalimat), ramah, bahasa Indonesia:\n"${text}"`
    );
    await replyComment(commentId, reply);
    await trackAnalytics({ isOrder: false, revenue: 0 });
  }
}

async function handleReferral(senderId: string, ref: string, source: string) {
  console.log(`[webhook] Referral dari ${senderId}: ref="${ref}" source="${source}"`);

  // Registrasi customer
  await registerCustomerIfNeeded(senderId);

  await sendDM(
    senderId,
    `Halo Kak, selamat datang di Umayumcha! 🧋\n\nKami siap melayani pesanan kamu. Berikut menu kami:\n\n🧋 Thai Tea — Rp 15.000\n🥟 Dimsum — Rp 18.000\n🧋 Brown Sugar Boba — Rp 25.000\n🧋 Taro Milk Tea — Rp 23.000\n🍵 Matcha Latte — Rp 24.000\n🥭 Mango Yakult — Rp 22.000\n\nMau pesan apa, Kak? 😊`
  );
}

async function handlePostback(senderId: string, title: string, payload: string) {
  console.log(`[webhook] Postback dari ${senderId}: title="${title}" payload="${payload}"`);

  // Registrasi customer
  await registerCustomerIfNeeded(senderId);

  if (title === "Talk to human" || payload === "TALK_TO_HUMAN") {
    await sendDM(
      senderId,
      `Halo Kak 👋 Kamu mau ngobrol langsung dengan admin kami?\n\nSilakan hubungi kami di:\n📱 WA: +62 812-3456-7890\n⏰ Jam operasional: 09.00–21.00 WIB\n\nAtau tunggu sebentar, admin kami akan segera membalas! 🙏`
    );
    return;
  }

  const reply = await askAI(senderId, `User menekan tombol: ${title}`);
  await sendDM(senderId, reply);
}

async function handleMessage(senderId: string, text: string) {
  // Registrasi customer baru dan dapatkan namanya
  const profile = await registerCustomerIfNeeded(senderId);
  const customerName = profile.name || "Kak";

  const parsed = parseOrder(text);
  const isOrder = hasOrderIntent(text) && parsed !== null;

  await trackAnalytics({ isOrder, revenue: parsed?.total ?? 0 });

  if (isOrder) {
    await saveOrder({
      customer: customerName,
      items: parsed!.items,
      total: parsed!.total,
      status: "PENDING",
    });

    const invoice = generateInvoice(customerName, parsed!.items, parsed!.total);
    await sendDM(senderId, invoice);
  } else {
    const reply = await askAI(senderId, text);
    await sendDM(senderId, reply);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log("[webhook] incoming:", JSON.stringify(body, null, 2));

  const tasks: Promise<void>[] = [];

  for (const entry of body?.entry ?? []) {
    // 1. Tangani DMs & Postback (messaging) - Instagram Direct & Messenger
    for (const messageEvent of entry?.messaging ?? []) {
      const senderId = messageEvent?.sender?.id;
      console.log("[webhook] messaging.sender.id:", senderId);
      if (!senderId) continue;

      // Skip echo messages (pesan dari bot kita sendiri)
      if (messageEvent?.message?.is_echo) {
        console.log("[webhook] Skip echo message");
        continue;
      }

      if (messageEvent?.message) {
        const text = messageEvent.message.text;
        if (text) {
          tasks.push(
            handleMessage(senderId, text).catch((err) =>
              console.error(`[webhook] Error handle message dari ${senderId}:`, err)
            )
          );
        }
      } else if (messageEvent?.postback) {
        const title = messageEvent.postback.title ?? "";
        const payload = messageEvent.postback.payload ?? "";
        tasks.push(
          handlePostback(senderId, title, payload).catch((err) =>
            console.error(`[webhook] Error handle postback dari ${senderId}:`, err)
          )
        );
      } else if (messageEvent?.referral) {
        const ref = messageEvent.referral.ref ?? "";
        const source = messageEvent.referral.source ?? "";
        tasks.push(
          handleReferral(senderId, ref, source).catch((err) =>
            console.error(`[webhook] Error handle referral dari ${senderId}:`, err)
          )
        );
      } else if (messageEvent?.read) {
        console.log(`[webhook] Pesan dibaca oleh ${senderId}`);
      }
    }

    // 2. Tangani Komentar (changes) - Instagram Feed Comments
    for (const change of entry?.changes ?? []) {
      const value = change.value;
      if (value?.is_self) continue;

      if (change.field === "comments") {
        const senderId = value?.sender?.id ?? value?.from?.id;
        if (!senderId) continue;
        console.log("[webhook] comments sender id:", senderId);
        const commentId: string = value?.id;
        const text: string = value?.text;
        if (!senderId || !commentId || !text) continue;

        tasks.push(
          handleComment(senderId, commentId, text).catch((err) =>
            console.error(`[webhook] Error handle comment dari ${senderId}:`, err)
          )
        );
      }
    }
  }

  await Promise.all(tasks).catch((err) =>
    console.error("[webhook] Unexpected error:", err)
  );

  return Response.json({ ok: true });
}
