'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { suiClient, getOwnedReceipts } from '@/lib/sui';
import { getIPFSGatewayUrl } from '@/lib/pinata';
import { 
  LoaderCircle, 
  ShieldAlert, 
  Package, 
  Truck, 
  CheckCircle, 
  Wallet, 
  ExternalLink,
  Calendar,
  Hash,
  ShoppingBag
} from 'lucide-react';
import { ORDER_STATUS } from '@/lib/constants';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';

interface Order {
  objectId: string;
  nftId: string;
  itemsSelected: string;
  paymentAmount: number;
  status: number;
  createdAt: number;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
  character?: {
    name: string;
    imageUrl: string;
  };
}

export default function MyOrdersPage() {
  const account = useCurrentAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (account?.address) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [account?.address]);

  const loadOrders = async () => {
    if (!account?.address) return;
    setLoading(true);
    setError('');
    try {
      const ownedReceipts = await getOwnedReceipts(account.address);
      if (ownedReceipts.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const parsedReceipts: Omit<Order, 'character'>[] = ownedReceipts
        .map((obj: any) => ({
          objectId: obj.data.objectId,
          nftId: obj.data.content.fields.nft_id,
          itemsSelected: obj.data.content.fields.items_selected,
          status: Number(obj.data.content.fields.status),
          paymentAmount: Number(obj.data.content.fields.payment_amount),
          createdAt: Number(obj.data.content.fields.created_at),
          trackingNumber: obj.data.content.fields.tracking_number || '',
          carrier: obj.data.content.fields.carrier || '',
          estimatedDelivery: Number(obj.data.content.fields.estimated_delivery || 0),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      const nftIds = parsedReceipts.map(r => r.nftId);
      const nftObjects = await suiClient.multiGetObjects({
        ids: nftIds,
        options: { showDisplay: true },
      });

      const nftsMap = new Map(
        nftObjects.map(obj => [
          obj.data?.objectId,
          {
            imageUrl: getIPFSGatewayUrl((obj.data?.display?.data as any)?.image_url),
            name: (obj.data?.display?.data as any)?.name,
          },
        ])
      );

      const combinedOrders = parsedReceipts.map(receipt => ({
        ...receipt,
        character: nftsMap.get(receipt.nftId),
      }));

      setOrders(combinedOrders as Order[]);
    } catch (err) {
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusInfo = (status: number) => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return { text: 'In Transit', icon: <Truck className="w-4 h-4" />, color: 'bg-accent text-white' };
      case ORDER_STATUS.DELIVERED:
        return { text: 'Delivered', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500 text-white' };
      default:
        return { text: 'Processing', icon: <Package className="w-4 h-4" />, color: 'bg-yellow-400 text-black' };
    }
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const c = carrier.toUpperCase();
    if (c.includes('UPS')) return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    if (c.includes('FEDEX')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    if (c.includes('LBC')) return `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`;
    if (c.includes('J&T')) return `https://jtexpress.ph/tracking/${trackingNumber}`;
    return '';
  }

  return (
    <div className="min-h-screen flex flex-col font-body antialiased selection:bg-black selection:text-white relative">
      <div className="fixed inset-0 -z-10">
        <Image src="/images/kapogian_background.png" alt="bg" fill className="object-cover" priority />
      </div>

      <PageHeader />
      
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-20 relative z-10">
          
          <header className="mb-12">
            <h1 className="font-headline text-6xl md:text-8xl font-bold text-black uppercase" 
                style={{ textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 6px 6px 0px #000' }}>
              Order History
            </h1>
          </header>

          {!account ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 shadow-hard text-center max-w-md mx-auto">
              <Wallet size={48} className="mx-auto mb-6 text-accent" />
              <h2 className="font-headline text-3xl mb-4 uppercase">Sync Required</h2>
              <p className="font-bold mb-8">Connect your wallet to track your physical gear.</p>
              <CustomConnectButton className="!w-full !bg-accent !border-4 !border-black !text-white !font-black !rounded-full !shadow-hard-sm uppercase" />
            </div>
          ) : loading ? (
            <div className="h-[40vh] flex flex-col items-center justify-center gap-4 bg-white border-4 border-black rounded-3xl shadow-hard">
              <LoaderCircle size={48} className="animate-spin text-black" />
              <p className="font-black uppercase tracking-widest">Scanning Blockchain...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-4 border-black rounded-3xl p-12 text-center shadow-hard">
              <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
              <h3 className="font-headline text-2xl uppercase">System Error</h3>
              <p className="font-bold">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-16 text-center shadow-hard">
              <ShoppingBag size={64} className="mx-auto mb-6 text-gray-300" />
              <h3 className="font-headline text-4xl uppercase mb-4">No Gear Found</h3>
              <p className="font-bold mb-10 text-gray-600 uppercase">You haven't claimed any physical items yet.</p>
              <a href="/summoning">
                <Button className="bg-primary hover:bg-accent text-white border-4 border-black font-black px-12 py-8 rounded-2xl text-xl transition-brutal shadow-hard">
                  GO TO SUMMONING
                </Button>
              </a>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map(order => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div 
                    key={order.objectId} 
                    onClick={() => setSelectedOrder(order)} 
                    className="bg-white border-4 border-black rounded-2xl p-4 md:p-6 shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-brutal cursor-pointer flex flex-col md:flex-row items-center gap-6 group"
                  >
                    <div className="w-24 h-24 bg-gray-50 rounded-xl border-4 border-black flex-shrink-0 overflow-hidden relative shadow-hard-xs group-hover:rotate-2 transition-transform">
                      {order.character?.imageUrl && (
                        <Image src={order.character.imageUrl} alt="NFT" fill className="object-cover" />
                      )}
                    </div>

                    <div className="flex-grow text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="font-headline text-2xl uppercase">{order.character?.name || 'Unknown Kapogian'}</h3>
                        <span className="font-mono text-[10px] bg-gray-100 border border-black px-2 py-0.5 rounded uppercase">
                          ID: {order.objectId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold uppercase text-gray-500">
                        <div className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1"><Hash size={14}/> {(order.paymentAmount / 1_000_000_000).toFixed(2)} SUI</div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 px-6 py-3 border-4 border-black rounded-xl font-black uppercase tracking-tighter ${statusInfo.color} shadow-hard-xs`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Physical Receipt Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] overflow-y-auto bg-white border-4 border-black rounded-3xl shadow-hard p-0 antialiased selection:bg-black selection:text-white no-scrollbar">          {selectedOrder && (
            <div className="flex flex-col h-full">
              {/* Header - Fixed at top */}
              <div className="bg-black text-white p-6 md:p-8 text-center sticky top-0 z-20">
                <DialogTitle className="font-headline text-3xl md:text-4xl uppercase tracking-tight">
                  Order Receipt
                </DialogTitle>
                <p className="font-mono text-[10px] md:text-xs opacity-70 mt-2 break-all uppercase">
                  ID: {selectedOrder.objectId}
                </p>
              </div>

              {/* Body Content */}
              <div className="p-6 md:p-10 space-y-8">
                {/* Item Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="w-32 h-32 md:w-44 md:h-44 bg-gray-50 border-4 border-black rounded-2xl overflow-hidden shadow-hard-xs shrink-0 transform -rotate-2">
                    {selectedOrder.character?.imageUrl && (
                      <Image 
                        src={selectedOrder.character.imageUrl} 
                        alt="NFT" 
                        width={176} 
                        height={176} 
                        className="object-cover w-full h-full" 
                      />
                    )}
                  </div>
                  <div className="flex-grow text-center md:text-left space-y-4">
                    <div>
                      <h4 className="font-headline text-3xl md:text-4xl uppercase leading-none mb-2">
                        {selectedOrder.character?.name}
                      </h4>
                      <p className="text-sm font-black text-primary uppercase tracking-widest">
                        Verified Physical Gear
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {selectedOrder.itemsSelected.split(',').map((item, idx) => (
                        <span key={idx} className="text-xs md:text-sm font-black bg-yellow-400 border-2 border-black px-3 py-1 rounded-md shadow-hard-xs">
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing/Date Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 border-2 border-black p-4 rounded-xl text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Payment</p>
                    <p className="font-bold text-lg">{(selectedOrder.paymentAmount / 1_000_000_000).toFixed(2)} SUI</p>
                  </div>
                  <div className="bg-gray-100 border-2 border-black p-4 rounded-xl text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Mint Date</p>
                    <p className="font-bold text-lg">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Shipping Section */}
                <div className="border-t-4 border-black border-dashed pt-8">
                  <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
                    <Truck size={24} />
                    <h5 className="font-headline text-2xl uppercase">Shipping Logistics</h5>
                  </div>
                  
                  <div className="space-y-4">
                      {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
                        <div className="bg-white border-4 border-black rounded-2xl p-6 space-y-4 shadow-hard-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <span className="font-black uppercase text-xs text-gray-400">Carrier Service</span>
                              <p className="font-bold border-b-2 border-black inline-block">{selectedOrder.carrier}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-black uppercase text-xs text-gray-400">Tracking Number</span>
                              <p className="font-mono font-bold break-all">{selectedOrder.trackingNumber}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-black uppercase text-xs text-gray-400">Estimated Delivery</span>
                              <p className="font-bold">{new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-black uppercase text-xs text-gray-400">Status</span>
                              <span className={`px-2 py-0.5 border-2 border-black rounded-md font-black uppercase text-[10px] ${getStatusInfo(selectedOrder.status).color}`}>
                                {getStatusInfo(selectedOrder.status).text}
                              </span>
                            </div>
                          </div>
                          
                          {getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber) && (
                            <a href={getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber)} target="_blank" rel="noopener noreferrer" className="block pt-2">
                              <Button className="w-full h-14 bg-accent hover:bg-blue-600 text-white border-4 border-black shadow-hard-sm font-black uppercase flex items-center justify-center gap-3 group transition-brutal">
                                Track Shipment <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-400/20 border-4 border-black border-dashed rounded-2xl p-8 text-center">
                          <Package size={40} className="mx-auto mb-3 text-black opacity-50" />
                          <p className="text-sm md:text-md font-black uppercase text-black leading-snug">
                            Your gear is in production! 🧵<br/> 
                            <span className="text-xs opacity-60">We'll notify you when your tracking number is ready.</span>
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
              
              {/* Footer/Close - Fixed at bottom */}
              <div className="bg-gray-100 p-6 border-t-4 border-black text-center sticky bottom-0 z-20">
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="font-black uppercase text-sm hover:text-primary transition-colors underline decoration-2 underline-offset-4"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PageFooter />
    </div>
  );
}