"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { getFund } from "@/lib/getFund";
import Link from "next/link";

export const HomePage = () => {
  const router = useRouter();

  const { publicKey, connected } = useWallet();

  const fundOfCurrentUser = useQuery({
    queryKey: ["fund", publicKey?.toBase58()],
    enabled: connected,
    queryFn: async () => {
      if (!publicKey || !connected) return null;
      return await getFund(publicKey.toBase58());
    },
  });

  const [fundManagerAddress, setFundManagerAddress] = useState("");

  const handleGetFund = () => {
    try {
      new PublicKey(fundManagerAddress);
    } catch (error) {
      alert("Invalid address");
      return;
    }
    router.push(`/funds/${fundManagerAddress}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-8 justify-center h-full w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        <Input
          placeholder="Fund Manager Address"
          className="w-full text-xs md:w-1/2 md:text-base"
          value={fundManagerAddress}
          onChange={(e) => setFundManagerAddress(e.target.value)}
        />
        <Button
          onClick={handleGetFund}
          className="w-full md:w-1/2"
          disabled={!fundManagerAddress}
          variant="secondary"
        >
          Get Fund
        </Button>
      </div>
      {fundOfCurrentUser.data && publicKey && (
        <Link href={`/funds/${publicKey.toBase58()}`}>View Your Fund</Link>
      )}
      {fundOfCurrentUser.error && <div>Error fetching fund</div>}
      {!connected && <div>Connect your wallet to get started</div>}
      {connected && !fundOfCurrentUser.data && (
        <Button className="w-full md:w-1/2">Create Fund</Button>
      )}
    </div>
  );
};
