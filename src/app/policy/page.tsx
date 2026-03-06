"use client";

import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import Image from "next/image";

export default function PolicyPage() {
  return (
    <>
      <PageHeader />

      {/* --- BACKGROUND SECTIONS --- */}
      <div className="fixed inset-0 -z-10">
        <div className="hidden md:block relative w-full h-full">
          <Image
            src="/images/kapogian_portrait_optimized.png"
            alt="Policy background"
            fill
            className="object-cover opacity-80"
            priority
          />
        </div>
        <div className="block md:hidden relative w-full h-full">
          <Image
            src="/images/kapogian_background.png"
            alt="Policy background mobile"
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
              Privacy Policy
            </h1>
            <p className="font-bold text-black/60 uppercase text-sm mt-3">
              Last Updated: March 6, 2026
            </p>
          </div>

          {/* CONTENT SECTIONS */}
          <div className="space-y-8">
            {/* 1. DATA COLLECTION & ENCRYPTION */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-blue-600">
                1. Data Collection & Encryption
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <p>
                  We collect your <strong>Name</strong>,{" "}
                  <strong>Shipping Address</strong>, and{" "}
                  <strong>Phone Number</strong> solely for the fulfillment of
                  physical merchandise (T-Shirt, Mug, Mouse Pad, or Aluminum
                  Plate).
                </p>
                <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                  <h3 className="font-bold text-lg mb-2 text-blue-800">
                    Client-Side Encryption
                  </h3>
                  <p className="text-sm text-slate-700">
                    All shipping data is encrypted in your browser using ECIES
                    (Elliptic Curve Integrated Encryption Scheme) before being
                    sent to the SUI Network.
                  </p>
                </div>
                <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-2 text-purple-800">
                    On-Chain Storage
                  </h3>
                  <p className="text-sm text-slate-700">
                    The encrypted data is stored within a Soulbound Token (SBT)
                    Receipt on the SUI blockchain.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. DATA ACCESS & SECURITY */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-red-500">
                2. Data Access & Security
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <div className="bg-red-50 p-5 rounded-xl border-2 border-red-200">
                  <h3 className="font-bold text-lg mb-2 text-red-800">
                    Admin Access Only
                  </h3>
                  <p className="text-sm text-slate-700">
                    Only the holder of the Treasury Private Key
                    (0x4212...9dad94d) can decrypt your shipping information to
                    process your order.
                  </p>
                </div>
                <div className="bg-orange-50 p-5 rounded-xl border-2 border-orange-200">
                  <h3 className="font-bold text-lg mb-2 text-orange-800">
                    Permanence Warning
                  </h3>
                  <p className="text-sm text-slate-700">
                    Because the encrypted string is stored on the blockchain, it
                    is immutable. While currently secure via high-grade
                    encryption, we cannot guarantee the data will remain
                    undecryptable against future technological advancements
                    (e.g., quantum computing).
                  </p>
                </div>
              </div>
            </section>

            {/* 3. THIRD-PARTY SERVICES */}
            <section className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl comic-border-thick toy-shadow-sm">
              <h2 className="font-headline text-3xl mb-6 text-green-600">
                3. Third-Party Services
              </h2>
              <div className="space-y-4 text-slate-800 leading-relaxed font-medium">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <strong className="block text-lg">SUI Network</strong>
                      <span className="text-sm text-slate-600">
                        Your wallet address and transaction history are public
                        on the SUI blockchain.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <strong className="block text-lg">Pinata (IPFS)</strong>
                      <span className="text-sm text-slate-600">
                        Your generated character image and metadata are stored
                        on decentralized storage via Pinata.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🚚</span>
                    <div>
                      <strong className="block text-lg">Fulfillment</strong>
                      <span className="text-sm text-slate-600">
                        Your decrypted data will be shared with shipping
                        carriers (e.g., DHL, FedEx) only for delivery purposes.
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
