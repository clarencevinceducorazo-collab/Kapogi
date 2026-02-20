/**
 * SUI Blockchain Utilities
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { CONTRACT_ADDRESSES, MODULES, PRICING, NETWORK_CONFIG } from './constants';

export const suiClient = new SuiClient({ url: NETWORK_CONFIG.rpcUrl });

console.log('🔍 SUI Client URL:', NETWORK_CONFIG.rpcUrl);

// ─────────────────────────────────────────────
// Role Detection (on-chain, no hardcoded wallets)
// ─────────────────────────────────────────────

/**
 * Check if a wallet is in the AdminRegistry whitelist.
 * Returns true for both regular admins AND super admin (super admin
 * operates separately via SuperAdminCap object, not the registry).
 */
export async function checkIsAdmin(walletAddress: string): Promise<boolean> {
  try {
    const registryObj = await suiClient.getObject({
      id: CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID,
      options: { showContent: true },
    });

    const fields = (registryObj.data?.content as any)?.fields;
    if (!fields) return false;

    const admins: string[] = fields.admins ?? [];
    return admins.map((a) => a.toLowerCase()).includes(walletAddress.toLowerCase());
  } catch (e) {
    console.error('Failed to check admin status:', e);
    return false;
  }
}

/**
 * Check if a wallet holds the SuperAdminCap object.
 * This is the source of truth for super admin access — no env variable needed.
 */
export async function checkIsSuperAdmin(walletAddress: string): Promise<boolean> {
  try {
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::admin::SuperAdminCap`,
      },
    });
    return ownedObjects.data.length > 0;
  } catch (e) {
    console.error('Failed to check super admin status:', e);
    return false;
  }
}

/**
 * Fetch AdminRegistry fields for the super admin panel.
 */
export async function getAdminRegistryInfo(): Promise<{
  admins: string[];
  mintPaused: boolean;
  pauseReason: string;
} | null> {
  try {
    const registryObj = await suiClient.getObject({
      id: CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID,
      options: { showContent: true },
    });

    const fields = (registryObj.data?.content as any)?.fields;
    if (!fields) return null;

    return {
      admins: fields.admins ?? [],
      mintPaused: fields.mint_paused ?? false,
      pauseReason: fields.pause_reason ?? '',
    };
  } catch (e) {
    console.error('Failed to fetch registry info:', e);
    return null;
  }
}

/**
 * Fetch TreasuryConfig fields for the super admin panel.
 */
export async function getTreasuryConfigInfo(): Promise<{
  treasuryAddress: string;
  baseMintPrice: number;
  bundleUpgradePrice: number;
} | null> {
  try {
    const configObj = await suiClient.getObject({
      id: CONTRACT_ADDRESSES.TREASURY_CONFIG_ID,
      options: { showContent: true },
    });

    const fields = (configObj.data?.content as any)?.fields;
    if (!fields) return null;

    return {
      treasuryAddress: fields.treasury_address,
      baseMintPrice: Number(fields.base_mint_price),
      bundleUpgradePrice: Number(fields.bundle_upgrade_price),
    };
  } catch (e) {
    console.error('Failed to fetch treasury config:', e);
    return null;
  }
}

// ─────────────────────────────────────────────
// Super Admin Transactions
// ─────────────────────────────────────────────

export async function superAdminAddAdmin(params: {
  superAdminCapId: string;
  newAdminAddress: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::add_admin`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.pure.address(params.newAdminAddress),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function superAdminRemoveAdmin(params: {
  superAdminCapId: string;
  adminAddress: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::remove_admin`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.pure.address(params.adminAddress),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function superAdminPauseMinting(params: {
  superAdminCapId: string;
  reason: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::pause_minting`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.pure.string(params.reason),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function superAdminUnpauseMinting(params: {
  superAdminCapId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::unpause_minting`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function superAdminUpdateTreasury(params: {
  superAdminCapId: string;
  newTreasuryAddress: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_treasury_address`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.TREASURY_CONFIG_ID),
      tx.pure.address(params.newTreasuryAddress),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function superAdminUpdateMintPrice(params: {
  superAdminCapId: string;
  newPrice: number; // in MIST
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_base_mint_price`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.TREASURY_CONFIG_ID),
      tx.pure.u64(params.newPrice),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function superAdminUpdateBundlePrice(params: {
  superAdminCapId: string;
  newPrice: number; // in MIST
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_bundle_upgrade_price`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(CONTRACT_ADDRESSES.TREASURY_CONFIG_ID),
      tx.pure.u64(params.newPrice),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

// ─────────────────────────────────────────────
// Mint Character NFT
// ─────────────────────────────────────────────

export async function mintCharacterNFT(params: {
  name: string;
  description: string;
  imageUrl: string;
  attributes: string;
  mmr: number;
  itemsSelected: string;
  encryptedShippingInfo: string;
  encryptionPubkey: string;
  walletAddress: string;
  signAndExecute: any;
}) {
  try {
    const tx = new Transaction();
    const sender = params.walletAddress;
    console.log('🎨 Preparing mint transaction for address:', sender);

    const ownedObjects = await suiClient.getOwnedObjects({
      owner: sender,
      filter: { StructType: '0x2::kiosk::KioskOwnerCap' },
      options: { showContent: true },
    });

    const kioskCapObject = ownedObjects.data.find((obj) => obj.data);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(PRICING.BASE_MINT)]);
    const clock = tx.object('0x6');
    const mintCounter = tx.object(CONTRACT_ADDRESSES.MINT_COUNTER_ID);
    const transferPolicy = tx.object(CONTRACT_ADDRESSES.TRANSFER_POLICY_ID);
    const adminRegistry = tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID);
    const treasuryConfig = tx.object(CONTRACT_ADDRESSES.TREASURY_CONFIG_ID);

    const commonArgs = [
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.pure.string(params.imageUrl),
      tx.pure.string(params.attributes),
      tx.pure.u64(params.mmr),
      tx.pure.string(params.itemsSelected),
      tx.pure.string(params.encryptedShippingInfo),
      tx.pure.string(params.encryptionPubkey),
    ];

    if (kioskCapObject && kioskCapObject.data?.content?.dataType === 'moveObject') {
      console.log('✅ Existing KioskOwnerCap found. Using mint_to_existing_kiosk.');
      const kioskCapId = kioskCapObject.data.objectId;
      const kioskId = (kioskCapObject.data.content.fields as any).for;
      if (!kioskId) throw new Error('Could not determine kioskId from KioskOwnerCap');

      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::mint_to_existing_kiosk`,
        arguments: [
          mintCounter,
          coin,
          ...commonArgs,
          tx.object(kioskId),
          tx.object(kioskCapId),
          transferPolicy,
          adminRegistry,
          treasuryConfig,
          clock,
        ],
      });
    } else {
      console.log('ℹ️ No kiosk found. Using mint_character to create a new one.');
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::mint_character`,
        arguments: [
          mintCounter,
          coin,
          ...commonArgs,
          transferPolicy,
          adminRegistry,
          treasuryConfig,
          clock,
        ],
      });
    }

    console.log('📝 Executing transaction...');
    const result = await params.signAndExecute(
      { transaction: tx },
      { showEffects: true, showObjectChanges: true, showEvents: true },
    );

    console.log('✅ Mint successful!', result);
    return result;
  } catch (error) {
    console.error('❌ Mint failed:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// Bundle Upgrade
// ─────────────────────────────────────────────

export async function upgradeToBundleNFT(params: {
  receiptId: string;
  newEncryptedShippingInfo: string;
  signAndExecute: any;
}) {
  try {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(PRICING.BUNDLE_UPGRADE)]);
    const clock = tx.object('0x6');

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.CHARACTER_NFT}::upgrade_to_bundle`,
      arguments: [
        tx.object(params.receiptId),
        coin,
        tx.pure.string(params.newEncryptedShippingInfo),
        tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
        tx.object(CONTRACT_ADDRESSES.TREASURY_CONFIG_ID),
        clock,
      ],
    });

    const result = await params.signAndExecute(
      { transaction: tx },
      { showEffects: true, showObjectChanges: true },
    );

    console.log('✅ Upgrade successful!', result);
    return result;
  } catch (error) {
    console.error('❌ Upgrade failed:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export async function getOwnedCharacters(walletAddress: string): Promise<SuiObjectResponse[]> {
  try {
    const allMintEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::CharacterMinted`,
      },
      order: 'descending',
    });

    const userMintEvents = allMintEvents.data.filter(
      (event) => (event.parsedJson as any)?.owner === walletAddress,
    );

    const nftIds = userMintEvents
      .map((event) => (event.parsedJson as any)?.nft_id)
      .filter(Boolean);
    if (nftIds.length === 0) return [];

    const characterObjects: SuiObjectResponse[] = [];
    for (let i = 0; i < nftIds.length; i += 50) {
      const chunk = nftIds.slice(i, i + 50);
      const chunkObjects = await suiClient.multiGetObjects({
        ids: chunk,
        options: { showContent: true, showOwner: true, showDisplay: true },
      });
      characterObjects.push(...chunkObjects);
    }

    return characterObjects.filter((obj) => obj.data);
  } catch (error) {
    console.error('Failed to fetch owned characters:', error);
    return [];
  }
}

