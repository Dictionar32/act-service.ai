import { OrderItem } from "./parser";

export function generateInvoice(
  customer: string,
  items: OrderItem[],
  total: number
): string {
  const itemLines = items
    .map((i) => `🧋 ${i.item} x${i.qty}  →  Rp ${i.subtotal.toLocaleString("id-ID")}`)
    .join("\n");

  return `Halo ${customer} 😊

🧾 Invoice Order Umayumcha
━━━━━━━━━━━━━━━━━━━━
${itemLines}
━━━━━━━━━━━━━━━━━━━━
💰 Total: Rp ${total.toLocaleString("id-ID")}
━━━━━━━━━━━━━━━━━━━━

Transfer ke:
🏦 BCA  : 1234567890
       a/n Umayumcha

Setelah transfer, kirim bukti bayar ke sini ya kak!
Pesanan diproses setelah pembayaran dikonfirmasi 🙏

Terima kasih sudah order! ☕`;
}