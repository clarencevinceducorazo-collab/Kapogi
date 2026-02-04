'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  LockKeyhole,
  Key,
  ShieldCheck,
  ShieldAlert,
  LockOpen,
  Truck,
  CheckCircle,
  FileText,
  Home,
  LoaderCircle,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { getOwnedReceipts, markAsShipped, addTrackingInfo } from '@/lib/sui';
import { decryptShippingInfo, type ShippingInfo } from '@/lib/encryption';
import { ADMIN_ADDRESS, ORDER_STATUS } from '@/lib/constants';

interface Receipt {
  objectId: string;
  nftId: string;
  buyer: string;
  itemsSelected: string;
  encryptedShippingInfo: string;
  status: number;
  paymentAmount: number;
  createdAt: number;
  // New tracking fields
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
}

type DecryptedCard = ShippingInfo & {
  id: string; // Using receipt objectId as id
};

export default function AdminPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const isAdmin = account?.address === ADMIN_ADDRESS;

  const [adminPrivateKey, setAdminPrivateKey] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [decryptedCards, setDecryptedCards] = useState<DecryptedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for Add Tracking modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estDeliveryDate, setEstDeliveryDate] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadReceipts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError('');
      // Using the admin wallet to fetch all receipts.
      const owned = await getOwnedReceipts(ADMIN_ADDRESS);

      const parsed: Receipt[] = owned
        .map((obj: any) => ({
          objectId: obj.data.objectId,
          nftId: obj.data.content.fields.nft_id,
          buyer: obj.data.content.fields.buyer,
          itemsSelected: obj.data.content.fields.items_selected,
          encryptedShippingInfo: obj.data.content.fields.encrypted_shipping_info,
          status: Number(obj.data.content.fields.status),
          paymentAmount: Number(obj.data.content.fields.payment_amount),
          createdAt: Number(obj.data.content.fields.created_at),
          trackingNumber: obj.data.content.fields.tracking_number || '',
          carrier: obj.data.content.fields.carrier || '',
          estimatedDelivery: Number(obj.data.content.fields.estimated_delivery || 0),
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Sort by most recent

      setReceipts(parsed);
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrackingModal = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setTrackingNumber(receipt.trackingNumber || '');
    setCarrier(receipt.carrier || '');
    setEstDeliveryDate(receipt.estimatedDelivery ? new Date(receipt.estimatedDelivery).toISOString().split('T')[0] : '');
    setTrackingModalOpen(true);
  };
  
  const handleSaveTracking = async () => {
    if (!selectedReceipt || !trackingNumber || !carrier || !estDeliveryDate) {
      alert("All tracking fields are required.");
      return;
    }
    
    setIsSavingTracking(true);
    try {
      await addTrackingInfo({
        receiptObjectId: selectedReceipt.objectId,
        trackingNumber,
        carrier,
        estimatedDelivery: new Date(estDeliveryDate).getTime(),
        signAndExecute,
      });
      alert('Tracking information saved successfully!');
      setTrackingModalOpen(false);
      loadReceipts(); // Refresh the list
    } catch (e) {
      console.error(e);
      alert('Failed to save tracking info. Please try again.');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleToggleDecrypt = async (receipt: Receipt) => {
    const isDecrypted = decryptedCards.some(card => card.id === receipt.objectId);

    if (isDecrypted) {
      setDecryptedCards(decryptedCards.filter(card => card.id !== receipt.objectId));
    } else {
      if (!adminPrivateKey) {
        alert('Please enter the Admin Private Key first!');
        return;
      }
      try {
        const decryptedInfo = await decryptShippingInfo(receipt.encryptedShippingInfo, adminPrivateKey);
        const newCard: DecryptedCard = { id: receipt.objectId, ...decryptedInfo };
        setDecryptedCards(prev => [newCard, ...prev]);
        setError('');
      } catch (e) {
        console.error(e);
        alert('Decryption failed. Please check your private key and try again.');
      }
    }
  };

  const handleMarkShipped = async (receiptId: string) => {
    try {
      await markAsShipped({ receiptObjectId: receiptId, signAndExecute });
      alert('Order status updated to Shipped!');
      loadReceipts();
    } catch (e) {
      console.error(e);
      alert('Failed to mark as shipped. Please try again.');
    }
  };
  
    if (!account) {
        return (
            <div className="bg-pattern font-body text-gray-900 min-h-screen p-4 md:p-8 antialiased selection:bg-black selection:text-white flex items-center justify-center">
                 <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-hard text-center max-w-md w-full">
                    <h2 className="font-headline text-3xl mb-4">Admin Access</h2>
                    <p className="mb-6">Please connect your wallet to continue.</p>
                    <CustomConnectButton 
                        className="!bg-accent !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-full !shadow-hard-sm hover:!bg-blue-600 !transition-brutal"
                    />
                </div>
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <div className="bg-pattern font-body text-gray-900 min-h-screen p-4 md:p-8 antialiased selection:bg-black selection:text-white flex items-center justify-center">
                <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-hard text-center max-w-md w-full">
                    <ShieldAlert size={48} className="mx-auto mb-4 text-red-500"/>
                    <h2 className="font-headline text-3xl mb-4">Access Denied</h2>
                    <p className="mb-2">This page is for administrators only.</p>
                    <p className="text-sm text-gray-500 font-mono">Your address: {account.address}</p>
                </div>
            </div>
        );
    }

  return (
    <div className="bg-pattern font-body text-gray-900 min-h-screen p-4 md:p-8 antialiased selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="bg-white border-4 border-black rounded-full p-3 px-6 flex flex-col md:flex-row justify-between items-center shadow-hard gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-full flex items-center justify-center">
              <Box size={24} />
            </div>
            <h1 className="font-headline text-3xl tracking-tight text-black uppercase">Admin Dashboard</h1>
          </div>
          <Link href="/" className="font-headline text-lg flex items-center gap-2 hover:underline">
            <Home className="w-6 h-6" /> Home
          </Link>
          <CustomConnectButton
            className="!bg-[#60A5FA] !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-full !shadow-hard-sm hover:!bg-[#3B82F6] !transition-brutal"
            connectedClassName="!bg-[#60A5FA] !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-full !shadow-hard-sm hover:!bg-[#3B82F6] !transition-brutal"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-hard relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full border-4 border-black flex items-center justify-center transform rotate-12 z-0 opacity-20">
                <LockKeyhole size={40} className="text-black" />
              </div>

              <div className="relative z-10">
                <h2 className="font-headline text-2xl mb-4 tracking-tight">Private Key <span className="text-gray-400 text-lg block font-body font-bold mt-1">(Decryption)</span></h2>

                <label className="block font-bold mb-2 text-lg">Enter Admin Key</label>
                <div className="relative">
                  <Input
                    type="password"
                    id="adminKey"
                    placeholder="Paste key here..."
                    value={adminPrivateKey}
                    onChange={(e) => setAdminPrivateKey(e.target.value)}
                    className="w-full bg-gray-50 border-4 border-black rounded-xl px-4 py-3 text-lg font-bold outline-none focus:bg-yellow-100/50 focus:border-yellow-500 transition-colors placeholder:text-gray-400 !h-auto"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Key size={24} />
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 bg-blue-50 border-2 border-black border-dashed rounded-xl p-3">
                  <ShieldCheck size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold leading-tight text-blue-900">Secure Environment</p>
                    <p className="text-xs font-semibold text-blue-700 mt-1">Your private key is never sent to any server. Local decryption only.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border-4 border-black rounded-3xl shadow-hard overflow-hidden flex flex-col">
              <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNGRjZCNkIiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')" }}>
                <h2 className="font-headline text-2xl tracking-tight">Orders ({receipts.length})</h2>
                <div className="px-3 py-1 bg-yellow-300 border-2 border-black rounded-lg text-xs font-black uppercase">
                  Admin View
                </div>
              </div>

              {loading ? (
                <div className="p-12 flex justify-center items-center gap-2 text-gray-500">
                  <LoaderCircle className="animate-spin" /> Loading orders...
                </div>
              ) : receipts.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No orders to display.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b-4 border-black text-sm uppercase font-black tracking-wider">
                        <th className="p-4 px-6">Order NFT</th>
                        <th className="p-4 px-6">Items</th>
                        <th className="p-4 px-6">Status</th>
                        <th className="p-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-base font-bold">
                      {receipts.map((receipt) => {
                        const isDecrypted = decryptedCards.some(card => card.id === receipt.objectId);
                        return (
                          <tr key={receipt.objectId} className="group border-b-2 border-gray-200 hover:bg-yellow-50 transition-colors last:border-b-0">
                            <td className="p-4 px-6 font-mono" title={receipt.nftId}>{receipt.nftId.slice(0, 6)}...{receipt.nftId.slice(-4)}</td>
                            <td className="p-4 px-6">
                              <div className="flex flex-wrap gap-2">
                                {receipt.itemsSelected.split(',').map(item => (
                                  <span key={item} className={`px-2 py-1 border-2 border-black rounded shadow-hard-xs text-xs font-black ${item === 'ALL_BUNDLE' ? 'bg-primary text-white' : 'bg-white'}`}>{item}</span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 px-6">
                              {receipt.status === ORDER_STATUS.PENDING ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-yellow-300 text-black text-xs font-black uppercase shadow-sm">
                                  <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                                  Pending
                                </span>
                              ) : receipt.status === ORDER_STATUS.SHIPPED ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-accent text-white text-xs font-black uppercase shadow-sm">
                                  <Truck className="w-4 h-4" />
                                  Shipped
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-green-500 text-white text-xs font-black uppercase shadow-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Delivered
                                </span>
                              )}
                            </td>
                            <td className="p-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => handleToggleDecrypt(receipt)}
                                  className={`text-white px-3 py-1.5 rounded-lg border-2 border-black shadow-hard-sm shadow-hard-hover active:shadow-hard-active transition-brutal text-sm font-black flex items-center gap-2 h-auto ${isDecrypted ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'}`}>
                                  {isDecrypted ? <LockKeyhole className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                                  {isDecrypted ? 'Hide' : 'Decrypt'}
                                </Button>
                                <Button onClick={() => handleMarkShipped(receipt.objectId)} disabled={receipt.status !== ORDER_STATUS.PENDING} className="bg-accent hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg border-2 border-black shadow-hard-sm shadow-hard-hover active:shadow-hard-active transition-brutal text-sm font-black flex items-center gap-2 h-auto disabled:bg-gray-300 disabled:cursor-not-allowed">
                                  <Truck className="w-4 h-4" />
                                  Ship
                                </Button>
                                <Button onClick={() => handleOpenTrackingModal(receipt)} disabled={receipt.status === ORDER_STATUS.PENDING} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg border-2 border-black shadow-hard-sm shadow-hard-hover active:shadow-hard-active transition-brutal text-sm font-black flex items-center gap-2 h-auto disabled:bg-gray-300 disabled:cursor-not-allowed">
                                  <ClipboardList className="w-4 h-4" />
                                  Tracking
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div id="decryptedSection" className="bg-white border-4 border-black rounded-3xl p-6 shadow-hard relative min-h-[200px] transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full border-2 border-black flex items-center justify-center text-white">
                  <FileText size={24} />
                </div>
                <h2 className="font-headline text-2xl tracking-tight">Decrypted Shipping Information</h2>
              </div>

              {decryptedCards.length === 0 ? (
                <div id="emptyState" className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <ShieldAlert size={48} className="mb-2" />
                  <p className="font-bold text-lg">No data decrypted yet.</p>
                  <p className="text-sm">Enter your Private Key and click "Decrypt" on an order.</p>
                </div>
              ) : (
                <div id="cardsContainer" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {decryptedCards.map(card => (
                    <div key={card.id} className="bg-yellow-100/50 border-2 border-black rounded-xl p-5 shadow-hard-xs relative animate-fadeIn hover:bg-yellow-100/80 transition-colors">
                      <div className="absolute -top-3 -right-3 bg-purple-500 text-white border-2 border-black rounded-full w-8 h-8 flex items-center justify-center z-10 font-bold text-xs shadow-sm">
                        #{card.id.slice(2, 6)}
                      </div>
                      <div className="space-y-3 font-mono text-sm md:text-base">
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase text-gray-500 mb-0.5">Name:</span>
                          <span className="font-bold text-gray-900 border-b border-black border-dashed pb-1">{card.full_name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase text-gray-500 mb-0.5">Address:</span>
                          <span className="font-bold text-gray-900 border-b border-black border-dashed pb-1 leading-tight">
                            {card.address}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase text-gray-500 mb-0.5">Phone:</span>
                          <span className="font-bold text-gray-900 pb-1">{card.contact_number}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Tracking Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-4 border-black rounded-2xl shadow-hard">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Add/Edit Tracking Info</DialogTitle>
            <DialogDescription>
              For Order #{selectedReceipt?.objectId.slice(0, 6)}...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="font-bold">Tracking Number</label>
                <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. 1Z999AA10123456784" className="border-2 border-black rounded-lg" />
            </div>
            <div className="space-y-2">
                <label className="font-bold">Carrier</label>
                <Input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="e.g. UPS, FedEx, LBC" className="border-2 border-black rounded-lg" />
            </div>
            <div className="space-y-2">
                <label className="font-bold">Estimated Delivery Date</label>
                <Input type="date" value={estDeliveryDate} onChange={e => setEstDeliveryDate(e.target.value)} className="border-2 border-black rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTrackingModalOpen(false)} variant="outline" className="border-2 border-black rounded-lg shadow-hard-sm">Cancel</Button>
            <Button onClick={handleSaveTracking} disabled={isSavingTracking} className="bg-teal-500 hover:bg-teal-600 text-white border-2 border-black rounded-lg shadow-hard-sm">
                {isSavingTracking ? <LoaderCircle className="animate-spin" /> : 'Save Tracking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
