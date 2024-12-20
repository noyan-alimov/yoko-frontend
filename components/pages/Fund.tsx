"use client";

import { getFund } from "@/lib/getFund";
import { useQuery } from "@tanstack/react-query";
import { type FC } from "react";

export const FundPage: FC<{ fundManagerPubkey: string }> = ({
  fundManagerPubkey,
}) => {
  const fundQuery = useQuery({
    queryKey: ["fund", fundManagerPubkey],
    queryFn: async () => {
      return await getFund(fundManagerPubkey);
    },
  });

  return <pre>{JSON.stringify(fundQuery.data, null, 2)}</pre>;
};
