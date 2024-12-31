"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import Logo from "@/app/logo/yoko-logo-with-text.png";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen p-4">
      <header className="flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          <img
            src={Logo.src}
            alt="Yoko"
            className="w-32"
            width={6842}
            height={1913}
          />
        </Link>
        <WalletMultiButton />
      </header>
      <main className="flex-1 flex flex-col h-full px-2 py-10">{children}</main>
    </div>
  );
};
