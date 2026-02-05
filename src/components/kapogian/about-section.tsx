import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';

export const AboutSection = () => {
  const mainCharacter = PlaceHolderImages.find(
    (img) => img.id === 'about-main-character'
  );
  const bottomCharacters = PlaceHolderImages.find(
    (img) => img.id === 'about-bottom-characters'
  );

  return (
    <section className="relative text-primary-foreground py-16 md:py-20 overflow-hidden">
      <Image
        src="/images/aboutbg.png"
        alt="About background"
        fill
        className="object-cover"
        data-ai-hint="abstract background"
      />

      <div className="container mx-auto relative z-10 grid md:grid-cols-10 items-center gap-8 md:gap-12">
        <div className="md:col-span-3 flex justify-center">
          {mainCharacter && (
            <Image
              src="/images/pogi.png"
              alt={mainCharacter.description}
              width={450}
              height={450}
              className="object-contain w-full max-w-[280px] md:max-w-full"
              data-ai-hint={mainCharacter.imageHint}
            />
          )}
        </div>
        <div className="md:col-span-7 space-y-6 text-center md:text-left">
          <h2
            className="font-headline text-5xl sm:text-6xl md:text-7xl font-bold text-white uppercase"
            style={{ textShadow: '3px 3px 0 #000' }}
          >
            A Magical Universe <br /> Powered by Web3
          </h2>
          <p className="font-bold text-accent tracking-widest uppercase">
            About Kapogian
          </p>
          <p className="text-lg max-w-2xl mx-auto md:mx-0">
            Kapogian is a magical character universe powered by Web3. Every
            Kapogian is strictly 1-of-1, algorithmically generated, permanently
            stored on IPFS, and minted on the SUI Network. But Kapogian
            isn&apos;t just digital.
          </p>
          <p className="text-lg max-w-2xl mx-auto md:mx-0">
            Every mint unlocks real world merchandise, turning your character
            into something you can actually hold.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 font-bold text-lg hover:text-accent transition-colors"
          >
            EXPLORE COLLECTION <ArrowRight />
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 z-0 w-1/3 md:w-[15%] max-w-[250px]">
        {bottomCharacters && (
          <Image
            src="/images/richkid.png"
            alt={bottomCharacters.description}
            width={300}
            height={150}
            className="object-contain w-full h-auto"
            data-ai-hint={bottomCharacters.imageHint}
          />
        )}
      </div>
    </section>
  );
};
