import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export const PageFooter = () => {
  const avatar = PlaceHolderImages.find((img) => img.id === "header-avatar");

  return (
    <footer className="bg-primary/90 text-primary-foreground py-10 w-full relative z-10 border-t-2 border-white/10">
      <div className="container mx-auto text-center">
        <div className="flex flex-col items-center gap-6">
          {avatar && (
            <Link href="/" aria-label="Kapogian Home">
              <Image
                src="/images/KapogianLogo.webp"
                alt={avatar.description}
                width={64}
                height={64}
                className="rounded-full border-2 border-primary-foreground/50 shadow-lg"
                data-ai-hint={avatar.imageHint}
              />
            </Link>
          )}

          <div className="space-y-2">
            <p className="text-xl font-bold tracking-tight">
              Collect Digital Magic, Get Real Rewards.
            </p>
            <p className="text-white/70 text-sm font-medium">
              The ultimate phygital collectible experience on Sui.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <Link
              href="/policy"
              className="w-auto px-4 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 shadow-md"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="w-auto px-4 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 shadow-md"
            >
              Terms of Use
            </Link>
            <a
              href="https://x.com/kapogian63"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 shadow-md"
              aria-label="X (Twitter)"
            >
              <iconify-icon icon="ri:twitter-x-fill" class="text-2xl" />
            </a>
            <a
              href="https://discord.gg/rtBhBccW"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95 shadow-md"
              aria-label="Discord"
            >
              <iconify-icon icon="ri:discord-fill" class="text-2xl" />
            </a>
          </div>

          <div className="pt-4 border-t border-white/50 w-full max-w-xs">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Kapogian. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
