import type { MenuData } from "@/types/menu";

export const MENU: MenuData = {
  makanan: [
    {
      name: "Mie Goreng",

      variants: [
        {
          name: "Normal",
          price: 10000,
        },

        {
          name: "Double",
          price: 16000,
        },
      ],

      extras: [
        {
          name: "Tambah Telur",
          price: 4000,
        },

        {
          name: "Tambah Sayur",
          price: 2000,
        },
      ],
    },

    {
      name: "Mie Rebus",

      variants: [
        {
          name: "Normal",
          price: 10000,
        },

        {
          name: "Double",
          price: 16000,
        },
      ],

      extras: [
        {
          name: "Tambah Telur",
          price: 4000,
        },

        {
          name: "Tambah Sayur",
          price: 2000,
        },
      ],
    },

    {
      name: "Nasi Telur",

      price: 10000,

      description:
        "Nasi telur ditambah kecap dan saus",
    },

    {
      name: "Nasi Goreng",

      variants: [
        {
          name: "Normal",
          price: 14000,
        },

        {
          name: "Sosis",
          price: 16000,
        },
      ],

      extras: [
        {
          name: "Extra Telur",
          price: 4000,
        },
      ],

      description:
        "Nasi digoreng ditambah telur orak-arik",
    },

    {
      name: "Nasi Gila",

      price: 20000,

      ingredients: [
        "Bakso Ikan",
        "Bakso Udang",
        "Sosis",
        "Sawi",
        "Selada",
        "Cabe Rawit",
      ],
    },

    {
      name: "Chicken Katsu",

      variants: [
        {
          name: "Small",
          price: 15000,
        },

        {
          name: "Large",
          price: 20000,
        },
      ],

      ingredients: [
        "Nasi",
        "Kol",
        "Wortel",
        "Selada",
        "Saus",
      ],
    },

    {
      name: "Seblak Ori",

      price: 12000,

      ingredients: [
        "Kerupuk",
        "Telur",
        "Mie",
        "Bakso Ikan",
        "Cuanki",
        "Sosis",
        "Sayur",
      ],
    },

    {
      name: "Seblak Campur",

      price: 18000,

      ingredients: [
        "Kerupuk",
        "Telur",
        "Mie",
        "Bakso Ikan",
        "Cuanki",
        "Sosis",
        "Sayur",
      ],
    },

    {
      name: "Seblak Sosis",

      price: 15000,

      ingredients: [
        "Kerupuk",
        "Telur",
        "Mie",
        "Sayur",
        "Sosis",
      ],
    },

    {
      name: "Seblak Bakso Ikan",

      price: 15000,

      ingredients: [
        "Kerupuk",
        "Telur",
        "Mie",
        "Sayur",
        "Bakso Ikan",
      ],
    },
  ],


  minuman: [
    {
      name: "Mineral Water",
      price: 5000,
    },

    {
      name: "Coklat",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Matcha",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Red Velvet",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Es Teh",

      variants: [
        {
          name: "Original",
          price: 5000,
        },

        {
          name: "Leci",
          price: 8000,
        },
      ],
    },

    {
      name: "Taro",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Cappucino",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Coffee Caramel",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Mochachino",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },

    {
      name: "Vanilla Latte",

      variants: [
        {
          name: "Small",
          price: 10000,
        },

        {
          name: "Large",
          price: 15000,
        },
      ],
    },
  ],

  snack: [
  {
    name: "Risol",

    price: 5000,

    unit: "pcs",
  },

  {
    name: "Sempol",

    price: 2000,

    unit: "pcs",
  },

  {
    name: "Cireng",

    price: 3000,

    unit: "pcs",
  },

  {
    name: "Tempura",

    price: 2000,

    unit: "pcs",
  },

  {
    name: "Piscok",

    price: 7000,

    unit: "pcs",
  },

  {
    name: "Siomay Ikan",

    price: 3000,

    unit: "pcs",
  },

  {
    name: "Otak-Otak",

    price: 3000,

    unit: "pcs",
  },

  {
    name: "Mix Platter",

    price: 17000,
  },

  {
    name: "French Fries",

    price: 15000,
  },

  {
    name: "Basreng",

    price: 8000,
  },

  {
    name: "Banana Pop",

    price: 13000,
  },

  {
    name: "Sosis",

    price: 8000,
  },
],

  packages: [
    {
      category: "Paket Makan",
      items: [
        { name: "Paket Couple", price: 0, description: "Ajak 1 temen kamu beli makanan atau minuman min 15k, kalian gratis biaya sewa! ☕️🍽️" },
        { name: "Paket Group", price: 0, description: "Ajak min 2 temen kamu beli makanan atau minuman min 13k, kalian gratis biaya sewa 👥" },
        { name: "Paket Single", price: 0, description: "Beli makanan atau minuman minimal 17k, gratis biaya sewa! ☕️" }
      ]
    },
    {
      category: "Paket Sewa",
      items: [
        { name: "Paket Short Time", price: 8000, description: "Pas banget buat kamu yang butuh spot kerja singkat 2 JAM tapi fokus 🧑‍💻" },
        { name: "Paket Pelajar", price: 8000, description: "Pas banget buat kamu yang butuh spot kerja seharian tapi low budget 🧑‍🎓" },
        { name: "Paket Harian", price: 14000, description: "Kerja sepuasnya seharian penuh, harga tetap ramah di kantong ✨💸" }
      ]
    }
  ],

};