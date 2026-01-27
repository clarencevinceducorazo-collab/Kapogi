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
  name: string;
  address: string;
  phone: string;
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
  
  if (!info.name || info.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!info.address || info.address.trim().length < 10) {
    errors.push('Please provide a complete address');
  }
  
  if (!info.phone || info.phone.trim().length < 10) {
    errors.push('Please provide a valid phone number');
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
