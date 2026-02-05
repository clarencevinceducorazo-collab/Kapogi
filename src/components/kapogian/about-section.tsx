import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';

export const AboutSection = () => {
    const mainCharacter = PlaceHolderImages.find(
        (img) => img.id === 'about-main-character'
    );
    const bottomCharacters = PlaceHolderImages.find(
        (img) => img.id === 'about-bottom-characters'
    );

    return (
        <section className="relative w-full swirl-bg text-slate-300 flex items-center justify-center py-24 lg:py-32">
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    
                    {/* Left Column: Character Visual */}
                    <div className="lg:col-span-5 relative group order-2 lg:order-1 flex justify-center">
                        {/* Decorative back glow for character */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl transform scale-75 opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
                        
                        {/* Main Character */}
                         {mainCharacter && (
                            <div className="relative w-full max-w-md aspect-[4/5] flex items-end justify-center">
                                <Image 
                                    src="/images/pogimove.gif"
                                    alt={mainCharacter.description}
                                    fill
                                    className="object-contain drop-shadow-2xl filter brightness-95 hover:brightness-100 transition-all duration-500 transform hover:scale-[1.02]"
                                    data-ai-hint={mainCharacter.imageHint}
                                />
                                {/* Reflection/Shadow at feet */}
                                <div className="absolute -bottom-6 w-3/4 h-4 bg-black/40 blur-xl rounded-[100%]"></div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Content */}
                    <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col relative text-center lg:text-left">
                        
                        {/* Tagline */}
                        <div className="mb-6">
                            <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                About Kapogian
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1] mb-8">
                            A magical universe <br className="hidden lg:block" />
                            powered by <span className="text-accent">Web3</span>.
                        </h1>

                        {/* Body Text */}
                        <div className="space-y-6 text-lg lg:text-xl text-slate-400 font-body leading-relaxed max-w-2xl mx-auto lg:mx-0">
                             <p>
                                Kapogian is a magical character universe powered by Web3. Every Kapogian is strictly <strong className="text-slate-200 font-medium">1-of-1</strong>, algorithmically generated, permanently stored on IPFS, and minted on the <strong className="text-slate-200 font-medium">SUI Network</strong>. But Kapogian isn't just digital.
                            </p>
                            <p>
                                Every mint unlocks real world merchandise, turning your character into something you can actually hold.
                            </p>
                        </div>

                        {/* CTA Section */}
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                            <Link href="/generate" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-medium text-slate-900 transition-all hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900">
                                Explore Collection
                                <ArrowRight className="h-4 w-4 stroke-[2] transition-transform group-hover:translate-x-1" />
                            </Link>

                        </div>

                        {/* Secondary Small Character (Absolute positioned for flair) */}
                         {bottomCharacters && (
                            <div className="hidden lg:block absolute -bottom-32 -right-12 xl:-right-24 w-48 animate-float-y">
                                <Image 
                                    src="/images/balloony.gif"
                                    alt={bottomCharacters.description}
                                    width={292}
                                    height={292}
                                    className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity transform rotate-[-10deg]"
                                    data-ai-hint={bottomCharacters.imageHint}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
