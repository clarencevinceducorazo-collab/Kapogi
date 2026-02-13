import React, { useState, useEffect } from "react";
import {
  Zap,
  Activity,
  Terminal,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export const SecuritySection = () => {
  const [encryptionLog, setEncryptionLog] = useState([]);
  const [mintProgress, setMintProgress] = useState(0);
  const [activeMinter, setActiveMinter] = useState("0x1189...2a8f");

  // Updated Leaderboard data with new entries and MMR ranks
  const [liveActivity, setLiveActivity] = useState([
    {
      id: "Vince",
      count: "9,999,999,999",
      label: "MMR",
      rank: 1,
      color: "bg-yellow-400",
    },
    {
      id: "Lakson",
      count: "511",
      label: "MMR",
      rank: 2,
      color: "bg-slate-200",
    },
    { id: "Koa", count: "504", label: "MMR", rank: 3, color: "bg-orange-400" },
    { id: "Zeko", count: "487", label: "MMR", rank: 4, color: "bg-white" },
    { id: "Rakan", count: "482", label: "MMR", rank: 5, color: "bg-white" },
  ]);

  // Secondary Summons List
  const summonsList = [
    { id: "0xe23e...ebe3", count: 10 },
    { id: "0x4a99...2c31", count: 3 },
    { id: "0x615a...48eb", count: 2 },
    { id: "0x1189...2a8f", count: 2 },
  ];

  useEffect(() => {
    const logs = [
      "> ENCRYPTING SHIPPING BLOBS...",
      "> GENERATING SOULBOUND RECEIPT...",
      "> PUSHING TO ON-CHAIN STORAGE...",
      "> VALIDATING CLIENT-SIDE HASH...",
      "> DATA PACKET SEALED",
      "> SECURE SOCKET TUNNELING...",
    ];
    const wallets = [
      "0xe23e...ebe3",
      "0x615a...48eb",
      "0x262d...aa7a",
      "0x1189...2a8f",
    ];
    let i = 0;
    const interval = setInterval(() => {
      setEncryptionLog((prev) => [logs[i % logs.length], ...prev.slice(0, 3)]);
      setMintProgress((prev) => {
        if (prev >= 100) {
          setActiveMinter(wallets[Math.floor(Math.random() * wallets.length)]);
          return 0;
        }
        return prev + 10;
      });
      i++;
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[80vh] bg-[#3B82F6] text-slate-900 font-sans p-4 py-8 flex flex-col items-center justify-center overflow-x-hidden relative pb-20">
      {/* Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-48 h-48 bg-yellow-400 border-8 border-black rounded-full opacity-10 animate-pulse" />
      <div className="absolute bottom-10 right-[-5%] w-72 h-16 bg-white border-8 border-black rounded-full rotate-12 opacity-10" />

      {/* Main Header - Reduced margins and text sizes */}
      <h2
        className="font-headline text-5xl md:text-8xl font-bold text-white uppercase pt-20 pb-20"
        style={{
          textShadow:
            "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
        }}
      >
        Live Activity
      </h2>

      <div className="w-full max-w-4xl relative z-10">
        <div className="relative pt-8">
          {/* Adjusted Chibi positioning for smaller height */}
          <div
            className="absolute 
    -top-10 -left-4 w-32 h-32 
    md:-top-36 md:-left-12 md:w-64 md:h-64 
    z-0 pointer-events-none transition-all duration-300"
          >
            <img
              src="/images/rihee.png"
              alt="Chibi"
              className="w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]"
            />
          </div>
          {/* Right Chibi: Lowered further into the container on mobile */}
          <div
            className="absolute 
    /* Mobile: Pushed 3rem (48px) down from the top edge */
    -top-4 -right-2 w-28 h-28 
    /* Desktop: Remains in its high 'peek' position */
    md:-top-28 md:-right-12 md:w-64 md:h-64 
    z-0 pointer-events-none transition-all duration-300"
          >
            <img
              src="/images/rihe.png"
              alt="Chibi Right"
              className="w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.3)]"
            />
          </div>

          {/* Main Content Card - Reduced padding and shadow size */}
          <div className="bg-white border-[5px] border-black rounded-[2rem] p-6 md:p-8 shadow-[12px_12px_0px_black] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side: Live Summons */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
                  <Zap className="w-8 h-8 text-blue-500 fill-blue-500" />
                  <h2 className="font-black text-2xl uppercase italic tracking-tighter">
                    Recent Activity
                  </h2>
                </div>

                {/* Recent Summons - Slimmed list */}
                <div className="space-y-1.5 mb-4">
                  {summonsList.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-2 border-black rounded-lg p-1.5 bg-slate-50 font-mono text-[10px] font-bold"
                    >
                      <span>{item.id}</span>
                      <span className="bg-black text-white px-2 py-0.5 rounded-md">
                        {item.count} NFTs
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-black rounded-xl p-4 border-[3px] border-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] h-64 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 border-b border-green-900 pb-1">
                    <Terminal size={12} className="text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-500 font-mono">
                      Pipeline
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-green-500/90 space-y-1">
                    {encryptionLog.map((log, idx) => (
                      <div
                        key={idx}
                        className={idx === 0 ? "text-green-400" : "opacity-30"}
                      >
                        {idx === 0 ? "> " : "  "}
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: MMR Leaderboard */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <h2 className="font-black text-2xl uppercase italic tracking-tighter">
                    MMR RANK
                  </h2>
                </div>

                <div className="space-y-2">
                  {liveActivity.map((activity, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center bg-white border-[3px] border-black p-3 rounded-xl shadow-[4px_4px_0px_black] transition-all transform hover:scale-[1.01] ${activity.id === "Vince" ? "ring-2 ring-yellow-400/30" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border-2 border-black shadow-[2px_2px_0px_black] ${activity.color}`}
                        >
                          #{activity.rank}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase italic tracking-tighter leading-none">
                            {activity.id}
                          </p>
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                            Global
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black font-mono block leading-none ${activity.id === "Vince" ? "text-lg text-blue-600" : "text-base"}`}
                        >
                          {activity.count}
                        </span>
                        <p className="text-[8px] font-black uppercase text-purple-600 mt-0.5">
                          {activity.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom stats - More compact */}
                <div className="mt-6 pt-4 flex justify-around border-t-[3px] border-slate-100 border-dashed">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Users
                    </p>
                    <div className="flex items-center gap-1.5 justify-center">
                      <Users size={14} className="text-blue-500" />
                      <p className="font-black text-lg">4.2k</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Server
                    </p>
                    <div className="flex items-center gap-1.5 justify-center">
                      <Activity size={14} className="text-green-500" />
                      <p className="font-black text-lg text-green-500 uppercase">
                        Legend
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
