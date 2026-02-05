'use client';

import { useState } from 'react';
import { AboutSection } from '@/components/kapogian/about-section';
import { FaqSection } from '@/components/kapogian/faq-section';
import { HeroSection } from '@/components/kapogian/hero-section';
import { HowItWorksSection } from '@/components/kapogian/how-it-works-section';
import { PageFooter } from '@/components/kapogian/page-footer';
import { PageHeader } from '@/components/kapogian/page-header';
import { SecuritySection } from '@/components/kapogian/security-section';
import { StylistShopSection } from '@/components/kapogian/stylist-shop-section';
import { WhitepaperModal } from '@/components/kapogian/whitepaper-modal';

export default function Home() {
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);

  return (
    <>
      <PageHeader />
      <HeroSection onWhitepaperOpen={() => setIsWhitepaperOpen(true)} />
      <AboutSection />
      <HowItWorksSection />
      <StylistShopSection />
      <SecuritySection />
      <FaqSection />
      <PageFooter />
      <WhitepaperModal
        isOpen={isWhitepaperOpen}
        onOpenChange={setIsWhitepaperOpen}
      />
    </>
  );
}
