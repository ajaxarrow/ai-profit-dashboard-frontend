import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import Shell from "@/components/Shell";
import { ChatProvider } from "@/lib/chat-context";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Profit Desk",
  description: "What your shop actually earns after every cost.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProvider>
          <ChatProvider><Shell>{children}</Shell></ChatProvider>
        </AppProvider>
      </body>
    </html>
  );
}
