import { sendDM, replyComment } from "@/lib/instagram";
import { askAI } from "@/lib/ai";
import { parseOrder } from "@/lib/parser";
import { saveOrder } from "@/lib/sheets";
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

async function handleComment(senderId: string, commentId: string, text: string) {
  console.log(`[webhook] Komentar dari ${senderId}: "${text}"`);

  const parsed = parseOrder(text);

  if (parsed) {
    // Order lewat komentar — reply publik singkat + DM invoice
    await replyComment(
      commentId,
      `Halo Kak! Pesanan kamu sudah kami terima 🧋 Cek DM ya untuk detail invoice-nya!`
    );

    await saveOrder({
      customer: senderId,
      items: parsed.items,
      total: parsed.total,
      status: "PENDING",
    });

    const invoice = generateInvoice("Kak", parsed.items, parsed.total);
    await sendDM(senderId, invoice);

    await trackAnalytics({ isOrder: true, revenue: parsed.total });
  } else {
    // Pertanyaan biasa — reply publik via AI (singkat)
    const reply = await askAI(
      `Balas komentar Instagram ini dengan singkat (1 kalimat), ramah, bahasa Indonesia:\n"${text}"`
    );
    await replyComment(commentId, reply);
    await trackAnalytics({ isOrder: false, revenue: 0 });
  }
}

async function handleReferral(senderId: string, ref: string, source: string) {
  console.log(`[webhook] Referral dari ${senderId}: ref="${ref}" source="${source}"`);

  await sendDM(
    senderId,
    `Halo Kak, selamat datang di Umayumcha! 🧋\n\nKami siap melayani pesanan kamu. Berikut menu kami:\n\n🧋 Thai Tea — Rp 15.000\n🥟 Dimsum — Rp 18.000\n🧋 Brown Sugar Boba — Rp 25.000\n🧋 Taro Milk Tea — Rp 23.000\n🍵 Matcha Latte — Rp 24.000\n🥭 Mango Yakult — Rp 22.000\n\nMau pesan apa, Kak? 😊`
  );
}

async function handlePostback(senderId: string, title: string, payload: string) {
  console.log(`[webhook] Postback dari ${senderId}: title="${title}" payload="${payload}"`);

  if (title === "Talk to human" || payload === "TALK_TO_HUMAN") {
    await sendDM(
      senderId,
      `Halo Kak 👋 Kamu mau ngobrol langsung dengan admin kami?\n\nSilakan hubungi kami di:\n📱 WA: +62 812-3456-7890\n⏰ Jam operasional: 09.00–21.00 WIB\n\nAtau tunggu sebentar, admin kami akan segera membalas! 🙏`
    );
    return;
  }

  const reply = await askAI(`User menekan tombol: ${title}`);
  await sendDM(senderId, reply);
}

async function handleMessage(senderId: string, text: string) {
  const parsed = parseOrder(text);
  const isOrder = parsed !== null;

  await trackAnalytics({ isOrder, revenue: parsed?.total ?? 0 });

  if (isOrder) {
    await saveOrder({
      customer: senderId,
      items: parsed!.items,
      total: parsed!.total,
      status: "PENDING",
    });

    const invoice = generateInvoice("Kak", parsed!.items, parsed!.total);
    await sendDM(senderId, invoice);
  } else {
    const reply = await askAI(text);
    await sendDM(senderId, reply);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log("WEBHOOK MASUK:", JSON.stringify(body, null, 2));

  const tasks: Promise<void>[] = [];

  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change.value;
      if (value?.is_self) continue;

      if (change.field === "comments") {
        const senderId: string = value?.from?.id;
        const commentId: string = value?.id;
        const text: string = value?.text;
        if (!senderId || !commentId || !text) continue;

        tasks.push(
          handleComment(senderId, commentId, text).catch((err) =>
            console.error(`[webhook] Error handle comment dari ${senderId}:`, err)
          )
        );
      } else {
        const senderId: string = value?.sender?.id;
        if (!senderId) continue;

        if (change.field === "messages") {
          const text: string = value?.message?.text;
          if (!text) continue;

          tasks.push(
            handleMessage(senderId, text).catch((err) =>
              console.error(`[webhook] Error handle message dari ${senderId}:`, err)
            )
          );
        } else if (change.field === "messaging_postbacks") {
          const title: string = value?.postback?.title ?? "";
          const payload: string = value?.postback?.payload ?? "";
          if (!title && !payload) continue;

          tasks.push(
            handlePostback(senderId, title, payload).catch((err) =>
              console.error(`[webhook] Error handle postback dari ${senderId}:`, err)
            )
          );
        } else if (change.field === "messaging_referral") {
          const ref: string = value?.referral?.ref ?? "";
          const source: string = value?.referral?.source ?? "";

          tasks.push(
            handleReferral(senderId, ref, source).catch((err) =>
              console.error(`[webhook] Error handle referral dari ${senderId}:`, err)
            )
          );
        } else if (change.field === "messaging_seen") {
          console.log(`[webhook] Pesan dibaca oleh ${senderId}`);
        }
      }
    }
  }

  await Promise.all(tasks).catch((err) =>
    console.error("[webhook] Unexpected error:", err)
  );

  return Response.json({ ok: true });
}