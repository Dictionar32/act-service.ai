const MENU = {
  "thai tea": 15000,
  dimsum: 18000,
};

export function parseOrder(message: string) {
  const lowerMessage = message.toLowerCase();

  let item = "";
  let qty = 1;

  // detect qty
  const qtyMatch = lowerMessage.match(/\d+/);

  if (qtyMatch) {
    qty = Number(qtyMatch[0]);
  }

  // detect item
  for (const menuItem of Object.keys(MENU)) {
    if (lowerMessage.includes(menuItem)) {
      item = menuItem;
      break;
    }
  }

  if (!item) {
    return null;
  }

  const price =
    MENU[item as keyof typeof MENU];

  return {
    item,
    qty,
    total: qty * price,
  };
}