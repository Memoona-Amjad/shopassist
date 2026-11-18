import { ChatWidget } from "@/components/chat/ChatWidget";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

// Shared layout for the customer-facing pages. The chat widget lives here,
// so a conversation stays open while customers move between pages.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}
