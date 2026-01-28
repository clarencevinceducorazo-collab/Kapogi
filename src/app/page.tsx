'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/kapogian/page-header';
import { HeroSection } from '@/components/kapogian/hero-section';
import { HowItWorksSection } from '@/components/kapogian/how-it-works-section';
import { ShopSection } from '@/components/kapogian/shop-section';
import { SecurityRoadmapSection } from '@/components/kapogian/security-roadmap-section';
import { FaqSection } from '@/components/kapogian/faq-section';
import { FinalCtaSection } from '@/components/kapogian/final-cta-section';
import { PageFooter } from '@/components/kapogian/page-footer';
import { WhitepaperModal } from '@/components/kapogian/whitepaper-modal';

export default function Home() {
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = Math.round((clientX / window.innerWidth) * 100);
      const y = Math.round((clientY / window.innerHeight) * 100);
      document.body.style.setProperty('--mouse-x', `${x}%`);
      document.body.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.removeProperty('--mouse-x');
      document.body.style.removeProperty('--mouse-y');
    };
  }, []);

  return (
    <>
      <PageHeader onWhitepaperOpen={() => setIsWhitepaperOpen(true)} />
      <main className="max-w-6xl mx-auto px-4 mt-6 pt-44">
        <HeroSection />
        <HowItWorksSection />
        <ShopSection />
        <SecurityRoadmapSection />
        <FaqSection />
        <FinalCtaSection onWhitepaperOpen={() => setIsWhitepaperOpen(true)} />
      </main>
      <PageFooter />
      <WhitepaperModal isOpen={isWhitepaperOpen} onOpenChange={setIsWhitepaperOpen} />
    </>
  );
}
