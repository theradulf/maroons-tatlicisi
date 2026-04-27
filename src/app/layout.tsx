import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maroons Tatlıcısı - Dijital Menü",
  description: "İzmir'in en lezzetli tatlıları Maroons Tatlıcısı'nda! Online menümüzü inceleyin ve en sevdiğiniz tatlıları keşfedin.",
  openGraph: {
    title: "Maroons Tatlıcısı - Dijital Menü",
    description: "İzmir'in en lezzetli tatlıları Maroons Tatlıcısı'nda! Online menümüzü inceleyin ve en sevdiğiniz tatlıları keşfedin.",
    url: "https://maroonstatlicisi.com",
    siteName: "Maroons Tatlıcısı",
    images: [
      {
        url: "https://maroonstatlicisi.com/logo.png",
        width: 800,
        height: 600,
        alt: "Maroons Tatlıcısı Logo",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
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
