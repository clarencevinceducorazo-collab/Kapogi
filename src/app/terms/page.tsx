"use client";

import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import Image from "next/image";

export default function TermsPage() {
  return (
    <>
      <PageHeader />

      {/* --- BACKGROUND SECTIONS --- */}
      <div className="fixed inset-0 -z-10">
        <div className="hidden md:block relative w-full h-full">
          <Image
            src="/images/kapogian_portrait_optimized.png"
            alt="Terms background"
            fill
            className="object-cover opacity-80"
            priority
          />
        </div>
        <div className="block md:hidden relative w-full h-full">
          <Image
            src="/images/kapogian_background.png"
            alt="Terms background mobile"
            fill
            className="object-cover opacity-80"
            priority
          />
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="relative pt-32 pb-24 px-4 min-h-screen antialiased">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* HEADER CARD */}
          <div className="bg-yellow-300 comic-border-thick p-8 rounded-3xl toy-shadow-lg text-center">
            <h1 className="font-headline text-4xl md:text-5xl tracking-wide text-black">
              Terms of Use
            </h1>
            <p className="font-bold text-black/60 uppercase text-sm mt-3">
              Last Updated: March 6, 2026
            </p>
          </div>

          {/* CONTENT SECTIONS */}
          <div className="space-y-8">
            {/* 1. MINTING & PAYMENTS */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-blue-600">
                1. Minting & Payments
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                  <h3 className="font-bold text-lg mb-2 text-blue-800">
                    Base Mint
                  </h3>
                  <p className="text-sm text-slate-700">
                    The cost to generate and mint a 1-of-1 Kapogian NFT is 20
                    SUI plus gas fees.
                  </p>
                </div>
                <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-2 text-purple-800">
                    Merch Bundle Upgrade
                  </h3>
                  <p className="text-sm text-slate-700">
                    An optional "Full Bundle" upgrade is available for an
                    additional 10 SUI.
                  </p>
                </div>
                <div className="bg-red-50 p-5 rounded-xl border-2 border-red-200">
                  <h3 className="font-bold text-lg mb-2 text-red-800">
                    No Refunds
                  </h3>
                  <p className="text-sm text-slate-700">
                    Due to the irreversible nature of blockchain transactions,
                    all SUI payments are final and non-refundable.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. PHYSICAL MERCHANDISE FULFILLMENT */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-orange-500">
                2. Physical Merchandise Fulfillment
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <div className="bg-orange-50 p-5 rounded-xl border-2 border-orange-200">
                  <h3 className="font-bold text-lg mb-2 text-orange-800">
                    Included Item
                  </h3>
                  <p className="text-sm text-slate-700">
                    Every base mint includes one (1) physical item (Shirt, Mug,
                    Mouse Pad, OR Aluminum Plate).
                  </p>
                </div>
                <div className="bg-yellow-50 p-5 rounded-xl border-2 border-yellow-200">
                  <h3 className="font-bold text-lg mb-2 text-yellow-800">
                    SBT Receipt
                  </h3>
                  <p className="text-sm text-slate-700">
                    Upon successful payment, a Soulbound Token (SBT) is issued
                    to your wallet. This token is non-transferable and serves as
                    your proof of purchase and shipping receipt.
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border-2 border-slate-200">
                  <h3 className="font-bold text-lg mb-2 text-slate-800">
                    Shipping Liability
                  </h3>
                  <p className="text-sm text-slate-700">
                    We are not responsible for delivery failures caused by
                    incorrect addresses provided during the minting process or
                    delays caused by third-party shipping carriers.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. INTELLECTUAL PROPERTY */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-green-600">
                3. Intellectual Property
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                  <h3 className="font-bold text-lg mb-2 text-green-800">
                    Character Ownership
                  </h3>
                  <p className="text-sm text-slate-700">
                    Upon minting, you own the 1-of-1 digital asset (NFT).
                  </p>
                </div>
                <div className="bg-teal-50 p-5 rounded-xl border-2 border-teal-200">
                  <h3 className="font-bold text-lg mb-2 text-teal-800">
                    Usage Rights
                  </h3>
                  <p className="text-sm text-slate-700">
                    Ownership grants you the right to use the generated
                    character for personal use. Commercial rights are reserved
                    by the Kapogian Project unless otherwise stated.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. RISK DISCLAIMER */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-red-600">
                4. Risk Disclaimer
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <strong className="block text-lg text-red-800">
                        Blockchain Risks
                      </strong>
                      <span className="text-sm text-slate-600">
                        You acknowledge that the SUI Network is a decentralized
                        platform. We are not liable for any losses due to wallet
                        incompatibility (Suiet/Sui Wallet), smart contract
                        exploits, or network congestion.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <strong className="block text-lg text-slate-800">
                        Tooling
                      </strong>
                      <span className="text-sm text-slate-600">
                        Character generation is powered by Gemini Logic; results
                        are unique and "as-is."
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PageFooter />
    </>
  );
}
