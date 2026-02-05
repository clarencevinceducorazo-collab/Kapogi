import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export const HeroSection = ({
  onWhitepaperOpen,
}: {
  onWhitepaperOpen: () => void;
}) => {
  return (
    <section className="relative w-full min-h-dvh flex items-start lg:items-center justify-center text-white overflow-hidden py-28 lg:py-20">
      {/* Desktop Background */}
      <div className="hidden md:block absolute inset-0">
        <Image
          src="/images/herobg.png"
          alt="Kapogian hero background"
          fill
          className="object-cover"
          priority
          data-ai-hint="fantasy background"
        />
      </div>

      {/* Mobile Background */}
      <div className="block md:hidden absolute inset-0">
        <Image
          src="/images/mobilebg.png"
          alt="Kapogian hero background mobile"
          fill
          className="object-cover"
          priority
          data-ai-hint="fantasy background mobile"
        />
      </div>

      {/* Foreground Foliage - Decorative */}
      <div className="absolute bottom-0 left-0 w-1/3 z-10"></div>
      <div className="absolute bottom-0 right-0 w-1/4 z-10 transform scale-x-[-1]"></div>

      <div className="relative z-20 container mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div className="text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFC83D] text-black px-4 py-1 rounded-full text-sm font-bold ml-0 lg:ml-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            MINT LIVE
          </div>
          <h1
            className="font-headline text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white"
            style={{
              textShadow:
                '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 5px 5px 0 #000',
            }}
          >
            KAPOGIAN
          </h1>
          <p className="text-xl md:text-2xl font-bold">
            Collect Digital Magic, Get Real Rewards
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link href="/generate">
              <Button
                size="lg"
                className="rounded-full bg-[#FFC83D] text-black hover:bg-[#EAC35F] font-bold text-lg px-8 py-7"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Kapogian
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full bg-white/80 text-black hover:bg-white font-bold text-lg px-8 py-7"
              onClick={onWhitepaperOpen}
            >
              Whitepaper
            </Button>
          </div>
        </div>

        <div className="relative flex justify-center items-end h-[500px] lg:h-[650px]">
  <Image
    src="/images/kpgs.png"
    alt="Kapogian Character"
    width={800}
    height={800}
    className="
      object-contain
      w-[420px]
      lg:w-[600px]
      absolute
      top-0
    "
  />
</div>

      </div>
    </section>
  );
};
