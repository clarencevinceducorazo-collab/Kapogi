'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LoaderCircle, Trophy, Crown, Medal, ShieldAlert } from 'lucide-react';
import { suiClient } from '@/lib/sui';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { PageHeader } from '@/components/kapogian/page-header';

type LeaderboardEntry = {
  address: string;
  count: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalMinted, setTotalMinted] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch total minted count from the MintCounter shared object
        const counterObj = await suiClient.getObject({
          id: CONTRACT_ADDRESSES.MINT_COUNTER_ID,
          options: { showContent: true },
        });
        
        if (counterObj.data?.content?.dataType === 'moveObject') {
            const fields = counterObj.data.content.fields as { total_minted: string };
            setTotalMinted(Number(fields.total_minted));
        }

        // 2. Fetch all mint events to build the leaderboard
        const allEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::CharacterMinted` },
          order: 'ascending',
        });
        
        const ownerCounts: { [key: string]: number } = {};
        allEvents.data.forEach(event => {
          const owner = (event.parsedJson as any)?.owner;
          if (owner) {
            ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
          }
        });

        // 3. Process the data into a sorted leaderboard array
        const sortedLeaderboard = Object.entries(ownerCounts)
          .map(([address, count]) => ({ address, count }))
          .sort((a, b) => b.count - a.count);
        
        setLeaderboard(sortedLeaderboard);

      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
        setError('Failed to load leaderboard data. The network may be busy. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-yellow-600" />;
    return <span className="font-bold text-gray-400 w-6 text-center">{rank + 1}</span>;
  };

  return (
    <>
      <PageHeader />
      <div className="relative font-body min-h-screen p-4 pt-28 md:p-8 md:pt-32 antialiased selection:bg-black selection:text-white">
        <Image
          src="/images/herobg.png"
          alt="Leaderboard background"
          fill
          className="object-cover -z-10"
          priority
        />
        <div className="max-w-4xl mx-auto space-y-8 relative">
          {loading ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl flex justify-center items-center p-20 text-lg gap-3 font-bold text-gray-800 shadow-hard">
                  <LoaderCircle size={32} className="animate-spin" />
                  <p>Loading Leaderboards...</p>
              </div>
          ) : error ? (
              <div className="bg-red-100 border-4 border-dashed border-red-500 rounded-2xl p-8 text-center shadow-hard">
                  <ShieldAlert size={48} className="mx-auto text-red-600 mb-4"/>
                  <h3 className="font-headline text-2xl text-red-800">An Error Occurred</h3>
                  <p className="text-red-700 font-bold">{error}</p>
              </div>
          ) : (
            <>
              <div className="bg-primary/80 backdrop-blur-sm text-white border-4 border-black rounded-3xl p-8 text-center shadow-hard transform -rotate-1 hover:rotate-0 transition-transform">
                <h2 className="font-headline text-2xl opacity-80 uppercase">Total Kapogians Minted</h2>
                <p className="font-headline text-7xl font-bold tracking-tighter" style={{textShadow: '4px 4px 0 #000'}}>
                  {totalMinted !== null ? totalMinted.toLocaleString() : '...'}
                </p>
              </div>

              <div className="bg-white border-4 border-black rounded-3xl shadow-hard overflow-hidden">
                  <div className="p-5 border-b-4 border-black">
                      <h2 className="font-headline text-2xl tracking-tight text-black">Top Collectors</h2>
                  </div>
                  {leaderboard.length === 0 ? (
                      <p className="p-10 text-center text-gray-500 font-bold">No collectors yet. Be the first!</p>
                  ) : (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                              <tr className="bg-gray-50 text-gray-500 border-b-4 border-black text-sm uppercase font-black tracking-wider">
                                  <th className="p-4 px-6 text-center">Rank</th>
                                  <th className="p-4 px-6">Collector</th>
                                  <th className="p-4 px-6 text-right">NFTs Owned</th>
                              </tr>
                              </thead>
                              <tbody className="text-base font-bold text-black">
                              {leaderboard.map((entry, index) => (
                                  <tr key={entry.address} className="group border-b-2 border-gray-200 hover:bg-yellow-50 transition-colors last:border-b-0">
                                      <td className="p-4 px-6 text-center">
                                          <div className="flex items-center justify-center">
                                              {getRankIcon(index)}
                                          </div>
                                      </td>
                                      <td className="p-4 px-6 font-mono text-sm" title={entry.address}>
                                          {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                                      </td>
                                      <td className="p-4 px-6 text-right font-headline text-2xl">
                                          {entry.count}
                                      </td>
                                  </tr>
                              ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
