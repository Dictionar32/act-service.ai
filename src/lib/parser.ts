const MENU: Record<string, number> = {
  "thai tea": 15000,
  dimsum: 18000,
  "brown sugar boba": 25000,
  "taro milk tea": 23000,
  "matcha latte": 24000,
  "mango yakult": 22000,
};

export interface OrderItem {
  item: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ParsedOrder {
  items: OrderItem[];
  total: number;
}

// Extract qty before or after a menu item name
function extractQty(segment: string): number {
  const match = segment.match(/\b(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

export function parseOrder(message: string): ParsedOrder | null {
  const lower = message.toLowerCase();

  // Sort keys longest first to avoid partial matches
  const sortedKeys = Object.keys(MENU).sort((a, b) => b.length - a.length);

  const foundItems: OrderItem[] = [];
  let remaining = lower;

  for (const menuItem of sortedKeys) {
    const idx = remaining.indexOf(menuItem);
    if (idx === -1) continue;

    // Look for qty in a small window around the item name
    const window = remaining.slice(Math.max(0, idx - 10), idx + menuItem.length + 10);
    const qty = extractQty(window.replace(menuItem, ""));

    foundItems.push({
      item: menuItem,
      qty,
      price: MENU[menuItem],
      subtotal: qty * MENU[menuItem],
    });

    // Remove matched item from remaining to avoid double detection
    remaining = remaining.replace(menuItem, "");
  }

  if (foundItems.length === 0) return null;

  return {
    items: foundItems,
    total: foundItems.reduce((sum, i) => sum + i.subtotal, 0),
  };
}