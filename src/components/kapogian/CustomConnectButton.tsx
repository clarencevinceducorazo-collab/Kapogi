'use client';
import { ConnectButton } from '@mysten/dapp-kit';
import { cn } from '@/lib/utils';

export function CustomConnectButton({ className, connectedClassName }: { className?: string, connectedClassName?: string }) {
  return (
    <ConnectButton
      connectText="Connect Wallet"
      className={cn(
        // Base styles for the button
        '!bg-[#FFC83D] !text-black !comic-border !rounded-full !px-4 !py-2 !font-headline !text-lg !h-auto !toy-shadow',
        // Hover styles
        '!hover:bg-[#EAC35F]',
        // General class name from props
        className
      )}
      // Mysten's button has a separate prop for connected state class
      connectedClassName={cn(
        '!bg-[#FFC83D] !text-black !comic-border !rounded-full !px-4 !py-2 !font-headline !text-lg !h-auto !toy-shadow',
        '!hover:bg-[#EAC35F]',
        connectedClassName
      )}
    />
  );
}
