/**
 * Client-Side Encryption Utilities
 * Uses ECIES (Elliptic Curve Integrated Encryption Scheme)
 */

import EthCrypto from 'eth-crypto';
import { ENCRYPTION_CONFIG } from './constants';

/**
 * Shipping information interface
 */
export interface ShippingInfo {
  full_name: string;
  contact_number: string;
  address: string;
}

/**
 * Encrypt shipping information using admin's public key
 * This happens CLIENT-SIDE before sending to blockchain
 */
export async function encryptShippingInfo(shippingInfo: ShippingInfo): Promise<string> {
  try {
    console.log('🔐 Encrypting shipping information...');
    
    const adminPublicKey = ENCRYPTION_CONFIG.adminPublicKey;
    if (!adminPublicKey || adminPublicKey.includes('YOUR_ADMIN_PUBLIC_KEY')) {
      throw new Error('Admin public key is not configured. Please set NEXT_PUBLIC_ADMIN_PUBLIC_KEY in your .env file.');
    }

    // Convert to JSON string
    const dataString = JSON.stringify(shippingInfo);
    
    // Encrypt using admin's public key
    const encrypted = await EthCrypto.encryptWithPublicKey(
      adminPublicKey,
      dataString
    );
    
    // Convert encrypted object to string for storage
    const encryptedString = EthCrypto.cipher.stringify(encrypted);
    
    console.log('✅ Shipping info encrypted successfully');
    return encryptedString;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Failed to encrypt shipping information');
  }
}

/**
 * Decrypt shipping information using admin's private key
 * This happens in ADMIN DASHBOARD only
 */
export async function decryptShippingInfo(
  encryptedString: string,
  privateKey: string
): Promise<ShippingInfo> {
  try {
    console.log('🔓 Decrypting shipping information...');
    
    // Parse encrypted string back to object
    const encrypted = EthCrypto.cipher.parse(encryptedString);
    
    // Decrypt using admin's private key
    const decryptedString = await EthCrypto.decryptWithPrivateKey(
      privateKey,
      encrypted
    );
    
    // Parse JSON back to object
    const shippingInfo: ShippingInfo = JSON.parse(decryptedString);
    
    console.log('✅ Shipping info decrypted successfully');
    return shippingInfo;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    // Allow for old data format
    if (error instanceof SyntaxError) {
      try {
        const encrypted = EthCrypto.cipher.parse(encryptedString);
        const decryptedString = await EthCrypto.decryptWithPrivateKey(
          privateKey,
          encrypted
        );
        const oldData = JSON.parse(decryptedString);
        
        const fullAddress = [
          oldData.address.street_address,
          oldData.address.barangay?.name,
          oldData.address.city?.name,
          oldData.address.province?.name,
        ].filter(Boolean).join(', ');

        const convertedInfo: ShippingInfo = {
          full_name: oldData.full_name,
          contact_number: oldData.contact_number,
          address: fullAddress,
        }
        console.log('✅ Shipping info decrypted successfully (legacy format)');
        return convertedInfo;

      } catch (nestedError) {
         console.error('❌ Decryption failed on retry:', nestedError);
         throw new Error('Failed to decrypt shipping information');
      }
    }
    throw new Error('Failed to decrypt shipping information');
  }
}

/**
 * Validate shipping information before encryption
 */
export function validateShippingInfo(
  info: Omit<ShippingInfo, 'address'>,
  addressParts: {
    province: { name: string; code: string } | null;
    city: { name: string; code: string } | null;
    barangay: { name: string; code: string } | null;
    street_address: string;
  }
): { valid: boolean; errors: string[], fullAddress: string } {
  const errors: string[] = [];
  
  // Validate Full Name
  if (!info.full_name || info.full_name.trim().split(' ').length < 2) {
    errors.push('Full Name must include at least a first and last name.');
  } else {
      const nameParts = info.full_name.trim().split(' ');
      const isProperlyCapitalized = nameParts.every(part => part.length > 0 && part[0] === part[0].toUpperCase());
      if(!isProperlyCapitalized){
          errors.push('Please properly capitalize all parts of the name.');
      }
  }
  
  // Validate Contact Number
  const phoneRegex = /^(09\d{9}|\+639\d{9})$/;
  if (!info.contact_number || !phoneRegex.test(info.contact_number.trim())) {
    errors.push('Please provide a valid Philippine mobile number (e.g., 09123456789 or +639123456789).');
  }
  
  // Validate Address
  if (!addressParts.province?.code) {
    errors.push('Please select a province.');
  }
  if (!addressParts.city?.code) {
    errors.push('Please select a city/municipality.');
  }
  if (!addressParts.barangay?.code) {
    errors.push('Please select a barangay.');
  }
  if (!addressParts.street_address || addressParts.street_address.trim().length < 5) {
    errors.push('Please provide a street address (at least 5 characters).');
  }

  const fullAddress = [
    addressParts.street_address,
    addressParts.barangay?.name,
    addressParts.city?.name,
    addressParts.province?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    valid: errors.length === 0,
    errors,
    fullAddress: fullAddress
  };
}


/**
 * Format encrypted string for display (show first/last chars only)
 */
export function formatEncryptedPreview(encryptedString: string): string {
  if (encryptedString.length <= 20) {
    return encryptedString;
  }
  return `${encryptedString.slice(0, 10)}...${encryptedString.slice(-10)}`;
}
