import { ChatWidget } from "@/components/chat/ChatWidget";

// Temporary page for Milestone 2. The full store page comes in Milestone 3.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <h1 className="font-serif text-4xl text-[var(--brand)]">Lawn &amp; Loom</h1>
      <ChatWidget />
    </main>
  );
}
