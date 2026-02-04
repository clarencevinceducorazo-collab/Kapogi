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
  address: {
    province: { name: string; psgc_code: string };
    city: { name: string; psgc_code: string };
    barangay: { name: string; psgc_code: string };
    street_address: string;
  };
}

/**
 * Encrypt shipping information using admin's public key
 * This happens CLIENT-SIDE before sending to blockchain
 */
export async function encryptShippingInfo(shippingInfo: ShippingInfo): Promise<string> {
  try {
    console.log('🔐 Encrypting shipping information...');
    
    // Convert to JSON string
    const dataString = JSON.stringify(shippingInfo);
    
    // Encrypt using admin's public key
    const encrypted = await EthCrypto.encryptWithPublicKey(
      ENCRYPTION_CONFIG.adminPublicKey,
      dataString
    );
    
    // Convert encrypted object to string for storage
    const encryptedString = EthCrypto.cipher.stringify(encrypted);
    
    console.log('✅ Shipping info encrypted successfully');
    return encryptedString;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
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
    throw new Error('Failed to decrypt shipping information');
  }
}

/**
 * Validate shipping information before encryption
 */
export function validateShippingInfo(info: ShippingInfo): { valid: boolean; errors: string[] } {
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
  if (!info.address.province?.psgc_code) {
    errors.push('Please select a province.');
  }
  if (!info.address.city?.psgc_code) {
    errors.push('Please select a city/municipality.');
  }
  if (!info.address.barangay?.psgc_code) {
    errors.push('Please select a barangay.');
  }
  if (!info.address.street_address || info.address.street_address.trim().length < 5) {
    errors.push('Please provide a street address (at least 5 characters).');
  }

  return {
    valid: errors.length === 0,
    errors,
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
