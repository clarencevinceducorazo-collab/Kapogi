/**
 * Pinata IPFS Utilities - Direct API Implementation
 * FIXED: Now properly uses all environment variables and gateway authentication
 */

import { IPFS_CONFIG } from "./constants";

/**
 * Upload image to IPFS via Pinata Direct API
 * Uses JWT for authentication (preferred method)
 */
export async function uploadImageToIPFS(
  imageBlob: Blob,
  filename: string,
): Promise<{ ipfsHash: string }> {
  try {
    console.log("📤 Uploading image to IPFS...");

    const formData = new FormData();
    const file = new File([imageBlob], filename, { type: imageBlob.type });
    formData.append("file", file);

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

    formData.append("pinataMetadata", JSON.stringify(metadata));

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataOptions", options);

    const apiEndpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";

    // Primary authentication method: JWT
    const headers: Record<string, string> = {};

    if (IPFS_CONFIG.jwt) {
      headers.Authorization = `Bearer ${IPFS_CONFIG.jwt}`;
      console.log("🔑 Using JWT authentication");
    } else if (IPFS_CONFIG.apiKey && IPFS_CONFIG.apiSecret) {
      // Fallback: API Key + Secret (legacy method)
      headers.pinata_api_key = IPFS_CONFIG.apiKey;
      headers.pinata_secret_api_key = IPFS_CONFIG.apiSecret;
      console.log("🔑 Using API Key authentication (fallback)");
    } else {
      throw new Error(
        "No Pinata authentication credentials found. Please set NEXT_PUBLIC_PINATA_JWT or API keys.",
      );
    }

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Pinata upload error:",
        `Status: ${response.status}`,
        errorText,
      );
      throw new Error(`Failed to upload to IPFS. Status: ${response.status}`);
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;

    if (!ipfsHash) {
      throw new Error("Invalid response from IPFS service, hash not found.");
    }

    console.log("✅ Image uploaded to IPFS with Hash:", ipfsHash);
    return { ipfsHash };
  } catch (error) {
    console.error("❌ Failed to upload image to IPFS:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred during IPFS upload.");
  }
}

/**
 * Unpin (delete) a file from Pinata IPFS by its hash
 * Uses same authentication as upload
 */
export async function unpinFromIPFS(ipfsHash: string): Promise<void> {
  try {
    console.log(`🗑️ Unpinning ${ipfsHash} from IPFS...`);

    const apiEndpoint = `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`;

    // Use JWT if available, otherwise use API keys
    const headers: Record<string, string> = {};

    if (IPFS_CONFIG.jwt) {
      headers.Authorization = `Bearer ${IPFS_CONFIG.jwt}`;
    } else if (IPFS_CONFIG.apiKey && IPFS_CONFIG.apiSecret) {
      headers.pinata_api_key = IPFS_CONFIG.apiKey;
      headers.pinata_secret_api_key = IPFS_CONFIG.apiSecret;
    }

    const response = await fetch(apiEndpoint, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Failed to unpin ${ipfsHash}:`, errorText);
    } else {
      console.log(`✅ Successfully unpinned ${ipfsHash}`);
    }
  } catch (error) {
    console.error(`❌ Error unpinning ${ipfsHash}:`, error);
  }
}

/**
 * Simplified upload flow: Just the Image
 */
export async function uploadCharacterToIPFS(
  imageBlob: Blob,
  characterData: {
    name: string;
  },
): Promise<{ imageUrl: string; imageHash: string }> {
  try {
    const { ipfsHash } = await uploadImageToIPFS(
      imageBlob,
      `${characterData.name.replace(/\s/g, "_")}.png`,
    );

    const gatewayImageUrl = getIPFSGatewayUrl(`ipfs://${ipfsHash}`);

    return { imageUrl: gatewayImageUrl, imageHash: ipfsHash };
  } catch (error) {
    console.error("❌ Failed to upload character to IPFS:", error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for display with proper authentication
 * FIXED: Now more robust against raw CIDs and different URL patterns
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return "";

  let cid = "";
  const baseUrl = IPFS_CONFIG.gatewayUrl || "https://nft.kapogian.xyz";

  // 1. If it's already a full HTTP URL
  if (ipfsUrl.startsWith("http")) {
    // If it's already using our gateway and has a token, return as is
    if (ipfsUrl.includes("pinataGatewayToken") && ipfsUrl.includes(baseUrl)) {
      return ipfsUrl;
    }

    // If it's a gateway URL but missing token, extract CID
    if (ipfsUrl.includes("/ipfs/")) {
      const parts = ipfsUrl.split("/ipfs/");
      if (parts.length > 1 && parts[1]) {
        cid = parts[1].split("?")[0].split("#")[0];
      }
    } else {
      return ipfsUrl; // External non-IPFS URL
    }
  }
  // 2. Extract CID from ipfs:// protocol
  else if (ipfsUrl.startsWith("ipfs://")) {
    cid = ipfsUrl.replace("ipfs://", "");
  }
  // 3. Assume it's a raw CID
  else {
    cid = ipfsUrl;
  }

  if (!cid) return ipfsUrl;

  // Clean the CID of any trailing fragments
  cid = cid.split("?")[0].split("#")[0];

  // Apply gateway authentication token if available
  if (IPFS_CONFIG.gatewayKey) {
    return `${baseUrl}/ipfs/${cid}?pinataGatewayToken=${IPFS_CONFIG.gatewayKey}`;
  }

  // Fallback to basic gateway path
  return `${baseUrl}/ipfs/${cid}`;
}

/**
 * Verify IPFS configuration is complete
 */
export function verifyIPFSConfig(): {
  hasAuth: boolean;
  hasGateway: boolean;
  hasGatewayKey: boolean;
  hasGroup: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const hasJWT = !!IPFS_CONFIG.jwt;
  const hasAPIKeys = !!(IPFS_CONFIG.apiKey && IPFS_CONFIG.apiSecret);
  const hasAuth = hasJWT || hasAPIKeys;

  if (!hasAuth) {
    warnings.push("No authentication credentials found (JWT or API keys)");
  }

  const hasGateway = !!IPFS_CONFIG.gatewayUrl;
  if (!hasGateway) {
    warnings.push("No gateway URL configured");
  }

  const hasGatewayKey = !!IPFS_CONFIG.gatewayKey;
  if (!hasGatewayKey) {
    warnings.push(
      "No gateway key found - authenticated gateway access will not work",
    );
  }

  const hasGroup = !!IPFS_CONFIG.groupId;
  if (!hasGroup) {
    warnings.push(
      "No group ID configured - files will not be organized in folders",
    );
  }

  return {
    hasAuth,
    hasGateway,
    hasGatewayKey,
    hasGroup,
    warnings,
  };
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