export async function getOwnedReceipts(walletAddress: string) {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::OrderReceipt`,
      },
      options: { showContent: true },
    });
    return objects.data;
  } catch (error) {
    console.error('Failed to fetch receipts:', error);
    return [];
  }
}

export async function getAllReceipts() {
  try {
    let allReceiptIds: string[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const page: any = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated`,
        },
        cursor: cursor,
        order: 'ascending',
      });

      const pageReceiptIds = page.data
        .map((event: any) => event.parsedJson?.receipt_id)
        .filter(Boolean);
      allReceiptIds.push(...pageReceiptIds);

      if (page.hasNextPage && page.nextCursor) {
        cursor = page.nextCursor;
      } else {
        hasNextPage = false;
      }
    }

    if (allReceiptIds.length === 0) return [];

    const receipts = [];
    for (let i = 0; i < allReceiptIds.length; i += 50) {
      const chunk = allReceiptIds.slice(i, i + 50);
      const chunkReceipts = await suiClient.multiGetObjects({
        ids: chunk,
        options: { showContent: true },
      });
      receipts.push(...chunkReceipts);
    }

    return receipts.filter((r) => r.data);
  } catch (error) {
    console.error('Failed to fetch all receipts:', error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Admin Shipping Functions (registry-based)
// ─────────────────────────────────────────────

export async function markAsShipped(params: {
  receiptObjectId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_as_shipped`,
    arguments: [
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.object(params.receiptObjectId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function markAsDelivered(params: {
  receiptObjectId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_as_delivered`,
    arguments: [
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.object(params.receiptObjectId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

export async function addTrackingInfo(params: {
  receiptObjectId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::add_tracking_information`,
    arguments: [
      tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
      tx.object(params.receiptObjectId),
      tx.pure.string(params.trackingNumber),
      tx.pure.string(params.carrier),
      tx.pure.u64(params.estimatedDelivery),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}