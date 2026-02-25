import Image from "next/image";
import Link from "next/link";
import { Twitter, Instagram, Youtube } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export const PageFooter = () => {
  const avatar = PlaceHolderImages.find((img) => img.id === "header-avatar");


  return (
    <footer className="bg-primary/90 text-primary-foreground py-8 w-full">
      <div className="container mx-auto text-center">
        <div className="flex flex-col items-center gap-4">
          {avatar && (
            <Link href="/" aria-label="Kapogian Home">
              <Image
                src="/images/KapogianLogo.webp"
                alt={avatar.description}
                width={64}
                height={64}
                className="rounded-full border-2 border-primary-foreground/50"
                data-ai-hint={avatar.imageHint}
              />
            </Link>
          )}
          <p className="text-base font-bold">
            Collect Digital Magic, Get Real Rewards
          </p>
   
          <p className="text-white/60 text-xs">
            &copy; {new Date().getFullYear()} Kapogian. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
