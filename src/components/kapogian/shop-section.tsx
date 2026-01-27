'use client';

import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";
import Image from "next/image";
import { useInView } from "@/hooks/use-in-view";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ProductSticker = ({
  icon: Icon,
  name,
  imageUrl,
  delay,
}: {
  icon?: React.ElementType;
  name: string;
  imageUrl?: string;
  delay: number;
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Generate random rotation only on the client-side
    setRotation(Math.random() * 6 - 3);
  }, []);

  return (
    <div
      style={{
        transitionDelay: `${delay}ms`,
        transform: `rotate(${rotation}deg)`,
      }}
      className="bg-white text-black comic-border rounded-2xl p-4 flex flex-col items-center sticker-cut cursor-pointer hover:bg-yellow-50 transition-all duration-700 ease-premium-ease hover:!scale-105 hover:!rotate-0 group hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={150}
            height={150}
            className="object-contain w-full h-full p-2"
          />
        ) : (
          Icon && <Icon className="w-12 h-12 text-slate-700" strokeWidth={1.5} />
        )}
      </div>
      <span className="font-headline text-lg transition-transform duration-300 group-hover:scale-110">
        {name}
      </span>
    </div>
  );
};

export function ShopSection() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  
  const products = [
      { name: "TEE", imageUrl: "/images/shirt.png" },
      { name: "MUG", imageUrl: "/images/printmug.png" },
      { name: "PAD", imageUrl: "/images/pad.png" },
      { name: "PLATE", imageUrl: "/images/aluminum.png" },
  ];

  return (
    <div ref={ref} className={cn("bg-accent comic-border-thick rounded-[2.5rem] p-8 md:p-12 mb-12 toy-shadow-lg text-white relative overflow-hidden", inView ? "animate__animated animate__fadeInLeft" : "opacity-0")}>
      <div className="absolute inset-0 opacity-10" style={{backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)", backgroundSize: "20px 20px"}}></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b-4 border-black/20 pb-4">
          <div>
            <h2 className="text-5xl font-headline text-outline mb-1">THE STYLIST SHOP</h2>
            <span className="bg-white text-black comic-border px-3 py-1 text-sm font-bold rounded-lg inline-block">
              HOLDERS ONLY ACCESS
            </span>
          </div>
          <div className="text-right hidden md:block">
            <span className="font-bold text-xl opacity-90">FALL COLLECTION</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {products.map((product, index) => (
            <ProductSticker key={product.name} {...product} delay={index * 120} />
          ))}
        </div>

        <div className="bg-[hsl(var(--brand-yellow))] text-black comic-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden transition-all duration-700 ease-premium-ease delay-500">
          <div className="absolute top-0 left-0 w-full h-full animate-shine-sweep bg-white/20 pointer-events-none"></div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl comic-border">
              <Gem className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="font-headline text-2xl leading-none">THE "ALL-IN" BUNDLE</h4>
              <p className="text-sm font-bold opacity-75">Save 20% when you grab the whole set.</p>
            </div>
          </div>
          <Button className="bg-black text-white hover:bg-slate-800 comic-border rounded-xl px-6 py-3 font-headline whitespace-nowrap h-auto">
            UPGRADE (+10 SUI)
          </Button>
        </div>
      </div>
    </div>
  );
}
