/**
 * SUI Blockchain Utilities - FIXED
 */

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { CONTRACT_ADDRESSES, MODULES, PRICING, NETWORK_CONFIG } from './constants';
import type { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Initialize SUI client
export const suiClient = new SuiClient({ url: NETWORK_CONFIG.rpcUrl });

/**
 * Mint Character NFT with Order Receipt
 */
export async function mintCharacterNFT(params: {
  name: string;
  description: string;
  imageUrl: string;
  attributes: string; // JSON string
  itemsSelected: string;
  encryptedShippingInfo: string;
  encryptionPubkey: string;
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutateAsync'];
}) {
  try {
    console.log('🎨 Creating mint transaction...');
    
    const tx = new TransactionBlock();
    
    // The payment amount needs to be a valid u64 string for the `pure` command.
    // Explicitly converting to a string is safer for large numbers.
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(String(PRICING.BASE_MINT))]);
    
    // Get Clock object (0x6)
    const clock = tx.object('0x6');
    
    // Get shared MintCounter object
    const mintCounter = tx.object(CONTRACT_ADDRESSES.MINT_COUNTER_ID);
    
    // Call mint_character function
    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::mint_character`,
      arguments: [
        mintCounter,
        coin,
        tx.pure(params.name),
        tx.pure(params.description),
        tx.pure(params.imageUrl),
        tx.pure(params.attributes),
        tx.pure(params.itemsSelected),
        tx.pure(params.encryptedShippingInfo),
        tx.pure(params.encryptionPubkey),
        clock,
      ],
    });
    
    console.log('📝 Executing transaction...');
    
    // The `signAndExecute` hook from `@mysten/dapp-kit` expects a single object
    // with a `transaction` property of type `TransactionBlock`.
    const result = await params.signAndExecute({
        transaction: tx,
        options: {
            showEffects: true,
            showObjectChanges: true,
            showEvents: true,
        },
    });
    
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
  newEncryptedShippingInfo: string;
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutateAsync'];
}) {
  try {
    console.log('🎁 Creating bundle upgrade transaction...');
    
    const tx = new TransactionBlock();
    
    // Split 10 SUI for upgrade payment
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(String(PRICING.BUNDLE_UPGRADE))]);
    
    // Call upgrade_to_bundle function
    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::upgrade_to_bundle`,
      arguments: [
        tx.object(params.receiptId),
        coin,
        tx.pure(params.newEncryptedShippingInfo),
      ],
    });
    
    console.log('📝 Executing upgrade transaction...');
    
    const result = await params.signAndExecute({
        transaction: tx,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });
    
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
 * Admin: Mark receipt as shipped
 */
export async function markAsShipped(params: {
  receiptObjectId: string;
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutateAsync'];
}) {
  try {
    const tx = new TransactionBlock();
    
    const adminCap = tx.object(CONTRACT_ADDRESSES.ADMIN_CAP_ID);
    const receipt = tx.object(params.receiptObjectId);
    const clock = tx.object('0x6');
    
    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_as_shipped`,
      arguments: [adminCap, receipt, clock],
    });
    
    const result = await params.signAndExecute({
        transaction: tx,
        options: {
            showEffects: true,
        }
    });
    
    console.log('✅ Marked as shipped!', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to mark as shipped:', error);
    throw error;
  }
}
