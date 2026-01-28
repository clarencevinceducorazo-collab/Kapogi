'use client';

import { useState } from 'react';
import {
  Box,
  ChevronDown,
  LockKeyhole,
  Key,
  ShieldCheck,
  ShieldAlert,
  LockOpen,
  Truck,
  CheckCircle,
  FileText,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import Link from 'next/link';

// Mock Data for Decryption
const mockData: Record<string, { name: string; address: string; phone: string }> = {
    '0x131a...4f91': {
        name: "Josh",
        address: "73 bahay ni josh, sa dagupan, pangasinan",
        phone: "number ni josh"
    },
    '0xa92b...c221': {
        name: "Maria Clara",
        address: "Unit 404, Rizal Tower, Metro Manila",
        phone: "0998-765-4321"
    },
    '0x77f2...110a': {
        name: "Jose Rizal",
        address: "Calle Real, Calamba, Laguna",
        phone: "0917-111-2222"
    }
};

const initialOrders = [
    { id: 1, hash: '0x131a...4f91', items: ['MOUSEPAD'], status: 'Pending' },
    { id: 2, hash: '0xa92b...c221', items: ['ALL_BUNDLE'], status: 'Pending' },
    { id: 3, hash: '0x77f2...110a', items: ['SHIRT'], status: 'Shipped' },
];

type DecryptedCard = {
    id: number;
    name: string;
    address: string;
    phone: string;
};

export default function AdminPage() {
    const account = useCurrentAccount();
    const [adminKey, setAdminKey] = useState('');
    const [orders, setOrders] = useState(initialOrders);
    const [decryptedCards, setDecryptedCards] = useState<DecryptedCard[]>([]);

    const decryptOrder = (id: number, hash: keyof typeof mockData) => {
        if (adminKey.length === 0) {
            alert("Please enter the Admin Private Key first!");
            return;
        }

        const data = mockData[hash];
        if (!data) return;

        const existingCards = decryptedCards.filter(card => card.id !== id);
        const newCard = { id, ...data };
        setDecryptedCards([newCard, ...existingCards]);
    };

    const markShipped = (id: number) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === id ? { ...order, status: 'Shipped' } : order
            )
        );
    };

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
                                        value={adminKey}
                                        onChange={(e) => setAdminKey(e.target.value)}
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
                            <div className="p-6 border-b-4 border-black bg-white flex justify-between items-center" style={{backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNGRjZCNkIiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')"}}>
                                <h2 className="font-headline text-2xl tracking-tight">Orders ({orders.length})</h2>
                                <div className="px-3 py-1 bg-yellow-300 border-2 border-black rounded-lg text-xs font-black uppercase">
                                    Admin View
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 border-b-4 border-black text-sm uppercase font-black tracking-wider">
                                            <th className="p-4 px-6">Order Hash</th>
                                            <th className="p-4 px-6">Items</th>
                                            <th className="p-4 px-6">Status</th>
                                            <th className="p-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-base font-bold">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="group border-b-2 border-gray-200 hover:bg-yellow-50 transition-colors last:border-b-0">
                                                <td className="p-4 px-6 font-mono">{order.hash}</td>
                                                <td className="p-4 px-6">
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.items.map(item => (
                                                            <span key={item} className={`px-2 py-1 border-2 border-black rounded shadow-hard-xs text-xs font-black ${item === 'ALL_BUNDLE' ? 'bg-primary text-white' : 'bg-white'}`}>{item}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 px-6">
                                                    {order.status === 'Pending' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-yellow-300 text-black text-xs font-black uppercase shadow-sm">
                                                            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                                                            Pending
                                                        </span>
                                                    ) : (
                                                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-accent text-white text-xs font-black uppercase shadow-sm">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Shipped
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button onClick={() => decryptOrder(order.id, order.hash)} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded-lg border-2 border-black shadow-hard-sm shadow-hard-hover active:shadow-hard-active transition-brutal text-sm font-black flex items-center gap-2 h-auto">
                                                            <LockOpen className="w-4 h-4" />
                                                            Decrypt
                                                        </Button>
                                                        <Button onClick={() => markShipped(order.id)} disabled={order.status === 'Shipped'} className="bg-accent hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg border-2 border-black shadow-hard-sm shadow-hard-hover active:shadow-hard-active transition-brutal text-sm font-black flex items-center gap-2 h-auto disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-400 disabled:shadow-none disabled:hover:bg-gray-300">
                                                            <Truck className="w-4 h-4" />
                                                            Ship
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                                                {card.id}
                                            </div>
                                            <div className="space-y-3 font-mono text-sm md:text-base">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-xs uppercase text-gray-500 mb-0.5">Name:</span>
                                                    <span className="font-bold text-gray-900 border-b border-black border-dashed pb-1">{card.name}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-xs uppercase text-gray-500 mb-0.5">Address:</span>
                                                    <span className="font-bold text-gray-900 border-b border-black border-dashed pb-1 leading-tight">{card.address}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-xs uppercase text-gray-500 mb-0.5">Phone:</span>
                                                    <span className="font-bold text-gray-900 pb-1">{card.phone}</span>
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
        </div>
    );
}
