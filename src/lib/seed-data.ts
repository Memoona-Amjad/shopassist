// Demo data for the fictional "Lawn & Loom" store.
// Used by the seed script (scripts/seed.ts) and by the daily demo reset.
// Dates are stored as "days ago" so the demo data always looks fresh
// (e.g. order #1037 is always inside the 14-day return window).

export type Product = {
  id: string;
  name: string;
  category: "lawn" | "kurta" | "formal" | "dupatta" | "trousers" | "kids";
  fabric: string;
  price: number;
  sizes: string[];
  colors: string[];
  description: string;
  in_stock: boolean;
  stock: number; // units left (in_stock = stock > 0)
  image_url?: string | null; // photo uploaded by the owner; null = CSS swatch
};

const STITCHED = ["XS", "S", "M", "L", "XL"];
const UNSTITCHED = ["Unstitched"];

const CATALOGUE: Omit<Product, "stock">[] = [
  // ---- Lawn (unstitched 3-piece suits) ----
  { id: "LL-101", name: "Gulnar Printed Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 4290, sizes: UNSTITCHED, colors: ["coral", "white"], description: "Coral floral print shirt with a chiffon dupatta and dyed trouser fabric.", in_stock: true },
  { id: "LL-102", name: "Neelam Embroidered Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 6490, sizes: UNSTITCHED, colors: ["blue"], description: "Indigo lawn with an embroidered neckline and a printed lawn dupatta.", in_stock: true },
  { id: "LL-103", name: "Chambeli Everyday Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 3490, sizes: UNSTITCHED, colors: ["mint", "white"], description: "Light mint print, ideal for everyday summer wear.", in_stock: true },
  { id: "LL-104", name: "Mehr Digital Print Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 4890, sizes: UNSTITCHED, colors: ["mustard", "maroon"], description: "Bold digital print in mustard and maroon with a voile dupatta.", in_stock: true },
  { id: "LL-105", name: "Saba Schiffli Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 7990, sizes: UNSTITCHED, colors: ["white"], description: "White schiffli-embroidered front with a sheer organza dupatta.", in_stock: true },
  { id: "LL-106", name: "Rooh Block Print Lawn Suit (2-piece)", category: "lawn", fabric: "Cotton lawn", price: 2990, sizes: UNSTITCHED, colors: ["pink", "indigo"], description: "Hand-block style print, shirt and trouser only (no dupatta).", in_stock: true },
  { id: "LL-107", name: "Zara Paisley Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 4550, sizes: UNSTITCHED, colors: ["teal"], description: "Teal paisley print with a lawn dupatta.", in_stock: false },
  { id: "LL-108", name: "Bahaar Festive Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 8990, sizes: UNSTITCHED, colors: ["red", "gold"], description: "Festive red lawn with gold-tone embroidery and a jacquard dupatta.", in_stock: true },
  { id: "LL-109", name: "Sitara Pastel Lawn Suit (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 3890, sizes: UNSTITCHED, colors: ["lilac"], description: "Soft lilac pastel print with a matching dupatta.", in_stock: true },
  { id: "LL-110", name: "Noor Lawn Suit with Silk Dupatta (3-piece)", category: "lawn", fabric: "Cotton lawn", price: 9490, sizes: UNSTITCHED, colors: ["emerald"], description: "Emerald lawn with a printed silk dupatta.", in_stock: true },

  // ---- Stitched kurtas ----
  { id: "LL-201", name: "Ayesha A-line Lawn Kurta", category: "kurta", fabric: "Cotton lawn", price: 2490, sizes: STITCHED, colors: ["peach"], description: "Stitched A-line kurta in peach print, regular fit.", in_stock: true },
  { id: "LL-202", name: "Hira Straight Cambric Kurta", category: "kurta", fabric: "Cambric", price: 2990, sizes: STITCHED, colors: ["black", "white"], description: "Black cambric kurta with white thread embroidery.", in_stock: true },
  { id: "LL-203", name: "Mahnoor Angrakha Kurta", category: "kurta", fabric: "Cotton lawn", price: 3450, sizes: ["S", "M", "L"], colors: ["sky blue"], description: "Angrakha-style wrap kurta, regular fit.", in_stock: true },
  { id: "LL-204", name: "Zoya Khaddar Kurta", category: "kurta", fabric: "Khaddar", price: 3990, sizes: STITCHED, colors: ["rust"], description: "Warm khaddar kurta for winter, rust colour.", in_stock: true },
  { id: "LL-205", name: "Iman Embroidered Kurta", category: "kurta", fabric: "Cotton lawn", price: 4290, sizes: ["M", "L", "XL"], colors: ["sage"], description: "Sage green kurta with a fully embroidered yoke.", in_stock: true },
  { id: "LL-206", name: "Fiza Tunic Top", category: "kurta", fabric: "Viscose", price: 1990, sizes: STITCHED, colors: ["navy"], description: "Short viscose tunic, pairs with jeans or trousers.", in_stock: true },
  { id: "LL-207", name: "Laila Printed Kaftan", category: "kurta", fabric: "Viscose", price: 3290, sizes: ["S", "M", "L"], colors: ["multicolour"], description: "Loose kaftan in a bright geometric print.", in_stock: false },

  // ---- Formal ----
  { id: "LL-301", name: "Rania Chiffon Formal (3-piece)", category: "formal", fabric: "Chiffon", price: 14990, sizes: ["S", "M", "L"], colors: ["blush"], description: "Stitched chiffon formal with sequin work, slim fit.", in_stock: true },
  { id: "LL-302", name: "Shehnaz Organza Formal (3-piece)", category: "formal", fabric: "Organza", price: 18990, sizes: ["S", "M", "L"], colors: ["ivory", "gold"], description: "Ivory organza with gold embroidery, wedding-guest ready.", in_stock: true },
  { id: "LL-303", name: "Mahjabeen Velvet Shawl Set", category: "formal", fabric: "Velvet", price: 21990, sizes: ["M", "L"], colors: ["maroon"], description: "Maroon velvet shirt with an embroidered shawl.", in_stock: true },
  { id: "LL-304", name: "Areeba Silk Kurta Set", category: "formal", fabric: "Raw silk", price: 11490, sizes: STITCHED, colors: ["teal"], description: "Raw silk kurta with straight trousers, slim fit.", in_stock: true },

  // ---- Dupattas ----
  { id: "LL-401", name: "Chikankari Cotton Dupatta", category: "dupatta", fabric: "Cotton", price: 1490, sizes: ["One size"], colors: ["white"], description: "White dupatta with chikankari-style embroidery.", in_stock: true },
  { id: "LL-402", name: "Banarsi Jacquard Dupatta", category: "dupatta", fabric: "Jacquard", price: 2490, sizes: ["One size"], colors: ["gold", "magenta"], description: "Rich jacquard dupatta for festive outfits.", in_stock: true },
  { id: "LL-403", name: "Printed Chiffon Dupatta", category: "dupatta", fabric: "Chiffon", price: 1290, sizes: ["One size"], colors: ["multicolour"], description: "Light printed chiffon dupatta.", in_stock: true },

  // ---- Trousers ----
  { id: "LL-501", name: "Cotton Cigarette Pants", category: "trousers", fabric: "Cotton", price: 1690, sizes: ["S", "M", "L", "XL"], colors: ["white", "black", "beige"], description: "Slim cigarette pants with side pockets.", in_stock: true },
  { id: "LL-502", name: "Lawn Shalwar", category: "trousers", fabric: "Cotton lawn", price: 1290, sizes: ["S", "M", "L", "XL"], colors: ["white", "black"], description: "Classic loose lawn shalwar.", in_stock: true },
  { id: "LL-503", name: "Embroidered Culottes", category: "trousers", fabric: "Cambric", price: 1990, sizes: ["S", "M", "L"], colors: ["white"], description: "Wide culottes with embroidered hem.", in_stock: true },

  // ---- Kids ----
  { id: "LL-601", name: "Girls Printed Lawn Frock", category: "kids", fabric: "Cotton lawn", price: 1890, sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"], colors: ["yellow"], description: "Cheerful yellow frock for girls.", in_stock: true },
  { id: "LL-602", name: "Girls Lawn Kurta Shalwar Set", category: "kids", fabric: "Cotton lawn", price: 2290, sizes: ["4-5Y", "6-7Y", "8-9Y"], colors: ["pink"], description: "Two-piece lawn set for girls.", in_stock: true },
  { id: "LL-603", name: "Boys Cotton Kurta Pajama", category: "kids", fabric: "Cotton", price: 2490, sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"], colors: ["white", "sky blue"], description: "Festive cotton kurta pajama for boys.", in_stock: true },
];

// A few products are deliberately low on stock so "Only N left" shows in the demo.
const LOW_STOCK: Record<string, number> = { "LL-105": 3, "LL-110": 2, "LL-301": 4, "LL-402": 1 };

export const PRODUCTS: Product[] = CATALOGUE.map((p, i) => ({
  ...p,
  stock: !p.in_stock ? 0 : (LOW_STOCK[p.id] ?? 12 + ((i * 7) % 30)),
}));

// ---------------- Orders ----------------

export type OrderStatus = "processing" | "shipped" | "delivered" | "returned" | "return_requested";

export type OrderSeed = {
  id: number;
  customer_name: string;
  phone: string;
  city: string;
  items: { productId: string; name: string; size: string; qty: number; price: number }[];
  payment: "COD" | "Card";
  status: OrderStatus;
  courier: string | null;
  tracking_no: string | null;
  orderedDaysAgo: number;
  shippedDaysAgo: number | null;
  deliveredDaysAgo: number | null;
};

// Key demo orders: these must match the clickable demo prompts.
//  #1042 - shipped, phone ends 4821   ("Where is my order #1042? Phone ends 4821")
//  #1037 - delivered 4 days ago, phone ends 5590 -> return allowed
//  #1029 - delivered 30 days ago -> return NOT allowed (outside 14 days)
//  #1033 - still processing -> return NOT allowed (not delivered)
const KEY_ORDERS: Record<number, Partial<OrderSeed>> = {
  1042: { customer_name: "Ayesha Khan", phone: "03214564821", city: "Lahore", status: "shipped", items: [item("LL-101", "Unstitched"), item("LL-201", "M")], orderedDaysAgo: 3, payment: "COD" },
  1037: { customer_name: "Sana Malik", phone: "03001235590", city: "Karachi", status: "delivered", items: [item("LL-104", "Unstitched")], orderedDaysAgo: 8, payment: "COD" },
  1029: { customer_name: "Hamza Ali", phone: "03337771234", city: "Islamabad", status: "delivered", items: [item("LL-202", "L")], orderedDaysAgo: 36, payment: "Card" },
  1033: { customer_name: "Fatima Noor", phone: "03451119876", city: "Multan", status: "processing", items: [item("LL-302", "M")], orderedDaysAgo: 1, payment: "Card" },
};

const FIRST = ["Ayesha", "Sana", "Hira", "Zainab", "Maryam", "Ali", "Usman", "Bilal", "Fatima", "Mahnoor", "Iqra", "Hassan", "Rabia", "Saad", "Amna", "Nida"];
const LAST = ["Khan", "Malik", "Ahmed", "Butt", "Qureshi", "Sheikh", "Raza", "Chaudhry", "Siddiqui", "Mirza"];
const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad", "Sialkot", "Quetta"];
const STATUS_CYCLE: OrderStatus[] = ["delivered", "shipped", "processing", "delivered", "returned", "delivered", "shipped"];

function item(productId: string, size: string, qty = 1) {
  const p = PRODUCTS.find((x) => x.id === productId)!;
  return { productId, name: p.name, size, qty, price: p.price };
}

// Builds 40 orders (#1003 - #1042) with a simple deterministic pattern,
// so every reseed produces exactly the same data.
export function buildOrders(): OrderSeed[] {
  const orders: OrderSeed[] = [];
  for (let id = 1003; id <= 1042; id++) {
    const n = id - 1003;
    const status = STATUS_CYCLE[n % STATUS_CYCLE.length];
    const product = PRODUCTS[(n * 7) % PRODUCTS.length];
    const size = product.sizes[n % product.sizes.length];
    const orderedDaysAgo = 2 + ((n * 5) % 45);
    const base: OrderSeed = {
      id,
      customer_name: `${FIRST[n % FIRST.length]} ${LAST[(n * 3) % LAST.length]}`,
      phone: `03${(10 + (n % 40)).toString()}${(1000000 + n * 7919).toString().slice(-7)}`,
      city: CITIES[n % CITIES.length],
      items: [item(product.id, size, 1 + (n % 2))],
      payment: n % 3 === 0 ? "Card" : "COD",
      status,
      courier: null,
      tracking_no: null,
      orderedDaysAgo,
      shippedDaysAgo: null,
      deliveredDaysAgo: null,
    };
    orders.push(applyTimeline({ ...base, ...KEY_ORDERS[id] }));
  }
  return orders;
}

// Fills in courier and shipped/delivered dates that make sense for the status.
function applyTimeline(o: OrderSeed): OrderSeed {
  const couriers = ["TCS", "Leopards", "M&P"];
  const courier = couriers[o.id % couriers.length];
  if (o.status === "processing") {
    return { ...o, courier: null, tracking_no: null, shippedDaysAgo: null, deliveredDaysAgo: null };
  }
  const shippedDaysAgo = Math.max(o.orderedDaysAgo - 1, 0);
  const tracking_no = `${courier.slice(0, 3).toUpperCase().replace("&", "")}${o.id}${(o.id * 37) % 1000}`;
  if (o.status === "shipped") {
    return { ...o, courier, tracking_no, shippedDaysAgo, deliveredDaysAgo: null };
  }
  // delivered / returned: delivered 3 days after shipping (never in the future)
  const deliveredDaysAgo = Math.max(shippedDaysAgo - 3, 0);
  return { ...o, courier, tracking_no, shippedDaysAgo, deliveredDaysAgo };
}

// Turns "days ago" into real timestamps for the database.
export function orderToRow(o: OrderSeed, now = new Date()) {
  const daysAgo = (d: number | null) =>
    d === null ? null : new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const total = o.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return {
    id: o.id,
    customer_name: o.customer_name,
    phone: o.phone,
    city: o.city,
    items: o.items,
    total: total >= 5000 ? total : total + 250, // Rs 250 shipping below Rs 5,000
    payment: o.payment,
    status: o.status,
    courier: o.courier,
    tracking_no: o.tracking_no,
    ordered_at: daysAgo(o.orderedDaysAgo)!,
    shipped_at: daysAgo(o.shippedDaysAgo),
    delivered_at: daysAgo(o.deliveredDaysAgo),
  };
}
