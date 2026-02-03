"use client";

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import React from 'react';

export const HowItWorksSection = () => {
  const steps = [
    { id: 'how-it-works-connect', label: 'CONNECT WALLET', image: 'https://picsum.photos/seed/connectwallet/240/240' },
    { id: 'how-it-works-generate', label: 'GENERATE', image: 'https://picsum.photos/seed/gen/240/240' },
    { id: 'how-it-works-mint', label: 'MINT', image: 'https://picsum.photos/seed/mint/240/240' },
    { id: 'how-it-works-preview', label: 'PREVIEW', image: 'https://picsum.photos/seed/preview/240/240' },
    { id: 'how-it-works-select', label: 'SELECT MERCH', image: 'https://picsum.photos/seed/merch/240/240' },
    { id: 'how-it-works-scooter', label: 'DELIVERED', image: 'https://picsum.photos/seed/delivered/240/240' },
  ];

  const explosion = PlaceHolderImages.find((img) => img.id === 'how-it-works-explosion');
  const scooter = PlaceHolderImages.find((img) => img.id === 'how-it-works-scooter');

  const splideOptions = {
    type: 'loop',
    drag: 'free',
    perPage: 3,
    gap: '1.5rem',
    autoplay: true,
    interval: 2000,
    speed: 1500,
    pauseOnHover: false,
    arrows: false,
    pagination: false,
    breakpoints: {
      1024: {
        perPage: 2,
      },
      767: {
        perPage: 1,
        gap: '1rem',
      },
    },
  };

  return (
    <section className="relative bg-accent text-accent-foreground pt-20 pb-16 overflow-hidden">
        {explosion && (
            <div className="absolute top-0 left-0 w-1/4 md:w-1/6 z-0">
                <Image
               src="https://picsum.photos/seed/sunPng/300/300"
                alt={explosion.description}
                width={300}
                height={300}
                className="object-contain"
                data-ai-hint={explosion.imageHint}
                />
            </div>
        )}

      <div className="container mx-auto relative z-10 text-center">
        <h2
          className="font-headline text-5xl md:text-8xl font-bold text-white uppercase mb-12"
          style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}
        >
          How It Works?
        </h2>
        <Splide options={splideOptions} aria-label="How it works carousel">
            {steps.map((step, index) => {
              const characterImage = PlaceHolderImages.find((img) => img.id === step.id);
              return (
                <SplideSlide key={index}>
                  <div className="p-1 h-full">
                    <div
                      className="bg-white rounded-3xl border-4 border-black p-4 flex flex-col items-center justify-between shadow-lg aspect-square md:aspect-[4/5] h-full"
                      style={{boxShadow: '8px 8px 0px #000'}}
                    >
                      <div className="relative w-full flex-grow flex items-center justify-center">
                        {step.image && characterImage && (
                          <Image
                            src={step.image}
                            alt={characterImage.description}
                            width={240}
                            height={240}
                            className="object-contain"
                            data-ai-hint={characterImage.imageHint}
                            unoptimized={step.image.endsWith('.gif')}
                          />
                        )}
                      </div>
                      <p className="font-headline text-black text-lg md:text-xl font-bold flex items-center gap-2 mt-2">
                        <span className="bg-accent text-black rounded-full h-8 w-8 flex items-center justify-center border-2 border-black font-sans text-sm">
                          {index + 1}
                        </span>
                        {step.label}
                      </p>
                    </div>
                  </div>
                </SplideSlide>
              );
            })}
        </Splide>
      </div>
      <div className="absolute bottom-0 left-0 right-0 w-full z-10">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-auto">
            <path d="M0 50 C 480 60, 960 40, 1440 50 V 60 H 0 Z" fill="rgba(145, 145, 145, 0.72)" />
        </svg>
        <div className="absolute bottom-0 right-full w-32 md:w-48 z-20 animate-drive">
          {scooter && (
             <Image
                src="https://picsum.photos/seed/drive/150/150"
                alt={scooter.description}
                width={150}
                height={150}
                className="object-contain"
                data-ai-hint={scooter.imageHint}
                unoptimized
            />
          )}
        </div>
        <div className="absolute bottom-0 right-full w-32 md:w-48 z-20 animate-drive" style={{ animationDelay: '7.5s' }}>
          {scooter && (
             <Image
                src="https://picsum.photos/seed/drive/150/150"
                alt={scooter.description}
                width={150}
                height={150}
                className="object-contain"
                data-ai-hint={scooter.imageHint}
                unoptimized
            />
          )}
        </div>
        <div className="absolute bottom-0 right-full w-32 md:w-48 z-20 animate-drive-reverse" style={{ animationDelay: '5s' }}>
          {scooter && (
             <Image
                src="https://picsum.photos/seed/drive/150/150"
                alt={scooter.description}
                width={150}
                height={150}
                className="object-contain scale-x-[-1]"
                data-ai-hint={scooter.imageHint}
                unoptimized
            />
          )}
        </div>
      </div>
    </section>
  );
};
