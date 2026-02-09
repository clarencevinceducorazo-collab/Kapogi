/**
 * SUI Blockchain Utilities
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { CONTRACT_ADDRESSES, MODULES, PRICING, NETWORK_CONFIG } from './constants';

// Initialize SUI client
export const suiClient = new SuiClient({ url: NETWORK_CONFIG.rpcUrl });

console.log('🔍 SUI Client URL:', NETWORK_CONFIG.rpcUrl);
console.log('🔍 Env variable:', process.env.NEXT_PUBLIC_SUI_RPC_URL);

/**
 * Mint Character NFT with Order Receipt
 */
export async function mintCharacterNFT(params: {
  name: string;
  description: string; // NOTE: This is "lore" in the contract
  imageUrl: string;
  attributes: string; // JSON string
  mmr: number;
  itemsSelected: string;
  signAndExecute: any; // From wallet hook
}) {
  try {
    console.log('🎨 Creating mint transaction...');

    const tx = new Transaction();

    // Split 20 SUI for payment (in MIST)
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(PRICING.BASE_MINT)]);

    // Get Clock object (0x6)
    const clock = tx.object('0x6');

    // Get shared MintCounter object
    const mintCounter = tx.object(CONTRACT_ADDRESSES.MINT_COUNTER_ID);

    // Call mint_character function
    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::mint_character`,
      arguments: [
        mintCounter, // Shared object
        coin,
        tx.pure.string(params.name),
        tx.pure.string(params.description), // This maps to "lore" in contract
        tx.pure.string(params.imageUrl),
        tx.pure.string(params.attributes),
        tx.pure.u64(params.mmr),
        tx.pure.string(params.itemsSelected),
        clock,
      ],
    });

    console.log('📝 Executing transaction...');

    // Sign and execute with correct format
    const result = await params.signAndExecute(
      {
        transaction: tx,
      },
      {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      }
    );

    console.log('✅ Mint successful!', result);
    return result;
  } catch (error) {
    console.error('❌ Mint failed:', error);
    throw error;
  }
}

/**
 * Upgrade to bundle (additional 10 SUI)
 */
export async function upgradeToBundleNFT(params: {
  receiptId: string;
  signAndExecute: any;
}) {
  try {
    console.log('🎁 Creating bundle upgrade transaction...');

    const tx = new Transaction();

    // Split 10 SUI for upgrade payment
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(PRICING.BUNDLE_UPGRADE)]);

    // Call upgrade_to_bundle function
    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::upgrade_to_bundle`,
      arguments: [
        tx.object(params.receiptId),
        coin,
      ],
    });

    console.log('📝 Executing upgrade transaction...');

    const result = await params.signAndExecute(
      {
        transaction: tx,
      },
      {
        showEffects: true,
        showObjectChanges: true,
      }
    );

    console.log('✅ Upgrade successful!', result);
    return result;
  } catch (error) {
    console.error('❌ Upgrade failed:', error);
    throw error;
  }
}

/**
 * Get owned Character NFTs for a wallet
 */
export async function getOwnedCharacters(walletAddress: string) {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::Character`,
      },
      options: {
        showContent: true,
        showDisplay: true,
      },
    });

    return objects.data;
  } catch (error) {
    console.error('Failed to fetch owned characters:', error);
    return [];
  }
}

/**
 * Get owned Order Receipts for a wallet
 */
export async function getOwnedReceipts(walletAddress: string) {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::OrderReceipt`,
      },
      options: {
        showContent: true,
      },
    });

    return objects.data;
  } catch (error) {
    console.error('Failed to fetch receipts:', error);
    return [];
  }
}

/**
 * Admin: Get all Order Receipts from events for the admin dashboard
 */
export async function getAllReceipts() {
  try {
    console.log('🔍 Fetching all order creation events...');
    let allReceiptIds: string[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    // Paginate through all events to find every single receipt
    while (hasNextPage) {
      const page: any = await suiClient.queryEvents({
        query: { MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated` },
        cursor: cursor,
        order: 'ascending',
      });

      const pageReceiptIds = page.data.map((event: any) => event.parsedJson?.receipt_id).filter(Boolean);
      allReceiptIds.push(...pageReceiptIds);
      
      if (page.hasNextPage && page.nextCursor) {
        cursor = page.nextCursor;
      } else {
        hasNextPage = false;
      }
    }
    
    if (allReceiptIds.length === 0) {
      console.log('No ReceiptCreated events found.');
      return [];
    }

    console.log(`✨ Found ${allReceiptIds.length} total receipt events. Fetching object details...`);

    // Fetch objects in chunks to avoid overwhelming the RPC
    const receipts = [];
    const chunkSize = 50; // Sui's multiGetObjects has a limit of 50
    for (let i = 0; i < allReceiptIds.length; i += chunkSize) {
        const chunk = allReceiptIds.slice(i, i + chunkSize);
        const chunkReceipts = await suiClient.multiGetObjects({
            ids: chunk,
            options: { showContent: true }
        });
        receipts.push(...chunkReceipts);
    }
    
    return receipts.filter(r => r.data); // Filter out any that failed to fetch or were deleted

  } catch (error) {
    console.error('Failed to fetch all receipts via events:', error);
    return [];
  }
}


/**
 * Admin: Mark receipt as shipped
 */
export async function markAsShipped(params: {
  receiptObjectId: string;
  signAndExecute: any;
}) {
  try {
    const tx = new Transaction();

    const adminCap = tx.object(CONTRACT_ADDRESSES.ADMIN_CAP_ID);
    const receipt = tx.object(params.receiptObjectId);
    const clock = tx.object('0x6');

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_as_shipped`,
      arguments: [adminCap, receipt, clock],
    });

    const result = await params.signAndExecute(
      {
        transaction: tx,
      },
      {
        showEffects: true,
      }
    );

    console.log('✅ Marked as shipped!', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to mark as shipped:', error);
    throw error;
  }
}

/**
 * Admin: Mark receipt as delivered
 */
export async function markAsDelivered(params: {
  receiptObjectId: string;
  signAndExecute: any;
}) {
  try {
    const tx = new Transaction();

    const adminCap = tx.object(CONTRACT_ADDRESSES.ADMIN_CAP_ID);
    const receipt = tx.object(params.receiptObjectId);
    const clock = tx.object('0x6');

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_as_delivered`,
      arguments: [adminCap, receipt, clock],
    });

    const result = await params.signAndExecute(
      {
        transaction: tx,
      },
      {
        showEffects: true,
      }
    );

    console.log('✅ Marked as delivered!', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to mark as delivered:', error);
    throw error;
  }
}

/**
 * Admin: Add tracking information to an order receipt
 */
export async function addTrackingInfo(params: {
  receiptObjectId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number; // as timestamp
  signAndExecute: any;
}) {
  try {
    console.log('🚚 Adding tracking info transaction...');

    const tx = new Transaction();

    const adminCap = tx.object(CONTRACT_ADDRESSES.ADMIN_CAP_ID);
    const receipt = tx.object(params.receiptObjectId);
    const clock = tx.object('0x6');

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::add_tracking_information`,
      arguments: [
        adminCap,
        receipt,
        tx.pure.string(params.trackingNumber),
        tx.pure.string(params.carrier),
        tx.pure.u64(params.estimatedDelivery),
        clock,
      ],
    });

    console.log('📝 Executing tracking info transaction...');

    const result = await params.signAndExecute(
      {
        transaction: tx,
      },
      {
        showEffects: true,
      }
    );

    console.log('✅ Tracking info added!', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to add tracking info:', error);
    throw error;
  }
}
