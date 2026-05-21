const MENU: Record<string, number> = {
  "thai tea": 15000,
  dimsum: 18000,
  "brown sugar boba": 25000,
  "taro milk tea": 23000,
  "matcha latte": 24000,
  "mango yakult": 22000,
};

export function parseOrder(message: string) {
  const lower = message.toLowerCase();

  let item = "";
  let qty = 1;

  // detect qty — angka atau kata
  const qtyMatch = lower.match(/\b(\d+)\b/);
  if (qtyMatch) qty = Number(qtyMatch[1]);

  // detect item (longest match dulu supaya "brown sugar boba" tidak match "boba" saja)
  const sortedKeys = Object.keys(MENU).sort((a, b) => b.length - a.length);
  for (const menuItem of sortedKeys) {
    if (lower.includes(menuItem)) {
      item = menuItem;
      break;
    }
  }

  if (!item) return null;

  return {
    item,
    qty,
    total: qty * MENU[item],
  };
}