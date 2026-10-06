import type { Metadata } from "next";
import { Inter, Playfair_Display, Tajawal } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CartProvider } from "@/components/CartProvider";
import { Cart } from "@/components/Cart";

const inter = Inter({
  variable: "--font-sans-latin",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif-latin",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nahel — Artisanal Honey & Beekeeping | نحّال — عسل ومعدات نحل",
  description:
    "Authentic Lebanese and Egyptian honey and professional beekeeping supplies. عسل لبناني ومصري أصيل ومعدات نحل احترافية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${playfair.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <CartProvider>
            {children}
            <Cart />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
