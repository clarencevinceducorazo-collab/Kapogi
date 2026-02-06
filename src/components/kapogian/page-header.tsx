'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Menu, ChevronDown } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ADMIN_ADDRESS } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const PageHeader = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const account = useCurrentAccount();
  const isAdmin = account?.address === ADMIN_ADDRESS;

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'GENERATE', href: '/generate' },
    { name: 'COLLECTION', href: '/collection' },
    {
      name: 'ABOUT US',
      isDropdown: true,
      items: [
        { name: 'Whitepaper', href: '/whitepaper' },
        { name: 'Roadmap', href: '/roadmap' },
      ],
    },
    { name: 'LEADERBOARDS', href: '/leaderboard' },
    { name: 'MY ORDERS', href: '/my-orders' },
  ];

  const avatar = PlaceHolderImages.find((img) => img.id === 'header-avatar');

  return (
    <>
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
            <nav className="hidden lg:flex items-center gap-6 xl:gap-10 text-lg font-bold text-primary-foreground">
              {navLinks.map((link) =>
                link.isDropdown ? (
                  <DropdownMenu key={link.name}>
                    <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-accent/80 focus:outline-none">
                      {link.name}
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-primary/90 text-primary-foreground border-primary-foreground/20">
                      {link.items?.map((item) => (
                        <DropdownMenuItem key={item.name} asChild className="font-bold text-lg">
                          <Link href={item.href}>{item.name}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href!}
                    className="transition-colors hover:text-accent/80"
                  >
                    {link.name}
                  </Link>
                )
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="transition-colors hover:text-accent/80"
                >
                  ADMIN
                </Link>
              )}
            </nav>
            <div className="pr-2 flex items-center gap-2">
              <div className="hidden lg:block">
                <CustomConnectButton />
              </div>
              <div className="lg:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary-foreground hover:bg-white/10"
                    >
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="bg-primary/95 text-primary-foreground border-l-primary-foreground/20 pt-20"
                  >
                    <div className="flex flex-col h-full">
                      <nav className="flex-grow">
                        <Accordion type="single" collapsible className="w-full px-8">
                          {navLinks.map((link) =>
                            link.isDropdown ? (
                              <AccordionItem value={link.name} key={link.name} className="border-b-primary-foreground/20">
                                <AccordionTrigger className="text-3xl font-bold transition-colors hover:text-accent [&[data-state=open]>svg]:rotate-180 py-4 justify-center">
                                  {link.name}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="flex flex-col items-center gap-4 mt-4">
                                    {link.items?.map((item) => (
                                      <SheetClose asChild key={item.name}>
                                        <Link
                                          href={item.href}
                                          className="text-2xl font-semibold transition-colors hover:text-accent"
                                        >
                                          {item.name}
                                        </Link>
                                      </SheetClose>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ) : (
                              <SheetClose asChild key={link.name}>
                                <Link
                                  href={link.href!}
                                  className="py-4 text-3xl font-bold transition-colors hover:text-accent flex justify-center w-full"
                                >
                                  {link.name}
                                </Link>
                              </SheetClose>
                            )
                          )}
                          {isAdmin && (
                            <SheetClose asChild>
                              <Link
                                href="/admin"
                                className="py-4 text-3xl font-bold transition-colors hover:text-accent flex justify-center w-full"
                              >
                                ADMIN
                              </Link>
                            </SheetClose>
                          )}
                        </Accordion>
                      </nav>
                      <div className="mt-auto mb-8 flex justify-center">
                        <CustomConnectButton />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
