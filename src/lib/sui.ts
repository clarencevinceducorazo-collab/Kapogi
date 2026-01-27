import { TransactionBlock } from '@mysten/sui.js/transactions';
import type { WalletContextState } from '@mysten/dapp-kit';

interface MintCharacterNFTOptions {
  name: string;
  description: string;
  imageUrl: string;
  attributes: string;
  itemsSelected: string;
  encryptedShippingInfo: string;
  encryptionPubkey: string;
  signAndExecute: WalletContextState['signAndExecuteTransaction'];
}

export async function mintCharacterNFT(options: MintCharacterNFTOptions): Promise<{ digest: string }> {
  const { name, description, imageUrl, attributes, itemsSelected, encryptedShippingInfo, encryptionPubkey, signAndExecute } = options;

  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const mintCounterId = process.env.NEXT_PUBLIC_MINT_COUNTER_ID;
  const receiptRegistryId = process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ID;
  const treasuryWallet = process.env.NEXT_PUBLIC_TREASURY_WALLET;
  
  if (!packageId || !mintCounterId || !receiptRegistryId || !treasuryWallet) {
    throw new Error("SUI contract environment variables are not set.");
  }
  
  const tx = new TransactionBlock();

  // Define the payment coin (10 SUI)
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure(10_000_000_000)]);
  
  // Transfer payment to treasury
  tx.transferObjects([paymentCoin], tx.pure(treasuryWallet));

  // Call the mint function on the smart contract
  tx.moveCall({
    target: `${packageId}::kapogian::mint_to_sender`,
    arguments: [
      tx.object(mintCounterId),
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(imageUrl),
      tx.pure.string(attributes),
      tx.pure.string(itemsSelected),
      tx.pure.string(encryptedShippingInfo),
      tx.pure.string(encryptionPubkey),
      tx.object(receiptRegistryId),
    ],
  });

  console.log("Constructing SUI transaction...", tx.blockData);

  try {
    const result = await signAndExecute({
        transaction: tx,
    });
    console.log("SUI transaction successful!", result);
    return { digest: result.digest };
  } catch (err) {
      console.error('SUI transaction failed:', err);
      throw err;
  }
}
