/**
 * Server-Only Pinata IPFS Utilities
 *
 * ⚠️  This file reads PRIVATE environment variables (no NEXT_PUBLIC_ prefix).
 *    import 'server-only' prevents it from ever being bundled for the browser.
 */

import "server-only";

/**
 * Reads Pinata credentials exclusively from private server-side env vars.
 */
function getServerConfig() {
  return {
    jwt: process.env.PINATA_JWT || "",
    apiKey: process.env.PINATA_API_KEY || "",
    apiSecret: process.env.PINATA_API_SECRET || "",
    gatewayUrl:
      process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz",
    gateway:
      process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://nft.kapogian.xyz/ipfs/",
    gatewayKey: process.env.PINATA_GATEWAY_KEY || "",
    groupId: process.env.PINATA_GROUP_KAPOGIAN || "",
  };
}

// ---------------------------------------------------------------------------
// List Pinned Files
// ---------------------------------------------------------------------------

export async function listPinnedFiles() {
  const config = getServerConfig();
  const headers: Record<string, string> = {};

  if (config.jwt) {
    headers.Authorization = `Bearer ${config.jwt}`;
  } else if (config.apiKey && config.apiSecret) {
    headers.pinata_api_key = config.apiKey;
    headers.pinata_secret_api_key = config.apiSecret;
  } else {
    throw new Error("No Pinata credentials found.");
  }

  // Fetch pinned files from Pinata Data API
  const response = await fetch(
    "https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100",
    { method: "GET", headers }
  );

  if (!response.ok) {
    throw new Error(`Pinata API error: ${response.status}`);
  }

  const data = await response.json();
  return data.rows.map((row: any) => ({
    ipfsHash: row.ipfs_pin_hash,
    name: row.metadata?.name || row.ipfs_pin_hash,
    url: getIPFSGatewayUrl(`ipfs://${row.ipfs_pin_hash}`, config),
    mimeType: row.mime_type
  }));
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadImageToIPFS(
  imageBlob: Blob,
  filename: string,
): Promise<{ ipfsHash: string }> {
  const config = getServerConfig();

  console.log(`📤 [server] Uploading image to IPFS: ${filename} (${(imageBlob.size / 1024).toFixed(2)}KB)`);

  const formData = new FormData();
  // Node.js FormData handles Blobs directly with a filename parameter
  formData.append("file", imageBlob, filename);

  const metadata: Record<string, unknown> = { name: filename };
  if (config.groupId) {
    metadata.keyvalues = { group: config.groupId };
    console.log(`📁 Adding to group: ${config.groupId}`);
  }
  formData.append("pinataMetadata", JSON.stringify(metadata));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const headers: Record<string, string> = {};
  if (config.jwt) {
    headers.Authorization = `Bearer ${config.jwt}`;
  } else if (config.apiKey && config.apiSecret) {
    headers.pinata_api_key = config.apiKey;
    headers.pinata_secret_api_key = config.apiSecret;
  } else {
    throw new Error(
      "No Pinata credentials found. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET in your server environment.",
    );
  }

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    { 
      method: "POST", 
      headers, 
      body: formData,
      // Increased timeout for large files to be processed by Pinata
      signal: AbortSignal.timeout(180000) 
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Pinata upload error:", response.status, errorText);
    throw new Error(`Pinata upstream error: ${response.status} ${errorText.slice(0, 100)}`);
  }

  const data = await response.json();
  const ipfsHash: string = data.IpfsHash;

  if (!ipfsHash)
    throw new Error("Invalid response from IPFS service — hash not found.");

  console.log("✅ Image uploaded to IPFS:", ipfsHash);
  return { ipfsHash };
}

// ---------------------------------------------------------------------------
// High-level helper
// ---------------------------------------------------------------------------

function getExtension(mimeType: string): string {
  if (mimeType.includes("gif")) return ".gif";
  if (mimeType.includes("webp")) return ".webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return ".jpg";
  return ".png";
}

export async function uploadCharacterToIPFS(
  imageBlob: Blob,
  characterData: { name: string },
): Promise<{ imageUrl: string; imageHash: string }> {
  const config = getServerConfig();
  const ext = getExtension(imageBlob.type || "image/png");

  const { ipfsHash } = await uploadImageToIPFS(
    imageBlob,
    `${characterData.name.replace(/\s/g, "_")}${ext}`,
  );

  const imageUrl = getIPFSGatewayUrl(`ipfs://${ipfsHash}`, config);

  return { imageUrl, imageHash: ipfsHash };
}

// ---------------------------------------------------------------------------
// Unpin
// ---------------------------------------------------------------------------

export async function unpinFromIPFS(ipfsHash: string): Promise<void> {
  const config = getServerConfig();

  console.log(`🗑️ [server] Unpinning ${ipfsHash}…`);

  const headers: Record<string, string> = {};
  if (config.jwt) {
    headers.Authorization = `Bearer ${config.jwt}`;
  } else if (config.apiKey && config.apiSecret) {
    headers.pinata_api_key = config.apiKey;
    headers.pinata_secret_api_key = config.apiSecret;
  }

  const response = await fetch(
    `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
    { method: "DELETE", headers },
  );

  if (!response.ok) {
    const text = await response.text();
    console.warn(`⚠️ Failed to unpin ${ipfsHash}:`, text);
  } else {
    console.log(`✅ Successfully unpinned ${ipfsHash}`);
  }
}

// ---------------------------------------------------------------------------
// Gateway URL builder (server-side, can embed gateway key safely)
// ---------------------------------------------------------------------------

export function getIPFSGatewayUrl(
  ipfsUrl: string,
  config?: ReturnType<typeof getServerConfig>,
): string {
  const cfg = config ?? getServerConfig();

  if (!ipfsUrl) return "";

  let cid = "";

  if (ipfsUrl.startsWith("ipfs://")) {
    cid = ipfsUrl.replace("ipfs://", "");
  } else if (ipfsUrl.includes("/ipfs/")) {
    try {
      const url = new URL(ipfsUrl);
      const parts = url.pathname.split("/ipfs/");
      if (parts.length > 1 && parts[1]) cid = parts[1];
    } catch {
      return ipfsUrl;
    }
  } else {
    return ipfsUrl;
  }

  if (!cid) return ipfsUrl;

  cid = cid.split("?")[0].split("#")[0];

  const baseUrl = cfg.gatewayUrl || "https://nft.kapogian.xyz";

  if (cfg.gatewayKey) {
    return `${baseUrl}/ipfs/${cid}?pinataGatewayToken=${cfg.gatewayKey}`;
  }

  console.warn(
    "⚠️ No PINATA_GATEWAY_KEY — using unauthenticated gateway access.",
  );
  return `${cfg.gateway}${cid}`;
}
