/**
 * Pinata IPFS Utilities - Direct API Implementation
 */

import { IPFS_CONFIG } from './constants';

/**
 * Upload image to IPFS via Pinata Direct API
 */
export async function uploadImageToIPFS(imageBlob: Blob, filename: string): Promise<{ imageUrl: string; ipfsHash: string }> {
  try {
    console.log('📤 Uploading image to IPFS...');
    
    // Create FormData for Pinata API
    const formData = new FormData();
    const file = new File([imageBlob], filename, { type: imageBlob.type });
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: filename,
    });
    formData.append('pinataMetadata', metadata);

    // Add options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${IPFS_CONFIG.jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinata upload error:', errorText);
      throw new Error('Failed to upload to IPFS');
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;

    if (!ipfsHash) {
      throw new Error('Invalid response from IPFS service');
    }

    // Return ipfs:// URI
    const imageUrl = `ipfs://${ipfsHash}`;
    
    console.log('✅ Image uploaded to IPFS with URI:', imageUrl);
    return { imageUrl, ipfsHash };
  } catch (error) {
    console.error('❌ Failed to upload image to IPFS:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata Direct API
 */
export async function uploadMetadataToIPFS(metadata: CharacterMetadata): Promise<{ gatewayUrl: string; ipfsHash: string }> {
  try {
    console.log('📤 Uploading metadata to IPFS...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${IPFS_CONFIG.jwt}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}_metadata.json`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinata metadata upload error:', errorText);
      throw new Error('Failed to upload metadata to IPFS');
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;

    if (!ipfsHash) {
      throw new Error('Invalid response from IPFS service');
    }

    // Return gateway URL (not ipfs:// URI)
    const gatewayUrl = `${IPFS_CONFIG.gateway}${ipfsHash}`;
    
    console.log('✅ Metadata uploaded to IPFS:', gatewayUrl);
    return { gatewayUrl, ipfsHash };
  } catch (error) {
    console.error('❌ Failed to upload metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

/**
 * Unpin (delete) a file from Pinata IPFS by its hash
 */
export async function unpinFromIPFS(ipfsHash: string): Promise<void> {
  try {
    console.log(`🗑️ Unpinning ${ipfsHash} from IPFS...`);

    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${IPFS_CONFIG.jwt}`,
      },
    });

    if (!response.ok) {
      // It's okay if it fails (e.g., already unpinned), just log it
      const errorText = await response.text();
      console.warn(`⚠️ Failed to unpin ${ipfsHash}:`, errorText);
    } else {
      console.log(`✅ Successfully unpinned ${ipfsHash}`);
    }
  } catch (error) {
    console.error(`❌ Error unpinning ${ipfsHash}:`, error);
    // Don't re-throw, as cleanup failure shouldn't block user flow
  }
}


/**
 * Complete upload flow: Image + Metadata
 */
export async function uploadCharacterToIPFS(
  imageBlob: Blob,
  characterData: {
    name: string;
    description: string;
    attributes: Record<string, any>;
  }
): Promise<{ imageUrl: string; metadataUrl: string; imageHash: string; metadataHash: string }> {
  try {
    // 1. Upload image first
    const { imageUrl, ipfsHash: imageHash } = await uploadImageToIPFS(
      imageBlob,
      `${characterData.name.replace(/\s/g, '_')}.png`
    );

    // 2. Create metadata JSON with gateway URL
    const metadata: CharacterMetadata = {
      name: characterData.name,
      description: characterData.description,
      image: imageUrl, // This is now an ipfs:// URI
      attributes: Object.entries(characterData.attributes).map(([key, value]) => ({
        trait_type: key,
        value: value,
      })),
    };

    // 3. Upload metadata
    const { gatewayUrl: metadataUrl, ipfsHash: metadataHash } = await uploadMetadataToIPFS(metadata);

    return { imageUrl, metadataUrl, imageHash, metadataHash };
  } catch (error) {
    console.error('❌ Failed to upload character to IPFS:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for display (helper function)
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    // Use Pinata gateway for fast and reliable image loading
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  
  return ipfsUrl;
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
