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
    <section className="relative text-primary-foreground py-20 overflow-hidden">
      <Image
        src="https://picsum.photos/seed/aboutBg/1920/1080"
        alt="About background"
        fill
        className="object-cover"
        data-ai-hint="abstract background"
      />

      <div className="container mx-auto relative z-10 grid md:grid-cols-10 items-center gap-12">
        <div className="md:col-span-3 flex justify-center">
          {mainCharacter && (
            <Image
              src="https://picsum.photos/seed/pogiPng/450/450"
              alt={mainCharacter.description}
              width={450}
              height={450}
              className="object-contain"
              data-ai-hint={mainCharacter.imageHint}
            />
          )}
        </div>
        <div className="md:col-span-7 space-y-6 text-center md:text-left">
          <h2
            className="font-headline text-5xl md:text-7xl font-bold text-white uppercase"
            style={{ textShadow: '3px 3px 0 #000' }}
          >
            A Magical Universe <br /> Powered by Web3
          </h2>
          <p className="font-bold text-accent tracking-widest">ABOUT KAPOGIAN</p>
          <p className="text-lg">
            Kapogian is a magical character universe powered by Web3. Every
            Kapogian is strictly 1-of-1, algorithmically generated, permanently
            stored on IPFS, and minted on the SUI Network. But Kapogian
            isn&apos;t just digital.
          </p>
          <p className="text-lg">
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
      <div className="absolute bottom-0 right-0 z-0 w-[25%] md:w-[15%] max-w-[300px]">
        {bottomCharacters && (
          <Image
            src="https://picsum.photos/seed/richkid/300/150"
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
