export const NETWORK_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') ?? 'testnet',
} as const;

export const ENCRYPTION_CONFIG = {
    // This is a placeholder public key.
    // In a real application, you would use a secure way to manage and retrieve this.
    adminPublicKey: process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY || ''
};
