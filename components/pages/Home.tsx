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
  FormMessage,
} from "../ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer";

const MainMint = {
  USDC: "USDC",
  SOL: "SOL",
} as const;

const formSchema = z.object({
  main_mint: z.enum([MainMint.USDC, MainMint.SOL]),
  authority_fee: z.coerce.number().min(0).max(99),
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
  });

  const [fundManagerAddress, setFundManagerAddress] = useState("");

  const handleGetFund = () => {
    try {
      new PublicKey(fundManagerAddress);
    } catch (error) {
      toast.error("Invalid address");
      return;
    }
    router.push(`/fund/${fundManagerAddress}`);
  };

  const onSubmit = (data: FormSchemaType) => {
    createFundMutation.mutate(data);
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-20 justify-center h-full w-full">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <Input
          placeholder="Fund Manager Address"
          className="w-full text-xs md:text-base"
          value={fundManagerAddress}
          onChange={(e) => setFundManagerAddress(e.target.value)}
        />
        <Button
          onClick={handleGetFund}
          className="w-full"
          disabled={!fundManagerAddress}
          variant="secondary"
        >
          Get Fund
        </Button>
      </div>
      {fundOfCurrentUserQuery.data && publicKey && (
        <Link href={`/fund/${publicKey.toBase58()}`}>
          <Button variant="link">View Your Fund</Button>
        </Link>
      )}
      {fundOfCurrentUserQuery.error && <p>Error fetching fund</p>}
      {!connected && <p>Connect your wallet to create a fund</p>}
      {connected && !fundOfCurrentUserQuery.data && (
        <Card className="w-full max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Create Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="main_mint"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Main Token" />
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
                      <FormControl>
                        <Input {...field} placeholder="Manager Fee in %" />
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
          </CardContent>
        </Card>
      )}
      <div className="flex justify-center items-center">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">How does it work?</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="px-4 pb-8 text-sm md:text-base">
              <p className="font-bold mb-4">
                Yoko is a protocol on the Solana blockchain that allows anyone
                to create and manage their own investment fund using{" "}
                <span className="font-bold">USDC</span> or{" "}
                <span className="font-bold">SOL</span>.
              </p>
              <p className="mb-4">Here's how it works:</p>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>
                  <span className="font-bold">Fund Creation:</span>{" "}
                  <span className="text-muted-foreground">
                    A fund manager sets up a new fund, choosing a main token
                    (USDC or SOL) and defining a management fee.
                  </span>
                </li>
                <li>
                  <span className="font-bold">Trading:</span>{" "}
                  <span className="text-muted-foreground">
                    The manager executes swaps via Yoko's integration with
                    Jupiter to pursue profitable trades for the fund.
                  </span>
                </li>
                <li>
                  <span className="font-bold">Payouts:</span>{" "}
                  <span className="text-muted-foreground">
                    When the manager creates a payout, the profits are
                    automatically split between the depositors and the fund
                    manager (according to the management fee).
                  </span>
                </li>
                <li>
                  <span className="font-bold">Depositor Safety:</span>{" "}
                  <span className="text-muted-foreground">
                    Users deposit tokens into the fund's Solana smart contract,
                    ensuring the manager cannot withdraw these tokens directly.
                    The manager's actions are limited to making swaps and
                    creating payouts.
                  </span>
                </li>
                <li>
                  <span className="font-bold">Claiming Rewards:</span>{" "}
                  <span className="text-muted-foreground">
                    Once payouts are available, depositors can claim their share
                    of profits.
                  </span>
                </li>
              </ol>
              <p>
                This trust-minimized approach lets users invest with a fund
                manager while keeping their assets secure in the smart contract.
              </p>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};
