import { MENU } from "@/data/menu";

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

  lines.push("📦 Paket");
  for (const pkgCategory of MENU.packages) {
    lines.push(`- ${pkgCategory.category}:`);
    for (const item of pkgCategory.items) {
      const priceText = (item.price ?? 0) === 0 ? "FREE" : `Rp ${(item.price ?? 0).toLocaleString("id-ID")}`;
      lines.push(`  • ${item.name} — ${priceText}`);
    }
  }

  return lines.join("\n").trim();
}

export function hasMenuQuestion(text: string): boolean {
  const normalized = text.toLowerCase();
  const menuPatterns = [
    /\bmenu\b/,
    /daftar\s+menu/,
    /daftar\s+harga/,
    /menu\s+apa\s+saja/,
    /minuman\s+apa/,
    /makanan\s+apa/,
    /harga\s+menu/,
    /paket/,
  ];

  return menuPatterns.some((pattern) => pattern.test(normalized));
}
