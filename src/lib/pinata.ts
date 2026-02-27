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

import { IPFS_CONFIG } from "./constants";

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
<<<<<<< HEAD
export async function uploadImageToIPFS(imageBlob: Blob, filename: string): Promise<{ ipfsHash: string }> {
  try {
    console.log('📤 Uploading image to IPFS...');
    
    const formData = new FormData();
    const file = new File([imageBlob], filename, { type: imageBlob.type });
    formData.append('file', file);

    // Pinata Metadata - includes group if available
    const metadata: any = { 
      name: filename,
    };
    
    // Add to group/folder if configured
    if (IPFS_CONFIG.groupId) {
      metadata.keyvalues = {
        group: IPFS_CONFIG.groupId,
      };
      console.log(`📁 Adding to group: ${IPFS_CONFIG.groupId}`);
    }
    
    formData.append('pinataMetadata', JSON.stringify(metadata));

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append('pinataOptions', options);

    const apiEndpoint = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

    // Primary authentication method: JWT
    const headers: Record<string, string> = {};
    
    if (IPFS_CONFIG.jwt) {
      headers.Authorization = `Bearer ${IPFS_CONFIG.jwt}`;
      console.log('🔑 Using JWT authentication');
    } else if (IPFS_CONFIG.apiKey && IPFS_CONFIG.apiSecret) {
      // Fallback: API Key + Secret (legacy method)
      headers.pinata_api_key = IPFS_CONFIG.apiKey;
      headers.pinata_secret_api_key = IPFS_CONFIG.apiSecret;
      console.log('🔑 Using API Key authentication (fallback)');
    } else {
      throw new Error('No Pinata authentication credentials found. Please set NEXT_PUBLIC_PINATA_JWT or API keys.');
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinata upload error:', `Status: ${response.status}`, errorText);
      throw new Error(`Failed to upload to IPFS. Status: ${response.status}`);
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;

    if (!ipfsHash) {
      throw new Error('Invalid response from IPFS service, hash not found.');
    }
    
    console.log('✅ Image uploaded to IPFS with Hash:', ipfsHash);
    return { ipfsHash };
  } catch (error) {
    console.error('❌ Failed to upload image to IPFS:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred during IPFS upload.');
  }
=======
export async function uploadImageToIPFS(
  _imageBlob: Blob,
  _filename: string,
): Promise<{ ipfsHash: string }> {
  throw new Error(
    "uploadImageToIPFS is no longer available on the client. " +
      "Use fetch('/api/pinata/upload') instead.",
  );
>>>>>>> cc07bdab3906e69886e85bf6db0b3eb7da85b3ba
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
    "unpinFromIPFS is no longer available on the client. " +
      "Use fetch('/api/pinata/unpin') instead.",
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
    "uploadCharacterToIPFS is no longer available on the client. " +
      "Use fetch('/api/pinata/upload') instead.",
  );
}

/**
<<<<<<< HEAD
 * Get IPFS gateway URL for display with proper authentication
 * FIXED: Now more robust against raw CIDs and different URL patterns
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  let cid = '';
  const baseUrl = IPFS_CONFIG.gatewayUrl || 'https://nft.kapogian.xyz';
  
  // 1. If it's already a full HTTP URL
  if (ipfsUrl.startsWith('http')) {
    // If it's already using our gateway and has a token, return as is
    if (ipfsUrl.includes('pinataGatewayToken') && ipfsUrl.includes(baseUrl)) {
      return ipfsUrl;
    }
    
    // If it's a gateway URL but missing token, extract CID
    if (ipfsUrl.includes('/ipfs/')) {
      const parts = ipfsUrl.split('/ipfs/');
      if (parts.length > 1 && parts[1]) {
        cid = parts[1].split('?')[0].split('#')[0];
      }
    } else {
      return ipfsUrl; // External non-IPFS URL
    }
  } 
  // 2. Extract CID from ipfs:// protocol
  else if (ipfsUrl.startsWith('ipfs://')) {
    cid = ipfsUrl.replace('ipfs://', '');
  } 
  // 3. Assume it's a raw CID
=======
 * Get IPFS gateway URL for display.
 * Authenticated image URLs are generated server-side via the
 * /api/pinata/image-url proxy so the gateway token never reaches the browser.
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return "";

  let cid = "";

  // Extract CID from ipfs:// protocol
  if (ipfsUrl.startsWith("ipfs://")) {
    cid = ipfsUrl.replace("ipfs://", "");
  }
  // Extract CID from gateway URLs
  else if (ipfsUrl.includes("/ipfs/")) {
    try {
      const url = new URL(ipfsUrl);
      const parts = url.pathname.split("/ipfs/");
      if (parts.length > 1 && parts[1]) {
        cid = parts[1];
      }
    } catch {
      return ipfsUrl;
    }
  }
  // Already a full URL without /ipfs/ path
>>>>>>> cc07bdab3906e69886e85bf6db0b3eb7da85b3ba
  else {
    cid = ipfsUrl;
  }

  if (!cid) return ipfsUrl;

<<<<<<< HEAD
  // Clean the CID of any trailing fragments
  cid = cid.split('?')[0].split('#')[0];

  // Apply gateway authentication token if available
  if (IPFS_CONFIG.gatewayKey) {
    return `${baseUrl}/ipfs/${cid}?pinataGatewayToken=${IPFS_CONFIG.gatewayKey}`;
  }
  
  // Fallback to basic gateway path
  return `${baseUrl}/ipfs/${cid}`;
}

/**
 * Verify IPFS configuration is complete
=======
  // Remove any trailing slashes or query params from CID
  cid = cid.split("?")[0].split("#")[0];

  // Route through the server-side proxy — the gateway token is added there.
  return `/api/pinata/image-url?cid=${encodeURIComponent(cid)}`;
}

/**
 * Verify public IPFS display configuration.
 * (Auth credentials are verified server-side only.)
>>>>>>> cc07bdab3906e69886e85bf6db0b3eb7da85b3ba
 */
export function verifyIPFSConfig(): {
  hasGateway: boolean;
  hasGatewayKey: boolean;
  hasGroup: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const hasGateway = !!IPFS_CONFIG.gatewayUrl;
  if (!hasGateway)
    warnings.push("No gateway URL configured (NEXT_PUBLIC_PINATA_GATEWAY_URL)");

  const hasGatewayKey = true; // key lives server-side (PINATA_GATEWAY_KEY)
  // No client-side check needed — the proxy route applies the token.

  const hasGroup = true; // group ID lives server-side (PINATA_GROUP_KAPOGIAN)

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
