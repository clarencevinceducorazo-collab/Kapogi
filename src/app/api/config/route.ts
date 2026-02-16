/**
 * Public Configuration API Route
 * Returns NEXT_PUBLIC_* environment variables at runtime
 * 
 * SECURITY: Only exposes variables intended for client-side use.
 * NEVER expose ADMIN_PRIVATE_KEY or other sensitive credentials here.
 */

export async function GET() {
  try {
    // Only include NEXT_PUBLIC_* variables that are safe to expose
    const config = {
      // Encryption
      adminPublicKey: process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY || '',
      
      // Sui Network
      suiNetwork: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
      suiRpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
      
      // Contract Addresses
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      mintCounterId: process.env.NEXT_PUBLIC_MINT_COUNTER_ID || '',
      receiptRegistryId: process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ID || '',
      adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '',
      treasuryWallet: process.env.NEXT_PUBLIC_TREASURY_WALLET || '',
      transferPolicyId: process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID || '',
      collectionMetadataId: process.env.NEXT_PUBLIC_COLLECTION_METADATA_ID || '',
      
      // IPFS & Pinata (public gateway access only)
      ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://nft.kapogian.xyz/ipfs/',
      pinataGatewayUrl: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://nft.kapogian.xyz',
      pinataGatewayKey: process.env.NEXT_PUBLIC_PINATA_GATEWAY_KEY || '',
      pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT || '', // Public JWT for reading only
      pinataGroupKapogian: process.env.NEXT_PUBLIC_PINATA_GROUP_KAPOGIAN || '',
      
      // Gemini AI URLs (these contain the API key embedded, but are public-facing)
      geminiImageApi: process.env.NEXT_PUBLIC_GEMINI_IMAGE_API || '',
      geminiTextApi: process.env.NEXT_PUBLIC_GEMINI_TEXT_API || '',
    };

    // Validate critical variables are present
    if (!config.adminPublicKey) {
      console.warn('⚠️  NEXT_PUBLIC_ADMIN_PUBLIC_KEY is not configured');
    }
    if (!config.packageId) {
      console.warn('⚠️  NEXT_PUBLIC_PACKAGE_ID is not configured');
    }

    return Response.json(config, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error loading config:', error);
    return Response.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

// Prevent other HTTP methods
export const POST = () => Response.json({ error: 'Method not allowed' }, { status: 405 });
export const PUT = () => Response.json({ error: 'Method not allowed' }, { status: 405 });
export const DELETE = () => Response.json({ error: 'Method not allowed' }, { status: 405 });
