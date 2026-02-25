'use client';
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { IdentityBinder } from "@/components/kapogian/identity-binder";
import Image from "next/image";

export default function IdentityPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-black selection:text-white relative">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/kapogian_background.png"
          alt="bg"
          fill
          className="object-cover"
          priority
        />
      </div>
      <PageHeader />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
          <header className="mb-12 text-center">
            <h1
              className="font-headline text-6xl md:text-8xl font-bold text-black uppercase"
              style={{
                textShadow:
                  "-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 6px 6px 0px #000",
              }}
            >
              Identity Binding
            </h1>
            <p className="text-xl font-bold text-gray-600 mt-2">
              Securely link your X (Twitter) account to your Sui Wallet.
            </p>
          </header>
          <IdentityBinder />
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
