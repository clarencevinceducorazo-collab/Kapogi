'use client';
import { ConnectButton } from '@mysten/dapp-kit';
import { cn } from '@/lib/utils';

export function CustomConnectButton({ className, connectedClassName }: { className?: string, connectedClassName?: string }) {
  const baseStyle = cn(
    // Base styles for the button
    '!bg-[#FFC83D] !text-black !comic-border !rounded-full !px-4 !py-2 !font-headline !text-lg !h-auto !toy-shadow',
    // Hover styles
    '!hover:bg-[#EAC35F]'
  );
  
  return (
    <ConnectButton
      connectText="Connect Wallet"
      className={cn(
        baseStyle,
        className
      )}
      // Mysten's button has a separate prop for connected state class
      // If a connectedClassName is not provided, it will fallback to using the className,
      // ensuring style consistency after connection.
      connectedClassName={cn(
        baseStyle,
        connectedClassName
      )}
    />
  );
}
