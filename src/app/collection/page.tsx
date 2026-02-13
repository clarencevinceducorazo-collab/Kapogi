'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getOwnedCharacters } from '@/lib/sui';
import { getIPFSGatewayUrl } from '@/lib/pinata';
import { 
  LoaderCircle, 
  ShieldAlert, 
  Wallet, 
  Ghost, 
  Star, 
  Heart, 
  TrendingUp,
  ExternalLink,
  Sparkles
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
                <span className="font-body text-black">{label}</span>
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
  const [error, setError] = useState('');

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
    setError('');
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
        try {
            if (contentData.attributes) {
                attributes = JSON.parse(contentData.attributes);
            }
        } catch (e) {
            console.error("Failed to parse attributes", e);
        }
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
      setError('Failed to load your collection. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col font-body antialiased selection:bg-black selection:text-white relative">
      {/* Background Image - Fixed and Z-indexed to bottom */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/kapogian_background.png"
          alt="Collection background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <PageHeader />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
          {!account ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white border-4 border-black rounded-3xl p-12 shadow-hard text-center max-w-md w-full">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black shadow-hard-sm">
                    <Wallet size={40} className="text-white" />
                </div>
                <h2 className="font-headline text-3xl mb-4 text-black uppercase">Sync Required</h2>
                <p className="font-bold mb-8 text-black">Connect your Sui wallet to access your character collection.</p>
                <CustomConnectButton className="!w-full !bg-accent !border-4 !border-black !text-white !font-black !px-6 !py-4 !rounded-full !shadow-hard-sm hover:!bg-blue-600 !transition-brutal uppercase tracking-widest" />
              </div>
            </div>
          ) : loading ? (
            <div className="h-[50vh] flex flex-col items-center justify-center gap-4 bg-white border-4 border-black rounded-3xl shadow-hard">
              <LoaderCircle size={48} className="animate-spin text-black" />
              <p className="text-black font-black uppercase text-lg">Syncing with Sui...</p>
            </div>
          ) : (
            <>
              <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="font-headline text-6xl md:text-8xl font-bold text-black uppercase" 
                      style={{ textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 6px 6px 0px #000' }}>
                    My Collection
                  </h1>
                  <p className="mt-6 text-xl font-bold text-black uppercase tracking-tight" 
                     style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 2px 2px 0px #000' }}>
                    SUI: <span className="font-mono">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
                  </p>
                </div>
                <div className="bg-white border-4 border-black rounded-2xl px-8 py-5 shadow-hard flex items-center gap-6">
                  <div className="text-left">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Total Minted</span>
                    <span className="text-3xl font-black text-black">{characters.length} <span className="text-sm font-bold text-gray-500 uppercase">Squad</span></span>
                  </div>
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-black">
                    <Sparkles className="text-black" size={24} />
                  </div>
                </div>
              </header>

              {characters.length === 0 ? (
                <div className="bg-white border-4 border-black rounded-3xl p-20 text-center shadow-hard">
                   <Ghost size={80} className="mx-auto mb-8 text-gray-300" />
                   <h3 className="font-headline text-4xl uppercase mb-4 text-black">Inventory Empty</h3>
                   <p className="text-black mb-10 max-w-xs mx-auto text-lg font-bold">No biometric signatures detected.</p>
                   <a href="/summoning">
                     <Button className="bg-primary hover:bg-accent text-white border-4 border-black font-black px-12 py-8 rounded-2xl text-xl transition-brutal shadow-hard">
                       SUMMON SQUAD
                     </Button>
                   </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Featured Area */}
                  <div className="lg:col-span-8 lg:sticky lg:top-36">
                    {selectedChar && (
                      <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-hard p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="md:w-1/2 aspect-square relative rounded-2xl overflow-hidden border-4 border-black bg-gray-50">
                            <Image src={selectedChar.imageUrl} alt={selectedChar.name} fill className="object-cover" />
                          </div>
                          <div className="md:w-1/2 flex flex-col justify-between text-left">
                            <div>
                              <span className="text-xs font-black text-primary uppercase">Biometric Signature</span>
                              <h2 className="font-headline text-5xl uppercase mt-2 text-black leading-tight">{selectedChar.name}</h2>
                              <div className="space-y-6 py-6 mt-6 border-y-4 border-dashed border-gray-200">
                                <StatDisplay label="Cuteness" value={selectedChar.attributes.cuteness} icon={Star} color="text-yellow-500" />
                                <StatDisplay label="Confidence" value={selectedChar.attributes.confidence} icon={Heart} color="text-pink-500" />
                                <StatDisplay label="Tili Factor" value={selectedChar.attributes.tiliFactor} icon={TrendingUp} color="text-green-500" />
                              </div>
                            </div>
                            <Button className="w-full mt-8 bg-black hover:bg-primary text-white font-black py-7 rounded-xl transition-brutal border-2 border-black shadow-hard-sm flex items-center justify-center gap-2">
                              Explore Object <ExternalLink size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Grid */}
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="font-headline text-2xl uppercase text-black text-left" style={{ textShadow: '1px 1px 0px #fff, 3px 3px 0px #000' }}>Squad Archive</h3>
                    <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2 p-1">
                      {characters.map((char) => (
                        <button
                          key={char.objectId}
                          onClick={() => setSelectedChar(char)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-brutal shadow-hard-sm ${
                            selectedChar?.objectId === char.objectId ? 'border-primary -translate-y-1 shadow-hard' : 'border-black hover:border-accent hover:-translate-y-1'
                          }`}
                        >
                          <Image src={char.imageUrl} alt={char.name} fill className="object-cover" />
                        </button>
                      ))}
                      <a href="/summoning" className="aspect-square rounded-2xl border-4 border-dashed border-black hover:bg-yellow-400 transition-brutal flex flex-col items-center justify-center gap-2 bg-white shadow-hard-sm">
                        <Sparkles size={32} className="text-black" />
                        <span className="font-black uppercase text-xs text-black">Summon</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <PageFooter />
    </div>
  );
}