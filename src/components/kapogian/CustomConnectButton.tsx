'use client';
import { useCurrentAccount, useDisconnectWallet, useConnectWallet } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export function CustomConnectButton({ className, connectedClassName }: { className?: string, connectedClassName?: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: connect } = useConnectWallet();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultStyles = cn(
    "comic-border rounded-full px-4 py-2 font-headline text-lg h-auto flex items-center justify-center gap-2 toy-shadow",
    "bg-[#FFC83D] text-black hover:bg-[#EAC35F]"
  );

  if (!isMounted) {
    // Render a placeholder on the server and initial client render to avoid hydration mismatch.
    return (
        <Button 
            className={cn(defaultStyles, className)}
            disabled
        >
            Connect Wallet
        </Button>
    );
  }

  if (!account) {
    // Renders a custom button that opens the wallet connection modal.
    return (
      <Button
        onClick={() => connect()}
        className={cn(defaultStyles, className)}
      >
        Connect Wallet
      </Button>
    );
  }

  // Renders custom UI for the connected state
  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copyAddress = () => {
    if(!account) return;
    navigator.clipboard.writeText(account.address);
    toast({
      title: "Address Copied!",
      description: "Your SUI wallet address has been copied to the clipboard.",
    });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            className={cn(
                defaultStyles,
                connectedClassName
            )}
        >
          <User className="w-5 h-5" />
          <span>{truncateAddress(account.address)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="comic-border bg-white rounded-xl p-2 toy-shadow w-56 font-body">
        <DropdownMenuLabel className="font-headline text-base px-2 py-1.5">
          {truncateAddress(account.address)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem 
            onClick={copyAddress}
            className="font-semibold text-sm cursor-pointer hover:!bg-slate-100 !rounded-lg flex items-center gap-2 p-2"
        >
          <Copy className="w-4 h-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem 
            onClick={() => disconnect()}
            className="font-semibold text-sm cursor-pointer hover:!bg-red-100 !text-red-600 focus:!text-red-600 focus:!bg-red-100 !rounded-lg flex items-center gap-2 p-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
