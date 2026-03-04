import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";
import { StartingScreen } from "@/components/kapogian/StartingScreen";

export const metadata: Metadata = {
  title: "Kapogian | Collectible Reality",
  description: "Generate a 1-of-1 character. Mint on SUI. Receive exclusive merchandise delivered to your door.",
  metadataBase: new URL("https://kapogian.xyz"),
  icons: {
    icon: [
      { url: "/images/KapogianLogo.webp" },
      { url: "/images/KapogianLogo.webp", sizes: "32x32", type: "image/webp" },
      { url: "/images/KapogianLogo.webp", sizes: "192x192", type: "image/webp" },
    ],
    shortcut: "/images/KapogianLogo.webp",
    apple: [
      { url: "/images/KapogianLogo.webp", sizes: "180x180", type: "image/webp" },
    ],
  },
  openGraph: {
    title: "Kapogian | Collectible Reality",
    description: "Generate a 1-of-1 character. Mint on SUI.",
    url: "https://kapogian.xyz",
    siteName: "Kapogian",
    images: [
      {
        url: "/images/KapogianLogo.webp",
        width: 800,
        height: 800,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800&family=Comic+Neue&family=Fredoka:wght@400;500;700&family=Inter:wght@300;400;500;600&family=Luckiest+Guy&family=Nunito:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        <Script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" strategy="afterInteractive" />
      </head>
      <body className="font-body bg-slate-950" suppressHydrationWarning>
        <Providers>
          <StartingScreen />
          <div className="opacity-0 transition-opacity duration-500" id="main-content">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
