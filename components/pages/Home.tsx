"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getFund } from "@/lib/getFund";
import Link from "next/link";
import { getYokoTxn, sendTxn } from "@/lib/utils";
import { USDC_MINT, WSOL_MINT } from "@/lib/constants";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

const MainMint = {
  USDC: "USDC",
  SOL: "SOL",
} as const;

const formSchema = z.object({
  main_mint: z.enum([MainMint.USDC, MainMint.SOL]),
  authority_fee: z.coerce.number().min(0).max(100),
});

type FormSchemaType = z.infer<typeof formSchema>;

export const HomePage = () => {
  const router = useRouter();

  const { publicKey, connected, signTransaction } = useWallet();

  const fundOfCurrentUserQuery = useQuery({
    queryKey: ["fund", publicKey?.toBase58()],
    enabled: connected,
    queryFn: async () => {
      if (!publicKey || !connected) return null;
      return await getFund(publicKey.toBase58());
    },
  });

  const createFundMutation = useMutation({
    mutationFn: async (data: FormSchemaType) => {
      if (!signTransaction || !publicKey) return;
      const txn = await getYokoTxn("get-create-fund-msg", {
        fund_manager: publicKey.toBase58(),
        main_mint: data.main_mint === MainMint.USDC ? USDC_MINT : WSOL_MINT,
        authority_fee: data.authority_fee,
      });
      const signedTxn = await signTransaction(txn);
      const signature = await sendTxn(signedTxn);
      console.log("Fund created", signature);
    },
    onSuccess: () => {
      toast.success("Fund created");
      form.reset();
      fundOfCurrentUserQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to create fund");
    },
  });

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      main_mint: MainMint.USDC,
    },
  });

  const [fundManagerAddress, setFundManagerAddress] = useState("");

  const handleGetFund = () => {
    try {
      new PublicKey(fundManagerAddress);
    } catch (error) {
      toast.error("Invalid address");
      return;
    }
    router.push(`/funds/${fundManagerAddress}`);
  };

  const onSubmit = (data: FormSchemaType) => {
    createFundMutation.mutate(data);
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-12 justify-center h-full w-full">
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
      {fundOfCurrentUserQuery.data && publicKey && (
        <Link href={`/funds/${publicKey.toBase58()}`}>
          <Button variant="link">View Your Fund</Button>
        </Link>
      )}
      {fundOfCurrentUserQuery.error && <p>Error fetching fund</p>}
      {!connected && <p>Connect your wallet to create a fund</p>}
      {connected && !fundOfCurrentUserQuery.data && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="main_mint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Token</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={MainMint.USDC}>USDC</SelectItem>
                      <SelectItem value={MainMint.SOL}>SOL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authority_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authority Fee</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full"
              type="submit"
              disabled={createFundMutation.isPending}
            >
              {createFundMutation.isPending
                ? "Creating Fund..."
                : "Create Fund"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};
