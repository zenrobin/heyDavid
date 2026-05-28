import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "heyDavid — Meal Tracker POC",
  description: "Conversational meal tracker (POC)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
