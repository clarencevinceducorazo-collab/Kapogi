/**
 * Server-Only Pinata IPFS Utilities
 *
 * ⚠️  This file reads PRIVATE environment variables (no NEXT_PUBLIC_ prefix).
 *    import 'server-only' prevents it from ever being bundled for the browser.
 */

import "server-only";

/**
 * Reads Pinata credentials exclusively from private server-side env vars.
 * These are NOT prefixed with NEXT_PUBLIC_ so Next.js never exposes them
 * to the client bundle.
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
    // Gateway key is also kept server-side; URLs with the token are
    // computed here and returned as opaque strings to the client.
    gatewayKey: process.env.PINATA_GATEWAY_KEY || "",
    groupId: process.env.NEXT_PUBLIC_PINATA_GROUP_KAPOGIAN || "",
  };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadImageToIPFS(
  imageBlob: Blob,
  filename: string,
): Promise<{ ipfsHash: string }> {
  const config = getServerConfig();

  console.log("📤 [server] Uploading image to IPFS…");

  const formData = new FormData();
  const file = new File([imageBlob], filename, { type: imageBlob.type });
  formData.append("file", file);

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
    console.log("🔑 Using JWT authentication");
  } else if (config.apiKey && config.apiSecret) {
    headers.pinata_api_key = config.apiKey;
    headers.pinata_secret_api_key = config.apiSecret;
    console.log("🔑 Using API Key authentication (fallback)");
  } else {
    throw new Error(
      "No Pinata credentials found. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET in your server environment.",
    );
  }

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    { method: "POST", headers, body: formData },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Pinata upload error:", response.status, errorText);
    throw new Error(`Failed to upload to IPFS. Status: ${response.status}`);
  }

  const data = await response.json();
  const ipfsHash: string = data.IpfsHash;

  if (!ipfsHash)
    throw new Error("Invalid response from IPFS service — hash not found.");

  console.log("✅ Image uploaded to IPFS:", ipfsHash);
  return { ipfsHash };
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
// High-level helper
// ---------------------------------------------------------------------------

export async function uploadCharacterToIPFS(
  imageBlob: Blob,
  characterData: { name: string },
): Promise<{ imageUrl: string; imageHash: string }> {
  const config = getServerConfig();

  const { ipfsHash } = await uploadImageToIPFS(
    imageBlob,
    `${characterData.name.replace(/\s/g, "_")}.png`,
  );

  const imageUrl = getIPFSGatewayUrl(`ipfs://${ipfsHash}`, config);

  return { imageUrl, imageHash: ipfsHash };
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
