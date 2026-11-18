// Shipping rules from data/policies/shipping.md, shared by the order form and the agent's tools.
export const FAST_CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi"];
export const MAJOR_CITIES = ["Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Gujranwala"];
export const ALL_CITIES = [...FAST_CITIES, ...MAJOR_CITIES, "Other city / town"];

export const FREE_SHIPPING_FROM = 5000; // Rs
export const SHIPPING_FEE = 250; // Rs, below the free-shipping amount
export const COD_LIMIT = 25000; // Rs, max order value for cash on delivery

/** Working days from dispatch to delivery, by city. */
export function deliveryWindow(city: string): [number, number] {
  const c = city.trim().toLowerCase();
  if (FAST_CITIES.some((x) => x.toLowerCase() === c)) return [2, 3];
  if (MAJOR_CITIES.some((x) => x.toLowerCase() === c)) return [3, 5];
  return [5, 7];
}

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}
