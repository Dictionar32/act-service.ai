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

export interface MenuData {
  makanan: MenuItem[];
  minuman: MenuItem[];
  snack: MenuItem[];
}
