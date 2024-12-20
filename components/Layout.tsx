"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen p-4">
      <header className="flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold">Yoko</h1>
        </Link>
        <WalletMultiButton />
      </header>
      <main className="flex-1 flex flex-col h-full">{children}</main>
    </div>
  );
};
