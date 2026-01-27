/**
 * Pinata IPFS Utilities - Direct API Implementation
 */

import { IPFS_CONFIG } from './constants';

/**
 * Upload image to IPFS via Pinata Direct API
 */
export async function uploadImageToIPFS(imageBlob: Blob, filename: string): Promise<string> {
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

    // Return gateway URL (not ipfs:// URI)
    const gatewayUrl = `${IPFS_CONFIG.gateway}${ipfsHash}`;
    
    console.log('✅ Image uploaded to IPFS:', gatewayUrl);
    return gatewayUrl;
  } catch (error) {
    console.error('❌ Failed to upload image to IPFS:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata Direct API
 */
export async function uploadMetadataToIPFS(metadata: CharacterMetadata): Promise<string> {
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
    return gatewayUrl;
  } catch (error) {
    console.error('❌ Failed to upload metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
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
): Promise<{ imageUrl: string; metadataUrl: string }> {
  try {
    // 1. Upload image first
    const imageUrl = await uploadImageToIPFS(
      imageBlob,
      `${characterData.name.replace(/\s/g, '_')}.png`
    );

    // 2. Create metadata JSON with gateway URL
    const metadata: CharacterMetadata = {
      name: characterData.name,
      description: characterData.description,
      image: imageUrl, // This is now a proper gateway URL
      attributes: Object.entries(characterData.attributes).map(([key, value]) => ({
        trait_type: key,
        value: value,
      })),
    };

    // 3. Upload metadata
    const metadataUrl = await uploadMetadataToIPFS(metadata);

    return { imageUrl, metadataUrl };
  } catch (error) {
    console.error('❌ Failed to upload character to IPFS:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for display (helper function)
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('http')) {
    return ipfsUrl; // Already a gateway URL
  }
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return `${IPFS_CONFIG.gateway}${hash}`;
  }
  // Assume it's just the hash
  return `${IPFS_CONFIG.gateway}${ipfsUrl}`;
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
