"use client";

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import React from "react";

export const HowItWorksSection = () => {
  const steps = [
    {
      id: "how-it-works-connect",
      label: "CONNECT WALLET",
      image: "/images/connectwallet.png",
    },
    {
      id: "how-it-works-generate",
      label: "GENERATE",
      image: "/images/gen.png",
    },
    { id: "how-it-works-mint", label: "MINT", image: "/images/mint.png" },
    {
      id: "how-it-works-preview",
      label: "PREVIEW",
      image: "/images/preview.png",
    },
    {
      id: "how-it-works-select",
      label: "SELECT MERCH",
      image: "/images/merch.png",
    },
    {
      id: "how-it-works-scooter",
      label: "DELIVERED",
      image: "/images/DELIVERED.png",
    },
  ];

  const explosion = PlaceHolderImages.find(
    (img) => img.id === "how-it-works-explosion",
  );
  const scooter = PlaceHolderImages.find(
    (img) => img.id === "how-it-works-scooter",
  );

  const splideOptions = {
    type: "loop",
    drag: "free",
    perPage: 4,
    gap: "1.5rem",
    autoplay: true,
    interval: 2500,
    speed: 1500,
    pauseOnHover: true,
    arrows: false,
    pagination: false,
    breakpoints: {
      1024: {
        perPage: 3,
      },
      767: {
        perPage: 2.5,
      },
      640: {
        perPage: 2,
        gap: "1rem",
      },
    },
  };

  return (
    <section className="relative bg-[#FFC83D] text-black pt-20 pb-16 overflow-hidden">
      {explosion && (
        <div className="absolute top-0 left-0 w-1/4 md:w-1/6 z-0">
          <Image
            src="/images/sunny.gif"
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
          style={{
            textShadow:
              "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
          }}
        >
          How It Works?
        </h2>
        <Splide options={splideOptions} aria-label="How it works carousel">
          {steps.map((step, index) => {
            const characterImage = PlaceHolderImages.find(
              (img) => img.id === step.id,
            );
            return (
              <SplideSlide key={index}>
                <div className="p-1">
                  <div
                    className="bg-white rounded-3xl border-4 border-black p-2 md:p-4 flex flex-col items-center justify-center aspect-[4/5] shadow-lg"
                    style={{ boxShadow: "8px 8px 0px #000" }}
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
                          unoptimized={step.image.endsWith(".gif")}
                        />
                      )}
                    </div>
                    <p className="font-headline text-black text-base md:text-xl font-bold flex items-center gap-2 mt-2 md:mt-4 flex-shrink-0 text-center">
                      <span className="bg-accent text-black rounded-full h-8 w-8 flex items-center justify-center border-2 border-black font-sans text-sm flex-shrink-0">
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
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          /* Mobile: Reduced from 40px to 32px for a subtler move | Desktop: Unchanged */
          className="w-full h-auto -translate-y-[32px] md:-translate-y-[20px]"
        >
          <path
            className="block md:hidden"
            d="M0 80 C 480 90, 960 70, 1440 80 V 120 H 0 Z"
            fill="#2D2D2D"
          />
          <path
            className="hidden md:block"
            d="M0 90 C 480 100, 960 80, 1440 90 V 120 H 0 Z"
            fill="#2D2D2D"
          />

          <path
            className="block md:hidden"
            d="M0 80 C 480 90, 960 70, 1440 80"
            fill="none"
            stroke="#FFC107"
            strokeWidth="3"
            strokeDasharray="15, 12"
            strokeLinecap="round"
            transform="translate(0, 10)"
          />
          <path
            className="hidden md:block"
            d="M0 90 C 480 100, 960 80, 1440 90"
            fill="none"
            stroke="#FFC107"
            strokeWidth="3"
            strokeDasharray="15, 12"
            strokeLinecap="round"
            transform="translate(0, 15)"
          />
        </svg>

        <div className="absolute bottom-0 right-full w-32 md:w-48 z-20 animate-drive">
          {scooter && (
            <Image
              src="/images/lbcrider.gif"
              alt={scooter.description}
              style={{ transform: "scaleX(-1)" }}
              width={150}
              height={150}
              className="object-contain"
              data-ai-hint={scooter.imageHint}
              unoptimized
            />
          )}
        </div>
        <div className="relative">
          {/* ibang content */}

          <div
            className="absolute bottom-64 right-4 md:bottom-96 md:right-full w-32 md:w-48 z-50 animate-drive"
            style={{ animationDelay: "7.5s" }}
          >
            {scooter && (
              <Image
                src="/images/balloony.gif"
                alt={scooter.description} // SEO: Ensure this description is keyword-rich
                style={{ transform: "scaleX(-1)" }}
                width={170}
                height={170}
                className="object-contain"
                data-ai-hint={scooter.imageHint}
                unoptimized
              />
            )}
          </div>
        </div>

        <div
          className="absolute bottom-0  right-full w-32 md:w-48 z-20 animate-drive-reverse"
          style={{ animationDelay: "5s" }}
        >
          {scooter && (
            <Image
              src="/images/lbcrider.gif"
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
