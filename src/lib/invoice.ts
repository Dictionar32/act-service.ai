export function generateInvoice(
  customer: string,
  item: string,
  qty: number,
  total: number
): string {
  return `Halo ${customer} 😊

🧾 Invoice Order Umayumcha
━━━━━━━━━━━━━━━━━━━━
🧋 ${item} x${qty}
💰 Total: Rp ${total.toLocaleString("id-ID")}
━━━━━━━━━━━━━━━━━━━━

Transfer ke:
🏦 BCA  : 1234567890
       a/n Umayumcha

Setelah transfer, kirim bukti bayar ke sini ya kak!
Pesanan diproses setelah pembayaran dikonfirmasi 🙏

Terima kasih sudah order! ☕`;
}