/**
 * SUI Blockchain Utilities
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { CONTRACT_ADDRESSES, MODULES, PRICING, NETWORK_CONFIG } from './constants';

export const suiClient = new SuiClient({ url: NETWORK_CONFIG.rpcUrl });

console.log('🔍 SUI Client URL:', NETWORK_CONFIG.rpcUrl);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface AchievementDef {
  objectId: string;
  name: string;
  description: string;
  badgeUrl: string;
  requirementType: number; // 0=total_mmr, 1=best_mmr, 2=total_summons, 3=admin_granted
  threshold: number;
  isActive: boolean;
  createdAt: number;
}

export interface UnlockedAchievement {
  achievementId: string;
  achievementName: string;
  requirementType: number;
  claimedAt: number;
}

export interface PlayerStatsObject {
  objectId: string;
  owner: string;
  unlocked: UnlockedAchievement[];
}

export interface AchievementGrant {
  objectId: string;
  achievementId: string;
  intendedRecipient: string;
  grantedBy: string;
  grantedAt: number;
}

// ─────────────────────────────────────────────
// Role Detection (on-chain, no hardcoded wallets)
// ─────────────────────────────────────────────

/**
 * Check if a wallet is in the AdminRegistry whitelist.
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
  newPrice: number;
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
  newPrice: number;
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
  totalPrice: number;
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

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.totalPrice)]);
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
    const nftType = `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::Character`;

    const directOwned = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: { StructType: nftType },
      options: { showContent: true, showOwner: true, showDisplay: true, showType: true },
    });

    let allCharacters = [...directOwned.data];

    const kioskCaps = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: { StructType: '0x2::kiosk::KioskOwnerCap' },
      options: { showContent: true },
    });

    for (const cap of kioskCaps.data) {
      if (cap.data?.content?.dataType === 'moveObject') {
        const kioskId = (cap.data.content.fields as any).for;
        if (kioskId) {
          const kioskFields = await suiClient.getDynamicFields({ parentId: kioskId });
          const itemIds = kioskFields.data
            .filter((f) => f.type === 'DynamicObject')
            .map((f) => f.objectId);

          if (itemIds.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < itemIds.length; i += chunkSize) {
              const chunk = itemIds.slice(i, i + chunkSize);
              const items = await suiClient.multiGetObjects({
                ids: chunk,
                options: { showContent: true, showDisplay: true, showType: true },
              });
              const charactersInKiosk = items.filter((item) => item.data?.type === nftType);
              allCharacters.push(...charactersInKiosk);
            }
          }
        }
      }
    }

    const seen = new Set();
    return allCharacters.filter((obj) => {
      const id = obj.data?.objectId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch strictly owned characters:', error);
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

// ─────────────────────────────────────────────
// Achievement Queries
// ─────────────────────────────────────────────

/**
 * Fetch all Achievement objects by scanning AchievementCreated events.
 * Returns all achievements regardless of active status — filter on the client.
 */
export async function getAllAchievements(): Promise<AchievementDef[]> {
  try {
    let allAchievementIds: string[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const page: any = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::AchievementCreated`,
        },
        cursor,
        order: 'ascending',
      });

      const ids = page.data
        .map((event: any) => event.parsedJson?.achievement_id)
        .filter(Boolean);
      allAchievementIds.push(...ids);

      if (page.hasNextPage && page.nextCursor) {
        cursor = page.nextCursor;
      } else {
        hasNextPage = false;
      }
    }

    if (allAchievementIds.length === 0) return [];

    const objects = await suiClient.multiGetObjects({
      ids: allAchievementIds,
      options: { showContent: true },
    });

    return objects
      .filter((obj) => obj.data)
      .map((obj) => {
        const fields = (obj.data?.content as any)?.fields;
        return {
          objectId: obj.data!.objectId,
          name: fields.name,
          description: fields.description,
          badgeUrl: fields.badge_url,
          requirementType: Number(fields.requirement_type),
          threshold: Number(fields.threshold),
          isActive: fields.is_active,
          createdAt: Number(fields.created_at),
        };
      });
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return [];
  }
}

/**
 * Fetch a single Achievement by object ID.
 */
export async function getAchievement(achievementObjectId: string): Promise<AchievementDef | null> {
  try {
    const obj = await suiClient.getObject({
      id: achievementObjectId,
      options: { showContent: true },
    });

    if (!obj.data) return null;
    const fields = (obj.data.content as any)?.fields;

    return {
      objectId: obj.data.objectId,
      name: fields.name,
      description: fields.description,
      badgeUrl: fields.badge_url,
      requirementType: Number(fields.requirement_type),
      threshold: Number(fields.threshold),
      isActive: fields.is_active,
      createdAt: Number(fields.created_at),
    };
  } catch (error) {
    console.error('Failed to fetch achievement:', error);
    return null;
  }
}

/**
 * Fetch the PlayerStats owned object for a wallet.
 * Returns null if the player has not yet called create_player_stats().
 */
export async function getPlayerStats(walletAddress: string): Promise<PlayerStatsObject | null> {
  try {
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::PlayerStats`,
      },
      options: { showContent: true },
    });

    const statsObj = ownedObjects.data[0];
    if (!statsObj?.data) return null;

    const fields = (statsObj.data.content as any)?.fields;

    // unlocked is a vector<UnlockedAchievement> — each entry is a struct
    const unlocked: UnlockedAchievement[] = (fields.unlocked ?? []).map((entry: any) => ({
      achievementId: entry.fields?.achievement_id,
      achievementName: entry.fields?.achievement_name,
      requirementType: Number(entry.fields?.requirement_type),
      claimedAt: Number(entry.fields?.claimed_at),
    }));

    return {
      objectId: statsObj.data.objectId,
      owner: fields.owner,
      unlocked,
    };
  } catch (error) {
    console.error('Failed to fetch player stats:', error);
    return null;
  }
}

