'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { suiClient, getOwnedReceipts } from '@/lib/sui';
import { getIPFSGatewayUrl } from '@/lib/pinata';
import { LoaderCircle, ShieldAlert, Package, Truck, CheckCircle, Wallet, ClipboardList } from 'lucide-react';
import { ORDER_STATUS } from '@/lib/constants';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageHeader } from '@/components/kapogian/page-header';

// Interface for combined Order data
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
      console.error('Failed to load orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusInfo = (status: number) => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return { text: 'Shipped', icon: <Truck className="w-5 h-5" />, color: 'bg-accent text-white' };
      case ORDER_STATUS.DELIVERED:
        return { text: 'Delivered', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-500 text-white' };
      default:
        return { text: 'Pending', icon: <Package className="w-5 h-5" />, color: 'bg-yellow-400 text-black' };
    }
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const carrierUpper = carrier.toUpperCase();
    if (carrierUpper.includes('UPS')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    }
    if (carrierUpper.includes('FEDEX')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }
    if (carrierUpper.includes('LBC')) {
        return `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`;
    }
    if (carrierUpper.includes('J&T')) {
        return `https://jtexpress.ph/tracking/${trackingNumber}`;
    }
    // Add more carriers as needed
    return '';
  }

  if (!account) {
    return (
      <div className="relative font-body text-gray-900 min-h-screen p-4 md:p-8 flex items-center justify-center antialiased selection:bg-black selection:text-white">
        <Image
            src="/images/herobg.png"
            alt="My Orders background"
            fill
            className="object-cover -z-10"
            priority
        />
        <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-hard text-center max-w-md w-full relative">
          <Wallet size={48} className="mx-auto mb-4" />
          <h2 className="font-headline text-3xl mb-4">Connect Your Wallet</h2>
          <p className="mb-6">Please connect your wallet to view your orders.</p>
          <CustomConnectButton className="!bg-accent !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-full !shadow-hard-sm hover:!bg-blue-600 !transition-brutal" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader />
      <div className="relative font-body text-gray-900 min-h-screen p-4 pt-28 md:p-8 md:pt-32 antialiased selection:bg-black selection:text-white">
        <Image
          src="/images/herobg.png"
          alt="My Orders background"
          fill
          className="object-cover -z-10"
          priority
        />
        <div className="max-w-4xl mx-auto space-y-8 relative">
          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl flex justify-center items-center p-20 text-lg gap-3 font-bold text-gray-800 shadow-hard">
              <LoaderCircle size={32} className="animate-spin" />
              <p>Loading Your Orders...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-4 border-dashed border-red-500 rounded-2xl p-8 text-center shadow-hard">
              <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
              <h3 className="font-headline text-2xl text-red-800">An Error Occurred</h3>
              <p className="text-red-700 font-bold">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-hard">
              <h3 className="font-headline text-2xl">No Orders Found</h3>
              <p className="text-gray-600 mb-6">You haven't minted any Kapogians yet.</p>
              <a href="/generate">
                  <Button className="bg-primary text-white border-2 border-black shadow-hard-sm rounded-lg">
                      Mint Your First Character
                  </Button>
              </a>
            </div>
          ) : (
            <div className="bg-white border-4 border-black rounded-3xl shadow-hard overflow-hidden">
              <div className="grid divide-y-4 divide-black">
                {orders.map(order => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <div key={order.objectId} onClick={() => setSelectedOrder(order)} className="flex flex-col md:flex-row items-center p-4 gap-4 hover:bg-yellow-50 transition-colors cursor-pointer">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-black flex-shrink-0">
                        {order.character?.imageUrl && <Image src={order.character.imageUrl} alt={order.character.name || 'Character'} width={80} height={80} className="rounded-md" />}
                      </div>
                      <div className="flex-grow text-center md:text-left">
                        <p className="font-headline text-xl">{order.character?.name || 'Loading...'}</p>
                        <p className="font-mono text-xs text-gray-500" title={order.objectId}>Receipt #{order.objectId.slice(0, 6)}...{order.objectId.slice(-4)}</p>
                      </div>
                      <div className={`${statusInfo.color} font-headline text-lg px-4 py-2 rounded-lg border-2 border-black shadow-hard-xs flex items-center gap-2`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
          <DialogContent className="max-w-md bg-white border-4 border-black rounded-2xl shadow-hard p-0">
            {selectedOrder && (
              <>
                <DialogHeader className="p-6 pb-4 border-b-4 border-black">
                  <DialogTitle className="font-headline text-2xl">Order #{selectedOrder.objectId.slice(0, 8)}</DialogTitle>
                  <DialogDescription>
                    Minted on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-black flex-shrink-0">
                      {selectedOrder.character?.imageUrl && <Image src={selectedOrder.character.imageUrl} alt={selectedOrder.character.name || 'Character'} width={96} height={96} className="rounded-md" />}
                    </div>
                    <div>
                      <p className="font-headline text-xl">{selectedOrder.character?.name}</p>
                      <p className="font-bold">Items: <span className="font-normal">{selectedOrder.itemsSelected.split(',').join(', ')}</span></p>
                      <p className="font-bold">Payment: <span className="font-normal">{(selectedOrder.paymentAmount / 1_000_000_000).toFixed(2)} SUI</span></p>
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-gray-300 my-4"></div>
                  
                  <div className="space-y-3">
                     <h4 className="font-headline text-lg">Shipping Status</h4>
                     <div className={`${getStatusInfo(selectedOrder.status).color} inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black text-sm font-bold`}>
                        {getStatusInfo(selectedOrder.status).icon}
                        {getStatusInfo(selectedOrder.status).text}
                     </div>
                     {selectedOrder.status >= ORDER_STATUS.SHIPPED && selectedOrder.trackingNumber ? (
                       <div className="bg-gray-50 border-2 border-black rounded-lg p-3 space-y-2 text-sm">
                         <div><strong>Carrier:</strong> {selectedOrder.carrier}</div>
                         <div><strong>Tracking #:</strong> {selectedOrder.trackingNumber}</div>
                         <div><strong>Est. Delivery:</strong> {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}</div>
                         {getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber) &&
                            <a href={getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber)} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" className="w-full mt-2 bg-accent text-white border-black border-2 shadow-hard-xs">Track Package</Button>
                            </a>
                         }
                       </div>
                     ) : selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
                        <p className="text-sm text-gray-500">Tracking information will be updated soon.</p>
                     ) : (
                      <p className="text-sm text-gray-500">Your order is being prepared for shipment.</p>
                     )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
