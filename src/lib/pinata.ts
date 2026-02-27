/**
 * Pinata IPFS Utilities — CLIENT-SAFE helpers only.
 *
 * ✅ This file may be imported by client components.
 * ✅ It only reads NEXT_PUBLIC_ env vars (gateway URL + read-only token).
 *
 * 🚫 Upload / unpin / auth logic has been moved to:
 *      src/lib/server/pinata.ts   ← server-only (import 'server-only')
 *
 * From the client, use the API routes:
 *      POST /api/pinata/upload    ← upload a file
 *      POST /api/pinata/unpin     ← unpin by hash
 */

import { IPFS_CONFIG } from './constants';

/**
 * Upload image to IPFS via the server-side API route.
 *
 * @deprecated Call POST /api/pinata/upload from your component instead.
 *   Example:
 *     const form = new FormData();
 *     form.append('file', blob, 'character.png');
 *     form.append('name', characterName);
 *     const res  = await fetch('/api/pinata/upload', { method: 'POST', body: form });
 *     const { imageUrl, imageHash } = await res.json();
 */
export async function uploadImageToIPFS(_imageBlob: Blob, _filename: string): Promise<{ ipfsHash: string }> {
  throw new Error(
    'uploadImageToIPFS is no longer available on the client. ' +
    'Use fetch(\'/api/pinata/upload\') instead.',
  );
}

/**
 * Unpin a file from Pinata via the server-side API route.
 *
 * @deprecated Call POST /api/pinata/unpin from your component instead.
 *   Example:
 *     await fetch('/api/pinata/unpin', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ hash }),
 *     });
 */
export async function unpinFromIPFS(_ipfsHash: string): Promise<void> {
  throw new Error(
    'unpinFromIPFS is no longer available on the client. ' +
    'Use fetch(\'/api/pinata/unpin\') instead.',
  );
}

/**
 * Upload character image via the server-side API route.
 *
 * @deprecated Call POST /api/pinata/upload from your component instead.
 */
export async function uploadCharacterToIPFS(
  _imageBlob: Blob,
  _characterData: { name: string },
): Promise<{ imageUrl: string; imageHash: string }> {
  throw new Error(
    'uploadCharacterToIPFS is no longer available on the client. ' +
    'Use fetch(\'/api/pinata/upload\') instead.',
  );
}

/**
 * Get IPFS gateway URL for display.
 * Uses the public gateway config from IPFS_CONFIG (NEXT_PUBLIC_ vars only).
 * The optional gateway key is a read-only Pinata access token — safe in the browser.
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  let cid = '';
  
  // Extract CID from ipfs:// protocol
  if (ipfsUrl.startsWith('ipfs://')) {
    cid = ipfsUrl.replace('ipfs://', '');
  } 
  // Extract CID from gateway URLs
  else if (ipfsUrl.includes('/ipfs/')) {
    try {
      const url = new URL(ipfsUrl);
      const parts = url.pathname.split('/ipfs/');
      if (parts.length > 1 && parts[1]) {
        cid = parts[1];
      }
    } catch {
      return ipfsUrl;
    }
  } 
  // Already a full URL without /ipfs/ path
  else {
    return ipfsUrl;
  }

  if (!cid) return ipfsUrl;

  // Remove any trailing slashes or query params from CID
  cid = cid.split('?')[0].split('#')[0];

  const baseUrl = IPFS_CONFIG.gatewayUrl || 'https://nft.kapogian.xyz';
  
  // Append read-only gateway token when available
  if (IPFS_CONFIG.gatewayKey) {
    return `${baseUrl}/ipfs/${cid}?pinataGatewayToken=${IPFS_CONFIG.gatewayKey}`;
  }
  
  return `${IPFS_CONFIG.gateway}${cid}`;
}

/**
 * Verify public IPFS display configuration.
 * (Auth credentials are verified server-side only.)
 */
export function verifyIPFSConfig(): {
  hasGateway: boolean;
  hasGatewayKey: boolean;
  hasGroup: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  const hasGateway = !!IPFS_CONFIG.gatewayUrl;
  if (!hasGateway) warnings.push('No gateway URL configured (NEXT_PUBLIC_PINATA_GATEWAY_URL)');
  
  const hasGatewayKey = !!IPFS_CONFIG.gatewayKey;
  if (!hasGatewayKey) warnings.push('No gateway key found (NEXT_PUBLIC_PINATA_GATEWAY_KEY) — image display may require public access');
  
  const hasGroup = !!IPFS_CONFIG.groupId;
  if (!hasGroup) warnings.push('No group ID configured (NEXT_PUBLIC_PINATA_GROUP_KAPOGIAN)');

  return { hasGateway, hasGatewayKey, hasGroup, warnings };
}

/**
 * Type Definitions
 */
export interface CharacterMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}