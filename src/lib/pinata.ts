/**
 * Pinata IPFS Utilities - Direct API Implementation
 */

import { IPFS_CONFIG } from './constants';

/**
 * Upload image to IPFS via Pinata Direct API
 */
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
    }
    
    formData.append('pinataMetadata', JSON.stringify(metadata));

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append('pinataOptions', options);

    const apiEndpoint = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${IPFS_CONFIG.jwt}`,
      },
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
}


/**
 * Unpin (delete) a file from Pinata IPFS by its hash
 */
export async function unpinFromIPFS(ipfsHash: string): Promise<void> {
  try {
    console.log(`🗑️ Unpinning ${ipfsHash} from IPFS...`);

    const apiEndpoint = `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`;

    const response = await fetch(apiEndpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${IPFS_CONFIG.jwt}`,
      },
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
  }
): Promise<{ imageUrl: string; imageHash: string; }> {
  try {
    const { ipfsHash } = await uploadImageToIPFS(
      imageBlob,
      `${characterData.name.replace(/\s/g, '_')}.png`
    );
    
    const gatewayImageUrl = getIPFSGatewayUrl(`ipfs://${ipfsHash}`);

    return { imageUrl: gatewayImageUrl, imageHash: ipfsHash };
  } catch (error) {
    console.error('❌ Failed to upload character to IPFS:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for display - UPDATED to use custom gateway
 */
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    // Use the custom gateway from config
    return `${IPFS_CONFIG.gateway}${cid}`;
  }
  
  // If it's already a gateway URL, try to convert it to the configured gateway for consistency
  if (ipfsUrl.includes('/ipfs/')) {
    try {
        const url = new URL(ipfsUrl);
        const parts = url.pathname.split('/ipfs/');
        if (parts.length > 1 && parts[1]) {
             // Use the custom gateway from config
             return `${IPFS_CONFIG.gateway}${parts[1]}`;
        }
    } catch(e) {
        // Not a valid URL, just return as is
        return ipfsUrl;
    }
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