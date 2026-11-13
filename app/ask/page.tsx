"use client";
import ChatView from "@/components/ChatView";
import { PageHeader } from "@/components/ui";

export default function AskPage() {
  return (
    <div className="flex h-[calc(100vh-112px)] min-h-[520px] flex-col">
      <PageHeader title="Ask AI" sub="Ask in plain language. The analyst reads your calculated profit, products and campaigns, quotes the figures, and suggests what to do." />
      <div className="mx-auto min-h-0 w-full max-w-[820px] flex-1"><ChatView /></div>
    </div>
  );
}
