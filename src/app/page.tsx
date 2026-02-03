import { AboutSection } from '@/components/kapogian/about-section';
import { FaqSection } from '@/components/kapogian/faq-section';
import { HeroSection } from '@/components/kapogian/hero-section';
import { HowItWorksSection } from '@/components/kapogian/how-it-works-section';
import { PageFooter } from '@/components/kapogian/page-footer';
import { PageHeader } from '@/components/kapogian/page-header';
import { SecuritySection } from '@/components/kapogian/security-section';
import { StylistShopSection } from '@/components/kapogian/stylist-shop-section';

export default function Home() {
  return (
    <>
      <PageHeader />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <StylistShopSection />
      <SecuritySection />
      <FaqSection />
      <PageFooter />
    </>
  );
}
