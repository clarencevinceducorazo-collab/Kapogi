import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageFooter } from "@/components/kapogian/page-footer";
import { Rocket } from "lucide-react";

// This tells Next.js THIS file is the complete 404 handler — no default UI injected
export default function NotFound() {
  return (
    <div
      className="flex flex-col min-h-screen font-sans"
      style={{
        background:
          "radial-gradient(circle at 10% 90%, #fcebf8 0%, transparent 40%), radial-gradient(circle at 90% 10%, #e8f4ff 0%, transparent 40%), linear-gradient(180deg, #cde9ff 0%, #e6f3ff 100%)",
      }}
    >
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

        {/* Clouds */}
        <div className="absolute top-[15%] left-[10%] sm:left-[20%] opacity-60 scale-75 sm:scale-100 animate-[float_6s_ease-in-out_infinite]">
          <div className="w-12 h-12 bg-white rounded-full absolute bottom-0 left-0" />
          <div className="w-20 h-20 bg-white rounded-full absolute bottom-2 left-8" />
          <div className="w-14 h-14 bg-white rounded-full absolute bottom-0 left-20" />
          <div className="w-32 h-12 bg-white rounded-full absolute bottom-0 left-2" />
        </div>
        <div className="absolute top-[25%] right-[5%] sm:right-[15%] opacity-50 scale-50 sm:scale-75 animate-[float_8s_ease-in-out_infinite_reverse]">
          <div className="w-12 h-12 bg-white rounded-full absolute bottom-0 left-0" />
          <div className="w-20 h-20 bg-white rounded-full absolute bottom-2 left-8" />
          <div className="w-14 h-14 bg-white rounded-full absolute bottom-0 left-20" />
          <div className="w-32 h-12 bg-white rounded-full absolute bottom-0 left-2" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-6">

          {/* PAGE NOT FOUND */}
          <h2
            className="text-[2rem] sm:text-[4rem] font-black text-[#0066ff] tracking-tighter uppercase leading-none"
            style={{
              textShadow: "0px 6px 0px #0b3fa3, 0px 12px 20px rgba(0,0,0,0.15)",
              WebkitTextStroke: "1px #0066ff",
            }}
          >
            Page Not Found
          </h2>

          {/* Character */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 transition-transform duration-500 hover:scale-105">
            <Image
              src="/images/notfound/notfound.gif"
              alt="Not Found Character"
              fill
              className="object-contain drop-shadow-[0_20px_30px_rgba(37,99,235,0.2)]"
              priority
            />
          </div>

          {/* Description */}
          <p className="text-slate-500 font-black uppercase tracking-wider text-sm sm:text-base max-w-md px-4">
            The cutest Phygital experience on-chain couldn't find this page.
            Let's get you back to Home!
          </p>

          {/* Button */}
          <Link
            href="/"
            className="flex items-center justify-center gap-3 px-8 py-4 text-white font-black uppercase text-sm sm:text-lg rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_10px_0px_#2563eb] hover:shadow-[0_10px_0px_#1d4ed8] translate-y-0 active:translate-y-[6px] active:shadow-[0_4px_0px_#1d4ed8]"
            style={{ background: "linear-gradient(90deg, #5fe4ff 0%, #3b82f6 100%)" }}
          >
            <Rocket size={24} className="drop-shadow-md text-white" />
            <span className="drop-shadow-md tracking-wider">Return Home</span>
          </Link>

        </div>
      </main>

      <div className="relative z-20 mt-auto">
        <PageFooter />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `,
      }} />
    </div>
  );
}