/**
 * Fetch all pending AchievementGrant objects in a player's wallet.
 * These are grants issued by admin that the player has not yet claimed.
 */
export async function getPendingGrants(walletAddress: string): Promise<AchievementGrant[]> {
  try {
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: walletAddress,
      filter: {
        StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::AchievementGrant`,
      },
      options: { showContent: true },
    });

    return ownedObjects.data
      .filter((obj) => obj.data)
      .map((obj) => {
        const fields = (obj.data!.content as any)?.fields;
        return {
          objectId: obj.data!.objectId,
          achievementId: fields.achievement_id,
          intendedRecipient: fields.intended_recipient,
          grantedBy: fields.granted_by,
          grantedAt: Number(fields.granted_at),
        };
      });
  } catch (error) {
    console.error('Failed to fetch pending grants:', error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Achievement Transactions — Player
// ─────────────────────────────────────────────

/**
 * Create a PlayerStats object for the calling wallet.
 * Should only be called once per wallet — check getPlayerStats() first.
 */
export async function createPlayerStats(params: { signAndExecute: any }) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::create_player_stats`,
    arguments: [tx.object('0x6')],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true, showObjectChanges: true });
}

/**
 * Claim a threshold-based achievement (total_mmr, best_mmr, total_summons).
 * The player passes their stat value — trust-based, no on-chain proof.
 *
 * @param value  The player's current stat value (must meet achievement threshold).
 */
export async function claimAchievement(params: {
  achievementObjectId: string;
  playerStatsObjectId: string;
  value: number;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::claim_achievement`,
    arguments: [
      tx.object(params.achievementObjectId),
      tx.object(params.playerStatsObjectId),
      tx.pure.u64(params.value),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

/**
 * Claim an admin-granted achievement by consuming the AchievementGrant object.
 * The grant is deleted on-chain after this call — one-time use.
 */
export async function claimGrantedAchievement(params: {
  grantObjectId: string;
  achievementObjectId: string;
  playerStatsObjectId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::claim_granted_achievement`,
    arguments: [
      tx.object(params.grantObjectId),
      tx.object(params.achievementObjectId),
      tx.object(params.playerStatsObjectId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

// ─────────────────────────────────────────────
// Achievement Transactions — Super Admin
// ─────────────────────────────────────────────

/**
 * Create a new Achievement definition on-chain.
 * requirementType: 0=total_mmr, 1=best_mmr, 2=total_summons, 3=admin_granted
 * threshold is ignored for admin_granted type but must still be passed (use 0).
 */
export async function superAdminCreateAchievement(params: {
  superAdminCapId: string;
  name: string;
  description: string;
  badgeUrl: string;
  requirementType: number;
  threshold: number;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::create_achievement`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.pure.string(params.badgeUrl),
      tx.pure.u8(params.requirementType),
      tx.pure.u64(params.threshold),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute(
    { transaction: tx },
    { showEffects: true, showObjectChanges: true },
  );
}

/**
 * Activate an achievement so players can claim it.
 */
export async function superAdminActivateAchievement(params: {
  superAdminCapId: string;
  achievementObjectId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::activate_achievement`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(params.achievementObjectId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

/**
 * Deactivate an achievement — blocks new claims, existing claims unaffected.
 */
export async function superAdminDeactivateAchievement(params: {
  superAdminCapId: string;
  achievementObjectId: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::deactivate_achievement`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(params.achievementObjectId),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

/**
 * Update achievement display fields (name, description, badge_url).
 * requirement_type and threshold cannot be changed after creation.
 */
export async function superAdminUpdateAchievementDisplay(params: {
  superAdminCapId: string;
  achievementObjectId: string;
  name: string;
  description: string;
  badgeUrl: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::update_achievement_display`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(params.achievementObjectId),
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.pure.string(params.badgeUrl),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}

/**
 * Issue an admin-granted AchievementGrant to a player's wallet.
 * The achievement must have requirementType === 3 (admin_granted).
 */
export async function superAdminIssueGrant(params: {
  superAdminCapId: string;
  achievementObjectId: string;
  recipientAddress: string;
  signAndExecute: any;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::achievement::issue_grant`,
    arguments: [
      tx.object(params.superAdminCapId),
      tx.object(params.achievementObjectId),
      tx.pure.address(params.recipientAddress),
      tx.object('0x6'),
    ],
  });
  return params.signAndExecute({ transaction: tx }, { showEffects: true });
}