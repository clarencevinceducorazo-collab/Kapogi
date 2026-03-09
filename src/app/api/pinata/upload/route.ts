import { NextResponse } from "next/server";
import "server-only";

/**
 * POST /api/pinata/upload
 * Server-side route to handle IPFS uploads using fetch.
 * This avoids module resolution issues with the Pinata SDK in certain build environments.
 */

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error("Missing PINATA_JWT environment variable");
    }

    // Prepare metadata and options
    const pinataMetadata = JSON.stringify({
      name: name || file.name,
      keyvalues: {
        project: "Kapogian",
        uploadedAt: new Date().toISOString(),
      },
    });

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });

    // Construct the payload for Pinata
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("pinataMetadata", pinataMetadata);
    uploadData.append("pinataOptions", pinataOptions);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: uploadData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const ipfsHash = result.IpfsHash;
    
    // Construct the authenticated gateway URL
    const gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz";
    const gatewayKey = process.env.PINATA_GATEWAY_KEY || "";
    const imageUrl = gatewayKey
      ? `${gatewayUrl}/ipfs/${ipfsHash}?pinataGatewayToken=${gatewayKey}`
      : `${gatewayUrl}/ipfs/${ipfsHash}`;

    return NextResponse.json({ 
      imageUrl, 
      imageHash: ipfsHash,
      success: true 
    });

  } catch (error: any) {
    console.error("Pinata upload route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload to IPFS" },
      { status: 500 }
    );
  }
}
