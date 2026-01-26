import { Button } from "@/components/ui/button";
import { Mouse, UtensilsCrossed, Gem } from "lucide-react";
import Image from "next/image";

const ProductSticker = ({
  icon: Icon,
  name,
  imageUrl,
}: {
  icon?: React.ElementType;
  name: string;
  imageUrl?: string;
}) => (
  <div className="bg-white text-black comic-border rounded-2xl p-4 flex flex-col items-center sticker-cut cursor-pointer hover:bg-yellow-50">
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
    <span className="font-headline text-lg">{name}</span>
  </div>
);

export function ShopSection() {
  return (
    <div className="bg-accent comic-border-thick rounded-[2.5rem] p-8 md:p-12 mb-12 toy-shadow-lg text-white relative overflow-hidden">
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
          <ProductSticker imageUrl="/images/shirt.png" name="TEE" />
          <ProductSticker imageUrl="/images/printmug.png" name="MUG" />
          <ProductSticker icon={Mouse} name="PAD" />
          <ProductSticker icon={UtensilsCrossed} name="PLATE" />
        </div>

        <div className="bg-[hsl(var(--brand-yellow))] text-black comic-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
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
