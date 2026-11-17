import { ChatWidget } from "@/components/chat/ChatWidget";

// The chat on its own page. public/widget.js shows this page in an iframe,
// so any website can add ShopAssist with one <script> tag.
export default function EmbedPage() {
  return (
    <div className="h-[100dvh]">
      <ChatWidget embedded />
    </div>
  );
}
