'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getOwnedCharacters } from '@/lib/sui';
import { getIPFSGatewayUrl } from '@/lib/pinata';
import { LoaderCircle, ShieldAlert, Wallet, Ghost, Star, Heart, TrendingUp } from 'lucide-react';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
                <span>{label}</span>
            </div>
            <span>{value}</span>
        </div>
        <Progress value={value} className="h-2 [&>div]:bg-primary" />
    </div>
);

export default function CollectionPage() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<Character[]>([]);
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
        let attributes = {};
        try {
            if (contentData.attributes) {
                attributes = JSON.parse(contentData.attributes);
            }
        } catch (e) {
            console.error("Failed to parse attributes for NFT:", obj.data?.objectId, e);
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
      }).filter(char => char.objectId); // Filter out any malformed objects

      setCharacters(parsedCharacters);
    } catch (err) {
      console.error('Failed to load characters:', err);
      setError('Failed to load your collection. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!account) {
    return (
      <>
        <PageHeader />
        <div className="relative font-body text-gray-900 min-h-screen p-4 md:p-8 flex items-center justify-center antialiased selection:bg-black selection:text-white">
          <Image
              src="/images/kapogian_background.png"
              alt="Collection background"
              fill
              className="object-cover -z-10"
              priority
          />
          <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-hard text-center max-w-md w-full relative">
            <Wallet size={48} className="mx-auto mb-4" />
            <h2 className="font-headline text-3xl mb-4">View Your Collection</h2>
            <p className="mb-6">Please connect your wallet to see your minted Kapogians.</p>
            <CustomConnectButton className="!bg-accent !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-full !shadow-hard-sm hover:!bg-blue-600 !transition-brutal" />
          </div>
        </div>
        <PageFooter />
      </>
    );
  }

  return (
    <>
      <PageHeader />
      <div className="relative font-body text-gray-900 min-h-screen p-4 pt-28 md:p-8 md:pt-32 antialiased selection:bg-black selection:text-white">
        <Image
          src="/images/kapogian_background.png"
          alt="Collection background"
          fill
          className="object-cover -z-10"
          priority
        />
        <div className="max-w-7xl mx-auto space-y-8 relative">
           <div className="text-center">
                <h1 
                    className="font-headline text-6xl sm:text-7xl md:text-8xl font-bold text-black"
                    style={{
                        textShadow:
                        '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 5px 5px 0px #000',
                    }}
                >
                    My Collection
                </h1>
                <p className="text-xl md:text-2xl font-bold text-black max-w-2xl mx-auto mt-4" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 2px 2px 0px #000' }}>
                    Here are all the unique Kapogian characters you've minted.
                </p>
            </div>

          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl flex justify-center items-center p-20 text-lg gap-3 font-bold text-gray-800 shadow-hard">
              <LoaderCircle size={32} className="animate-spin" />
              <p>Loading Your Collection...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-4 border-dashed border-red-500 rounded-2xl p-8 text-center shadow-hard">
              <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
              <h3 className="font-headline text-2xl text-red-800">An Error Occurred</h3>
              <p className="text-red-700 font-bold">{error}</p>
            </div>
          ) : characters.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-hard">
                <Ghost size={48} className="mx-auto mb-4 text-gray-400"/>
              <h3 className="font-headline text-3xl">Your Collection is Empty</h3>
              <p className="text-gray-600 mb-6 mt-2">You haven't minted any Kapogian characters yet.</p>
              <a href="/generate">
                  <Button className="bg-primary hover:bg-primary/90 text-white border-2 border-black shadow-hard-sm rounded-lg font-bold px-6 py-3 text-base">
                      Mint Your First Character
                  </Button>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {characters.map(char => (
                    <Card key={char.objectId} className="bg-white/90 backdrop-blur-sm border-4 border-black rounded-2xl shadow-hard overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-[12px_12px_0_#000]">
                        <CardHeader className="p-0 border-b-4 border-black">
                           <div className="aspect-square w-full relative bg-gray-100">
                                <Image 
                                    src={char.imageUrl} 
                                    alt={char.name} 
                                    fill 
                                    className="object-cover"
                                />
                           </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <CardTitle 
                                className="font-headline text-2xl tracking-tight truncate text-black uppercase" 
                                title={char.name}
                            >
                                {char.name}
                            </CardTitle>
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 space-y-3">
                                <StatDisplay label="Cuteness" value={char.attributes.cuteness} icon={Star} color="text-yellow-500" />
                                <StatDisplay label="Confidence" value={char.attributes.confidence} icon={Heart} color="text-pink-500"/>
                                <StatDisplay label="Tili Factor" value={char.attributes.tiliFactor} icon={TrendingUp} color="text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )}
        </div>
      </div>
      <PageFooter />
    </>
  );
}
