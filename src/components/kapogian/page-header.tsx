'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ADMIN_ADDRESS } from '@/lib/constants';

export const PageHeader = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const account = useCurrentAccount();
  const isAdmin = account?.address === ADMIN_ADDRESS;

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'GENERATE', href: '/generate' },
    { name: 'LEADERBOARDS', href: '/leaderboard' },
    { name: 'MY ORDERS', href: '/my-orders' },
  ];

  const avatar = PlaceHolderImages.find((img) => img.id === 'header-avatar');

  return (
    <header className="absolute top-0 left-0 right-0 z-50 p-4">
      <div className="container mx-auto">
      <div className="flex h-20 items-center justify-between rounded-full bg-primary/90 backdrop-blur-sm p-2 border-2 border-primary-foreground/20 shadow-lg">
      <div className="flex items-center gap-4 pl-2">
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
          </div>
          <nav className="hidden md:flex items-center gap-6 lg:gap-10 text-lg font-bold text-primary-foreground">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="transition-colors hover:text-accent/80"
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="transition-colors hover:text-accent/80">
                ADMIN
              </Link>
            )}
          </nav>
          <div className="pr-2 flex items-center gap-2">
            <div className="hidden md:block">
              <CustomConnectButton />
            </div>
            <div className="md:hidden">
               <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-primary/95 text-primary-foreground border-l-primary-foreground/20 pt-20">
                  <nav className="flex flex-col items-center gap-8">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsSheetOpen(false)}
                        className="text-3xl font-bold transition-colors hover:text-accent"
                      >
                        {link.name}
                      </Link>
                    ))}
                     {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsSheetOpen(false)}
                        className="text-3xl font-bold transition-colors hover:text-accent"
                      >
                        ADMIN
                      </Link>
                    )}
                  </nav>
                   <div className="mt-12 flex justify-center">
                    <CustomConnectButton />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
