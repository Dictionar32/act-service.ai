export function generateInvoice(
  customer: string,
  total: number
) {
  return `
Halo ${customer} 😊

Invoice Order

Total: Rp${total}

Transfer ke:
BCA 123456789
a/n Umayumcha

Terima kasih 🙏
`;
}