import React from "react";
import Link from "next/link";
import { PageFooter } from "@/components/kapogian/page-footer";
import { Rocket } from "lucide-react";

export default function NotFound() {
  return (
    <div 
      className="flex flex-col min-h-screen font-sans" 
      style={{ 
        background: "radial-gradient(circle at 10% 90%, #fcebf8 0%, transparent 40%), radial-gradient(circle at 90% 10%, #e8f4ff 0%, transparent 40%), linear-gradient(180deg, #cde9ff 0%, #e6f3ff 100%)"
      }}
    >
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Soft Cartoon Clouds Background */}
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

        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center mt-10">
          
          {/* Top Image Container Placeholder - for future Chibi character */}
          <div className="w-56 h-56 sm:w-64 sm:h-64 mb-8 rounded-[3rem] bg-white/40 backdrop-blur-sm border-4 border-dashed border-white/80 flex flex-col items-center justify-center overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative transition-transform hover:scale-105">
            <span className="text-blue-500/80 font-black text-sm sm:text-base tracking-[0.1em] uppercase text-center px-6 leading-relaxed" style={{ textShadow: "0px 2px 4px rgba(255,255,255,0.8)" }}>
               Replace with Chibi 
            </span>
            <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest mt-2 bg-white/50 px-3 py-1 rounded-full">
              Image Container
            </span>
          </div>

          {/* 404 Text - Kapogian Bubbly Style */}
          <div className="flex flex-col items-center text-center">
            {/* White 3D Text */}
            <h1 
              className="text-[5.5rem] sm:text-[8rem] font-black tracking-tighter leading-none text-white mb-2"
              style={{
                textShadow: "0px 6px 0px #bfdbfe, 0px 12px 20px rgba(0,0,0,0.1)",
                WebkitTextStroke: "1px rgba(255,255,255,0.5)"
              }}
            >
              404
            </h1>
            
            {/* Blue 3D Text */}
            <h2 
              className="text-[2rem] sm:text-[4.5rem] font-black text-[#0066ff] tracking-tighter uppercase leading-none"
              style={{
                textShadow: "0px 6px 0px #0b3fa3, 0px 12px 20px rgba(0,0,0,0.15)",
                WebkitTextStroke: "1px #0066ff"
              }}
            >
              Page Not Found
            </h2>
            
            <p className="mt-8 text-slate-500 font-black uppercase tracking-wider text-sm sm:text-base max-w-md px-4">
              The cutest Phygital experience on-chain couldn't find this page. Let's get you back to Home!
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-10 mb-8 flex justify-center w-full">
            <Link 
              href="/" 
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#4ade80] to-[#3b82f6] text-white font-black uppercase text-sm sm:text-lg rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_10px_0px_#2563eb] hover:shadow-[0_10px_0px_#1d4ed8] translate-y-0 active:translate-y-[6px] active:shadow-[0_4px_0px_#1d4ed8]"
              style={{ background: "linear-gradient(90deg, #5fe4ff 0%, #3b82f6 100%)" }}
            >
              <Rocket size={24} className="relative z-10 drop-shadow-md text-white" />
              <span className="relative z-10 drop-shadow-md tracking-wider">Return Home</span>
            </Link>
          </div>

        </div>
      </main>
      
      <div className="relative z-20 mt-auto">
        <PageFooter />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}} />
    </div>
  );
}
