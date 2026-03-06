import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_ADDRESSES, MODULES } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function timeAgo(timestamp: number | string): string {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  if (isNaN(ts)) return '';
  
  const now = Date.now();
  const seconds = Math.floor((now - ts) / 1000);

  if (seconds < 5) return 'just now';

  let interval = seconds / 31536000;
  if (interval > 1) {
    const years = Math.floor(interval);
    return `${years}y ago`;
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return `${months}mo ago`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return `${days}d ago`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return `${hours}h ago`;
  }
  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return `${minutes}m ago`;
  }
  return `${Math.floor(seconds)}s ago`;
}

export async function burnShopItem(params: {
  superAdminCapId: string;
  shopItemId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::burn_shop_item`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.SHOP_REGISTRY_ID),
      tx.object(params.shopItemId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

/**
 * Whitelisted Admin: Permanently burn a delivered ShopReceipt.
 * Receipt MUST have status === 2 (delivered) before calling.
 * Removes receipt from ShopReceiptRegistry on-chain.
 */
export async function burnShopReceipt(params: {
  shopReceiptId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::burn_shop_receipt`,
    arguments: [
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.object(CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID),
      tx.object(params.shopReceiptId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}