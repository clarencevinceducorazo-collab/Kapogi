"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { UserMessageDrawer } from "@/components/kapogian/UserMessageDrawer";

export function UserDrawerWrapper() {
  const account = useCurrentAccount();
  return <UserMessageDrawer walletAddress={account?.address ?? ""} />;
}