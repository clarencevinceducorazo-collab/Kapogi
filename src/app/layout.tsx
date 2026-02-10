import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Kapogian | Collectible Reality",
  description: "Generate a 1-of-1 character. Mint on SUI. Receive exclusive merchandise delivered to your door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Neue&family=Fredoka:wght@400;500;700&family=Luckiest+Guy&family=Nunito:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        <Script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" strategy="lazyOnload" />
      </head>
      <body className="font-body">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
