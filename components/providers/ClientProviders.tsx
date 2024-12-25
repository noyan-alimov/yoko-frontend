"use client";

import { SolanaWalletProvider } from "@/components/providers/SolanaWalletProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export const ClientProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient();
  return (
    <SolanaWalletProvider>
      <Toaster />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SolanaWalletProvider>
  );
};
