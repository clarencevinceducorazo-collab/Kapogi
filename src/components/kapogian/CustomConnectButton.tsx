"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";

export function CustomConnectButton({
  className,
  connectedClassName,
}: {
  className?: string;
  connectedClassName?: string;
}) {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  // Branding styles from your design system
  const baseStyle = cn(
    "!bg-[#FFC83D] !text-black !comic-border !rounded-full !px-6 !py-2 !font-bold !h-auto !toy-shadow flex items-center gap-2",
    "hover:!bg-[#EAC35F] transition-all cursor-pointer",
  );

  /**
   * STATE: CONNECTED
   * We hide the address entirely and show "PROFILE"
   */
  if (account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(baseStyle, connectedClassName, className)}
        >
          <User className="w-5 h-5" />
          <span style={{ fontSize: "16px" }}>PROFILE</span>
          <ChevronDown className="w-4 h-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="bg-[#FFC83D] border-2 border-black rounded-xl min-w-[200px] z-[60] shadow-xl p-2"
        >
          {/* Navigation Links */}
          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-black/5 rounded-lg"
          >
            <Link
              href="/collection"
              className="flex w-full items-center p-2"
              style={{ fontSize: "16px", fontWeight: "700" }}
            >
              My Collection
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-black/5 rounded-lg"
          >
            <Link
              href="/my-orders"
              className="flex w-full items-center p-2"
              style={{ fontSize: "16px", fontWeight: "700" }}
            >
              My Orders
            </Link>
          </DropdownMenuItem>

          <div className="h-[1px] bg-black/10 my-2" />

          {/* Disconnect Option - Handled manually to keep UI clean */}
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-between p-2"
          >
            <span style={{ fontSize: "16px" }} className="font-bold">
              Disconnect
            </span>
            <LogOut className="w-4 h-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /**
   * STATE: DISCONNECTED
   * Default Mysten logic for "Connect Wallet"
   */
  return (
    <ConnectButton
      connectText="Connect Wallet"
      className={cn(baseStyle, className)}
    />
  );
}
