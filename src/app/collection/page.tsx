'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getOwnedCharacters } from '@/lib/sui';
import { getIPFSGatewayUrl } from '@/lib/pinata';
import { 
  LoaderCircle, 
  Wallet, 
  Star, 
  Heart, 
  TrendingUp,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Crown
} from 'lucide-react';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';
import { Progress } from '@/components/ui/progress';

interface Character {
  objectId: string;
  name: string;
  imageUrl: string;
  attributes: {
    cuteness: number;
    confidence: number;
    tiliFactor: number;
    [key: string]: any;
  };
}

const StatDisplay = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between text-sm font-bold">
            <div className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="font-body text-black uppercase">{label}</span>
            </div>
            <span className="font-body text-black">{value}</span>
        </div>
        <Progress value={value} className="h-3 border-2 border-black bg-white/50 [&>div]:bg-primary" />
    </div>
);

export default function CollectionPage() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    if (account?.address) {
      loadCharacters();
    } else {
      setLoading(false);
    }
  }, [account?.address]);

  const loadCharacters = async () => {
    if (!account?.address) return;
    setLoading(true);
    try {
      const ownedObjects = await getOwnedCharacters(account.address);
      if (ownedObjects.length === 0) {
        setCharacters([]);
        setLoading(false);
        return;
      }
      const parsedCharacters: Character[] = ownedObjects.map((obj: any) => {
        const displayData = obj.data?.display?.data || {};
        const contentData = obj.data?.content?.fields || {};
        let attributes: any = {};
        try { if (contentData.attributes) attributes = JSON.parse(contentData.attributes); } catch (e) {}
        
        return {
          objectId: obj.data?.objectId || '',
          name: displayData.name || 'Unnamed Character',
          imageUrl: getIPFSGatewayUrl(displayData.image_url || ''),
          attributes: {
            cuteness: attributes.cuteness || 0,
            confidence: attributes.confidence || 0,
            tiliFactor: attributes.tiliFactor || 0,
            ...attributes
          },
        };
      }).filter(char => char.objectId);

      setCharacters(parsedCharacters);
      if (parsedCharacters.length > 0) setSelectedChar(parsedCharacters[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(characters.length / ITEMS_PER_PAGE);
  const displayedCharacters = characters.slice(
    currentPage * ITEMS_PER_PAGE, 
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex flex-col font-body antialiased selection:bg-black selection:text-white relative">
      <div className="fixed inset-0 -z-10">
        <Image src="/images/kapogian_background.png" alt="bg" fill className="object-cover" priority />
      </div>

      <PageHeader />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
          {!account ? (
             <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-white border-4 border-black rounded-3xl p-12 shadow-hard text-center max-w-md w-full">
                    <Wallet size={40} className="mx-auto mb-6 text-accent" />
                    <h2 className="font-headline text-3xl mb-4 text-black uppercase">Sync Required</h2>
                    <CustomConnectButton className="!w-full !bg-accent !border-4 !border-black !text-white !font-black !rounded-full shadow-hard-sm" />
                </div>
             </div>
          ) : loading ? (
            <div className="h-[50vh] flex flex-col items-center justify-center gap-4 bg-white border-4 border-black rounded-3xl shadow-hard">
              <LoaderCircle size={48} className="animate-spin text-black" />
              <p className="font-black uppercase">Syncing...</p>
            </div>
          ) : (
            <>
              <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h1 className="font-headline text-6xl md:text-8xl font-bold text-black uppercase" 
                    style={{ textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 6px 6px 0px #000' }}>
                  My Collection
                </h1>
                <div className="bg-white border-4 border-black rounded-2xl px-8 py-5 shadow-hard flex items-center gap-6">
                  <div className="text-left">
                    <span className="text-xs font-black text-gray-500 uppercase block mb-1">Total Minted</span>
                    <span className="text-3xl font-black text-black">{characters.length} <span className="text-sm font-bold text-gray-500 uppercase">Squad</span></span>
                  </div>
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-black shadow-hard-sm">
                    <Crown className="text-black" size={24} />
                  </div>
                </div>
              </header>

              {/* Grid with items-stretch to force equal height columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                
                {/* LEFT SIDE (Featured Character) */}
                <div className="lg:col-span-8">
                  {selectedChar && (
                    <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-hard p-8 h-full flex flex-col">
                      <div className="flex flex-col md:flex-row gap-10 h-full">
                        <div className="md:w-1/2 aspect-square relative rounded-2xl overflow-hidden border-4 border-black bg-gray-50">
                          <Image src={selectedChar.imageUrl} alt={selectedChar.name} fill className="object-cover" />
                        </div>
                        <div className="md:w-1/2 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-black text-primary uppercase tracking-widest">Biometric Signature</span>
                            <h2 className="font-headline text-6xl uppercase mt-2 text-black leading-tight break-words">{selectedChar.name}</h2>
                            <div className="space-y-6 py-6 mt-6 border-y-4 border-dashed border-gray-100">
                              <StatDisplay label="Cuteness" value={selectedChar.attributes.cuteness} icon={Star} color="text-yellow-500" />
                              <StatDisplay label="Confidence" value={selectedChar.attributes.confidence} icon={Heart} color="text-pink-500" />
                              <StatDisplay label="Tili Factor" value={selectedChar.attributes.tiliFactor} icon={TrendingUp} color="text-green-500" />
                            </div>
                          </div>
                          <Button className="w-full mt-6 bg-black hover:bg-primary text-white font-black py-7 rounded-xl transition-brutal border-2 border-black shadow-hard-sm flex items-center justify-center gap-2 uppercase tracking-tighter">
                            Explore Object <ExternalLink size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE (Archive) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-hard flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-headline text-2xl uppercase text-black" style={{ textShadow: '1px 1px 0px #fff, 3px 3px 0px #000' }}>Squad Archive</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 bg-white border-2 border-black rounded-lg shadow-hard-sm hover:bg-yellow-400 disabled:opacity-30 transition-brutal">
                          <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="p-2 bg-white border-2 border-black rounded-lg shadow-hard-sm hover:bg-yellow-400 disabled:opacity-30 transition-brutal">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {displayedCharacters.map((char) => (
                        <button
                          key={char.objectId}
                          onClick={() => setSelectedChar(char)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-brutal shadow-hard-sm bg-white ${
                            selectedChar?.objectId === char.objectId ? 'border-primary -translate-y-1 shadow-hard' : 'border-black hover:border-accent hover:-translate-y-1'
                          }`}
                        >
                          <Image src={char.imageUrl} alt={char.name} fill className="object-cover" />
                        </button>
                      ))}
                      {/* Empty slots placeholders */}
                      {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - displayedCharacters.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-2xl border-4 border-dashed border-gray-100 bg-gray-50/50" />
                      ))}
                    </div>

                    <div className="mt-auto">
                        <a href="/summoning">
                            <Button className="w-full py-8 bg-yellow-400 hover:bg-accent text-black border-4 border-black font-black rounded-2xl shadow-hard-sm transition-brutal flex flex-col items-center justify-center gap-1 group">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={20} className="group-hover:animate-pulse" />
                                    <span className="uppercase text-sm">Summon Squad</span>
                                </div>
                            </Button>
                        </a>
                        <p className="text-center mt-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                            Archive Page {currentPage + 1} / {totalPages || 1}
                        </p>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </main>

      <PageFooter />
    </div>
  );
}