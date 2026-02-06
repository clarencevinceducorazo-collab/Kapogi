'use client';

import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';
import { Rocket, Gamepad2, Coins } from 'lucide-react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const roadmapPhases = [
  {
    status: 'inprogress',
    title: 'PHASE 1: GENESIS',
    date: '2026',
    description: 'NFT Genesis & 1-to-1 Physical Merch Store Launch.',
    icon: Rocket,
  },
  {
    status: 'upcoming',
    title: 'PHASE 2: THE KCG',
    date: '2027',
    description: 'Kapogian Card Game (KCG) Launch; Integration of Trait-Based MMR.',
    icon: Gamepad2,
  },
  {
    status: 'upcoming',
    title: 'PHASE 3: TOKEN GENESIS',
    date: '2028',
    description: '$KPG Token Deployment; Full Ecosystem Integration; Global Pogi Nation Expansion.',
    icon: Coins,
  },
];

const RoadmapCard = ({ phase, index }: { phase: typeof roadmapPhases[0]; index: number }) => {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true });

  const statusStyles = {
    completed: {
      badge: 'bg-green-500 text-white',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      transform: 'transform -rotate-2 hover:rotate-0',
    },
    inprogress: {
      badge: 'bg-yellow-400 text-black',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      transform: 'transform rotate-1 hover:rotate-0',
    },
    upcoming: {
      badge: 'bg-gray-300 text-black',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      transform: 'transform -rotate-1 hover:rotate-0',
    },
  };

  const styles = statusStyles[phase.status as keyof typeof statusStyles];

  return (
    <div
      ref={ref}
      className={cn(
        'bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-hard transition-all duration-500 ease-out',
        styles.transform,
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div
          className={cn(
            'w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 border-4 border-black shadow-hard-xs',
            styles.iconBg
          )}
        >
          <phase.icon
            className={cn('w-12 h-12', styles.iconColor)}
            strokeWidth={2.5}
          />
        </div>
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
            <h3 className="font-headline text-3xl text-black">{phase.title}</h3>
            <span
              className={cn(
                'text-xs font-black uppercase px-3 py-1 border-2 border-black rounded-full mt-2 sm:mt-0',
                styles.badge
              )}
            >
              {phase.status}
            </span>
          </div>
          <p className="font-bold text-gray-500 mb-3">{phase.date}</p>
          <p className="text-gray-700 leading-relaxed font-medium">
            {phase.description}
          </p>
        </div>
      </div>
    </div>
  );
};


export default function RoadmapPage() {
  return (
    <>
      <PageHeader />
      <div className="relative font-body min-h-screen p-4 pt-28 md:p-8 md:pt-32 antialiased selection:bg-black selection:text-white">
        <div className="hidden md:block absolute inset-0 -z-10">
          <Image
            src="/images/herobg.png"
            alt="Roadmap background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="block md:hidden absolute inset-0 -z-10">
          <Image
            src="/images/mobilebg.png"
            alt="Roadmap background mobile"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="max-w-4xl mx-auto space-y-12 relative">
            <div className="text-center px-4">
                <h1 
                    className="font-headline text-6xl sm:text-7xl md:text-8xl font-bold text-white"
                    style={{
                        textShadow:
                        '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 5px 5px 0 #000',
                    }}
                >
                    Our Roadmap
                </h1>
                <p className="text-xl md:text-2xl font-bold text-white max-w-2xl mx-auto mt-4" style={{ textShadow: '2px 2px 0px #000' }}>
                    The journey of Kapogian is a multi-year saga. Here's a look at what's to come.
                </p>
            </div>

            <div className="space-y-8 md:space-y-12">
            {roadmapPhases.map((phase, index) => (
                <RoadmapCard key={phase.title} phase={phase} index={index} />
            ))}
            </div>
        </div>
      </div>
      <PageFooter />
    </>
  );
}
