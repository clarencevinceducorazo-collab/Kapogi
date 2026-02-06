'use client';

import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';
import { Rocket, Gamepad2, Coins } from 'lucide-react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

const roadmapPhases = [
  {
    status: 'completed',
    title: 'PHASE 1: GENESIS',
    date: '2026 - 2027',
    description: 'Launch the Kapogian NFT Collection and establish the "phygital" 1-to-1 experience, bridging digital ownership with high-end physical collectibles.',
    icon: Rocket,
  },
  {
    status: 'inprogress',
    title: 'PHASE 2: THE KCG',
    date: '2027',
    description: 'Develop and launch the Kapogian Card Game (KCG), a strategic digital game where your NFT acts as a deck commander with trait-based matchmaking.',
    icon: Gamepad2,
  },
  {
    status: 'upcoming',
    title: 'PHASE 3: TOKEN GENESIS',
    date: '2028',
    description: 'Deploy the Kapogian Coin ($KPG) on the SUI network to power the entire ecosystem, from in-game purchases to governance.',
    icon: Coins,
  },
];

const RoadmapCard = ({ phase, index }: { phase: typeof roadmapPhases[0]; index: number }) => {
  const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: true });
  const statusColors = {
    completed: 'border-green-500 bg-green-500/10 text-green-300',
    inprogress: 'border-yellow-400 bg-yellow-400/10 text-yellow-200',
    upcoming: 'border-slate-600 bg-slate-500/10 text-slate-400',
  };
  const iconColors = {
    completed: 'bg-green-500 text-white',
    inprogress: 'bg-yellow-400 text-black',
    upcoming: 'bg-slate-700 text-slate-300',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex gap-6 relative transition-opacity duration-700 ease-out',
        inView ? 'opacity-100' : 'opacity-0',
        'flex-col md:flex-row',
        index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className={cn("flex items-center justify-center md:w-1/2", inView ? 'animate__animated animate__zoomIn' : 'opacity-0')}>
        <div className="relative w-48 h-48 md:w-64 md:h-64">
           <div className={cn("absolute inset-0 rounded-full blur-2xl", statusColors[phase.status as keyof typeof statusColors].replace('border-', 'bg-').replace('/10', '/20'))}></div>
           <phase.icon className={cn("w-24 h-24 md:w-32 md:h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", statusColors[phase.status as keyof typeof statusColors].replace('bg-', 'text-'))} />
        </div>
      </div>
      <div className={cn(
          "md:w-1/2 p-8 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 ease-out",
          statusColors[phase.status as keyof typeof statusColors],
          inView ? 'transform-none opacity-100' : 'opacity-0',
          index % 2 === 0 ? 'md:translate-x-10' : 'md:-translate-x-10'
      )}>
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", iconColors[phase.status as keyof typeof iconColors])}>
            <phase.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest">{phase.status}</p>
            <p className="font-bold text-slate-400 text-sm">{phase.date}</p>
          </div>
        </div>
        <h3 className="font-headline text-3xl text-white mb-3">{phase.title}</h3>
        <p className="text-slate-400 leading-relaxed">{phase.description}</p>
      </div>
    </div>
  );
};

export default function RoadmapPage() {
  return (
    <div className="bg-slate-900 text-white">
      <PageHeader />
      <main className="pt-32 pb-20 overflow-hidden">
        <div className="text-center px-4">
          <h1 className="font-headline text-6xl md:text-8xl tracking-tight text-white leading-[1.1] mb-4">
            Our Roadmap
          </h1>
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto">
            The journey of Kapogian is a multi-year saga. Here's a look at what's to come.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-20 px-4 relative space-y-16">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-800 -translate-x-1/2 hidden md:block"></div>
          {roadmapPhases.map((phase, index) => (
            <RoadmapCard key={phase.title} phase={phase} index={index} />
          ))}
        </div>
      </main>
      <PageFooter />
    </div>
  );
}