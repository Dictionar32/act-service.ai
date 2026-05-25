export interface MenuOption {
  name: string;
  price: number;
}

export interface MenuItem {
  name: string;
  price?: number;
  description?: string;
  ingredients?: string[];
  unit?: string;
  variants?: MenuOption[];
  extras?: MenuOption[];
}

export interface PackageCategory {
  category: string;
  items: MenuItem[];
}

export interface MenuData {
  makanan: MenuItem[];
  minuman: MenuItem[];
  snack: MenuItem[];
  packages: PackageCategory[];
}
