import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export const PageFooter = () => {
  const avatar = PlaceHolderImages.find((img) => img.id === "header-avatar");

  return (
    <footer className="w-full relative z-10">
      {/* Animated Wave Divider */}
      <div className="w-full overflow-hidden leading-[0]" style={{ marginBottom: "-2px" }}>
        <svg
          className="block w-full h-[120px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#247BE6"
            style={{ animation: "wave-move 6s ease-in-out infinite" }}
            d="M0,160 C320,300 420,0 720,120 C1020,240 1120,40 1440,160 L1440,320 L0,320 Z"
          />
        </svg>
      </div>

      <style>{`
        @keyframes wave-move {
          0%, 100% { d: path("M0,160 C320,300 420,0 720,120 C1020,240 1120,40 1440,160 L1440,320 L0,320 Z"); }
          50%       { d: path("M0,120 C280,20 480,280 720,160 C960,40 1160,260 1440,120 L1440,320 L0,320 Z"); }
        }
      `}</style>

      {/* Footer Body */}
      <div className="text-primary-foreground" style={{ backgroundColor: "#247BE6", marginTop: "-1px" }}>
        <div className="container mx-auto px-6 pb-10">
          <div className="flex flex-col items-center gap-6">

            {/* Logo */}
            {avatar && (
              <Link href="/" aria-label="Kapogian Home">
                <Image
                  src="/images/KapogianLogo.webp"
                  alt={avatar.description}
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-white/30 shadow-lg hover:scale-105 transition-transform"
                  data-ai-hint={avatar.imageHint}
                />
              </Link>
            )}

            {/* Tagline */}
            <div className="text-center space-y-1.5">
              <p className="text-xl font-bold tracking-tight">
                Collect Digital Magic, Get Real Rewards.
              </p>
              <p className="text-white/60 text-sm">
                The ultimate phygital collectible experience on Sui.
              </p>
            </div>

            {/* Links + socials */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/policy"
                className="px-5 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="px-5 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Terms of Use
              </Link>
              <a
                href="https://x.com/kapogian63"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95"
                aria-label="X (Twitter)"
                dangerouslySetInnerHTML={{
                  __html: `<iconify-icon icon="ri:twitter-x-fill" style="font-size:18px"></iconify-icon>`,
                }}
              />
              <a
                href="https://discord.com/invite/kV37u9w48g"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95"
                aria-label="Discord"
                dangerouslySetInnerHTML={{
                  __html: `<iconify-icon icon="ri:discord-fill" style="font-size:18px"></iconify-icon>`,
                }}
              />
            </div>

            {/* Copyright */}
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest pt-2 border-t border-white/10 w-full text-center">
              &copy; {new Date().getFullYear()} Kapogian. All Rights Reserved.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
};