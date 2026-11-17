// Clickable demo prompts. They match the seed data in src/lib/seed-data.ts.
export const DEMO_PROMPTS = [
  { label: "Track an order", text: "Where is my order #1042? Phone ends 4821" },
  { label: "Return an order", text: "I want to return order #1037" },
  { label: "Find products", text: "Show me lawn suits under Rs 5,000" },
  { label: "Ask a policy", text: "What is your return policy?" },
  { label: "Ask for a human", text: "This is the third time I'm asking, I want a human" },
];

// Sample data visitors can use in the demo (so nobody needs their own data).
export const SAMPLE_ORDERS = [
  { id: 1042, phoneLast4: "4821", note: "Shipped, on the way to Lahore" },
  { id: 1037, phoneLast4: "5590", note: "Delivered 4 days ago, can be returned" },
  { id: 1029, phoneLast4: "1234", note: "Delivered a month ago, too late to return" },
  { id: 1033, phoneLast4: "9876", note: "Still processing" },
];

/** Opens the chat widget and sends a message (used by buttons on the store page). */
export function askShopAssist(text: string) {
  window.dispatchEvent(new CustomEvent("shopassist:ask", { detail: text }));
}
