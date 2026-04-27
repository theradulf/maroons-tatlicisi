import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maroon's Tatlıcısı - Menü",
  description: "Maroon's Tatlıcısı online menüsü",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        {children}
      </body>
    </html>
  );
}
