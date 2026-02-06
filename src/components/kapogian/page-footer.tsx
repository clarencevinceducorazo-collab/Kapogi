import Image from 'next/image';
import Link from 'next/link';
import { Twitter, Instagram, Youtube } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const PageFooter = () => {
  const avatar = PlaceHolderImages.find((img) => img.id === 'header-avatar');
  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, href: '#' },
    { icon: <Instagram className="h-5 w-5" />, href: '#' },
    { icon: <Youtube className="h-5 w-5" />, href: '#' },
  ];

  return (
    <footer className="bg-primary text-primary-foreground py-8">
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
          <div className="flex items-center gap-5">
            {socialLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="transition-colors hover:text-accent"
              >
                {link.icon}
              </Link>
            ))}
          </div>
          <p className="text-white/60 text-xs">
            &copy; {new Date().getFullYear()} Kapogian. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
