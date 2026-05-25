import { MENU } from "@/data/menu";

export type MenuLookupItem = {
  name: string;
  price: number;
};

function pickBasePrice(item: {
  price?: number;
  variants?: { price: number }[];
}): number | null {
  if (typeof item.price === "number") return item.price;
  if (item.variants && item.variants.length > 0) {
    return Math.min(...item.variants.map((variant) => variant.price));
  }
  return null;
}

export function getMenuLookup(): Record<string, number> {
  const allItems = [...MENU.makanan, ...MENU.minuman, ...MENU.snack];
  const lookup: Record<string, number> = {};

  for (const item of allItems) {
    const price = pickBasePrice(item);
    if (price === null) continue;
    lookup[item.name.toLowerCase()] = price;
  }

  return lookup;
}

export function buildInstagramMenuText(): string {
  const categories: Array<{ label: string; icon: string; items: typeof MENU.makanan }> = [
    { label: "Makanan", icon: "🍜", items: MENU.makanan },
    { label: "Minuman", icon: "🥤", items: MENU.minuman },
    { label: "Snack", icon: "🍟", items: MENU.snack },
  ];

  const lines: string[] = [];

  for (const category of categories) {
    lines.push(`${category.icon} ${category.label}`);

    for (const item of category.items) {
      if (typeof item.price === "number") {
        lines.push(`- ${item.name} — Rp ${item.price.toLocaleString("id-ID")}`);
        continue;
      }

      if (item.variants?.length) {
        const variantText = item.variants
          .map((variant) => `${variant.name} Rp ${variant.price.toLocaleString("id-ID")}`)
          .join(" / ");
        lines.push(`- ${item.name} (${variantText})`);
      }
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

export function hasMenuQuestion(text: string): boolean {
  const normalized = text.toLowerCase();
  return ["menu", "daftar harga", "harga", "minuman apa", "makanan apa"].some((keyword) =>
    normalized.includes(keyword)
  );
}
