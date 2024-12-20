"use client";

import { SolanaWalletProvider } from "@/components/providers/SolanaWalletProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";

export const ClientProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient();
  return (
    <SolanaWalletProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SolanaWalletProvider>
  );
};
