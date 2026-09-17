import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOP — AI Customer-Feedback Intelligence Platform",
  description: "Enterprise-grade multi-tenant customer feedback intelligence, AI auto-classification, semantic search, and VoC executive reporting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
