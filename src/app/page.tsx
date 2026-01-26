import { PageHeader } from '@/components/kapogian/page-header';
import { HeroSection } from '@/components/kapogian/hero-section';
import { HowItWorksSection } from '@/components/kapogian/how-it-works-section';
import { ShopSection } from '@/components/kapogian/shop-section';
import { SecurityRoadmapSection } from '@/components/kapogian/security-roadmap-section';
import { FaqSection } from '@/components/kapogian/faq-section';
import { FinalCtaSection } from '@/components/kapogian/final-cta-section';
import { PageFooter } from '@/components/kapogian/page-footer';

export default function Home() {
  return (
    <>
      <PageHeader />
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <HeroSection />
        <HowItWorksSection />
        <ShopSection />
        <SecurityRoadmapSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <PageFooter />
    </>
  );
}
