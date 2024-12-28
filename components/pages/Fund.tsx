"use client";

import { type Asset, getFund, type Token } from "@/lib/getFund";
import {
  formatDecimal,
  getYokoTxn,
  sendTxn,
  truncateAddress,
} from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FC } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { REGEX_9_DECIMAL, USDC_ASSET, WSOL_ASSET } from "@/lib/constants";
import { SelectAsset } from "../SelectAsset";
import { ChevronDown, ArrowDownUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJupQuote } from "@/queries/useJupQuote";
import { Skeleton } from "../ui/skeleton";

export const FundPage: FC<{ fundManagerPubkey: string }> = ({
  fundManagerPubkey,
}) => {
  const { publicKey, connected } = useWallet();

  const fundQuery = useQuery({
    queryKey: ["fund", fundManagerPubkey],
    queryFn: async () => {
      return await getFund(fundManagerPubkey);
    },
  });

  const isCurrentUserFundManager = useMemo(
    () => fundQuery.data?.manager === publicKey?.toBase58(),
    [fundQuery.data?.manager, publicKey]
  );

  const fundOwnedAssets = useMemo(() => {
    const assets: Asset[] = [];
    if (fundQuery.data?.main_token) {
      assets.push(fundQuery.data.main_token.asset);
    }
    for (const token of fundQuery.data?.other_tokens ?? []) {
      assets.push(token.asset);
    }
    return assets;
  }, [fundQuery.data?.other_tokens, fundQuery.data?.main_token]);

  const fundDetails = (
    <div className="min-w-80">
      {fundQuery.data && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-end justify-between">
              <p className="text-sm text-muted-foreground">Fund Manager</p>
              <p>{truncateAddress(fundQuery.data.manager)}</p>
            </div>
            <div className="flex gap-2 items-end justify-between">
              <p className="text-sm text-muted-foreground">Manager Fee</p>
              <p>{fundQuery.data.manager_fee}%</p>
            </div>
            <div className="flex gap-2 items-end justify-between">
              <p className="text-sm text-muted-foreground">Total USD Balance</p>
              <p>${formatDecimal(fundQuery.data.total_usd_amount, 2)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Main Token</p>
              <TokenInfo token={fundQuery.data.main_token} />
            </div>
            {fundQuery.data.other_tokens.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">Other Tokens</p>
                {fundQuery.data.other_tokens.map((token) => (
                  <TokenInfo token={token} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {fundQuery.error && <p>Error fetching fund</p>}
      {fundQuery.isLoading && <p>Loading...</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-10 items-center">
      {fundDetails}
      {!connected && (
        <p>Please connect your wallet to deposit into this fund</p>
      )}
      {connected && !isCurrentUserFundManager && fundQuery.data && (
        <div className="flex flex-col gap-14 w-full">
          <div className="flex justify-center">
            <ClaimPayout fundPubkey={fundQuery.data.fund_pubkey} />
          </div>
          <Card className="w-full max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <DepositForm fundPubkey={fundQuery.data.fund_pubkey} />
            </CardContent>
          </Card>
        </div>
      )}
      {connected && isCurrentUserFundManager && fundQuery.data && (
        <div className="flex flex-col gap-14 w-full">
          <Drawer>
            <div className="flex justify-center">
              <DrawerTrigger asChild>
                <Button variant="secondary" className="w-[140px]">
                  Create Payout
                </Button>
              </DrawerTrigger>
            </div>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="text-center">PAYOUT</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 pb-12 flex justify-center">
                <CreatePayoutForm fundPubkey={fundQuery.data.fund_pubkey} />
              </div>
            </DrawerContent>
          </Drawer>
          <Card className="w-full max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Swap</CardTitle>
            </CardHeader>
            <CardContent>
              <SwapForm
                mainToken={fundQuery.data.main_token}
                fundOwnedAssets={fundOwnedAssets}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const ClaimPayout: FC<{ fundPubkey: string }> = ({ fundPubkey }) => {
  const { publicKey, connected, signTransaction } = useWallet();

  const claimPayoutMutation = useMutation({
    mutationFn: async () => {
      if (!signTransaction || !publicKey) return;
      const txn = await getYokoTxn("get-claim-payout-msg", {
        fund: fundPubkey,
        depositor: publicKey.toBase58(),
      });
      const signedTxn = await signTransaction(txn);
      const signature = await sendTxn(signedTxn);
      console.log("Payout claimed", signature);
    },
    onSuccess: () => {
      toast.success("Payout claimed");
    },
    onError: () => {
      toast.error("Failed to claim payout");
    },
  });

  const handleClaimPayout = () => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }
    claimPayoutMutation.mutate();
  };

  return (
    <Button
      onClick={handleClaimPayout}
      disabled={claimPayoutMutation.isPending}
      variant="secondary"
    >
      {claimPayoutMutation.isPending ? "Claiming payout..." : "Claim Payout"}
    </Button>
  );
};

const depositFormSchema = z.object({
  depositAmount: z.coerce.number().positive(),
});

type DepositFormSchemaType = z.infer<typeof depositFormSchema>;

const DepositForm: FC<{ fundPubkey: string }> = ({ fundPubkey }) => {
  const { publicKey, connected, signTransaction } = useWallet();

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormSchemaType) => {
      if (!signTransaction || !publicKey) return;
      const txn = await getYokoTxn("get-deposit-msg", {
        fund: fundPubkey,
        depositor: publicKey.toBase58(),
        amount: data.depositAmount,
      });
      const signedTxn = await signTransaction(txn);
      const signature = await sendTxn(signedTxn);
      console.log("Deposit successful", signature);
    },
    onSuccess: () => {
      toast.success("Deposit successful");
      form.reset({ depositAmount: 0 });
    },
    onError: () => {
      toast.error("Failed to deposit");
    },
  });

  const form = useForm<DepositFormSchemaType>({
    resolver: zodResolver(depositFormSchema),
  });

  const handleSubmit = (data: DepositFormSchemaType) => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }
    depositMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="depositAmount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="0.00" className="text-right" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={depositMutation.isPending}>
          {depositMutation.isPending ? "Depositing..." : "Deposit"}
        </Button>
      </form>
    </Form>
  );
};

const createPayoutFormSchema = z.object({
  amount: z.coerce.number().positive(),
});

type CreatePayoutFormSchemaType = z.infer<typeof createPayoutFormSchema>;

const CreatePayoutForm: FC<{ fundPubkey: string }> = ({ fundPubkey }) => {
  const { publicKey, connected, signTransaction } = useWallet();

  const createPayoutMutation = useMutation({
    mutationFn: async (data: CreatePayoutFormSchemaType) => {
      if (!signTransaction || !publicKey) return;
      const txn = await getYokoTxn("get-create-payout-msg", {
        fund: fundPubkey,
        amount: data.amount,
      });
      const signedTxn = await signTransaction(txn);
      const signature = await sendTxn(signedTxn);
      console.log("Payout created", signature);
    },
    onSuccess: () => {
      toast.success("Payout created");
      form.reset({ amount: 0 });
    },
    onError: () => {
      toast.error("Failed to create payout");
    },
  });

  const form = useForm<CreatePayoutFormSchemaType>({
    resolver: zodResolver(createPayoutFormSchema),
  });

  const handleSubmit = (data: CreatePayoutFormSchemaType) => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }
    createPayoutMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="0.00" className="text-right" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createPayoutMutation.isPending}>
          {createPayoutMutation.isPending
            ? "Creating payout..."
            : "Create Payout"}
        </Button>
      </form>
    </Form>
  );
};

const TokenInfo: FC<{ token: Token }> = ({ token }) => {
  return (
    <div className="flex justify-between items-end">
      <div className="flex gap-1 items-center">
        <img
          src={token.asset.image}
          alt={token.asset.symbol}
          className="w-6 h-6 rounded-full"
        />
        <p className="text-sm text-muted-foreground">{token.asset.symbol}</p>
      </div>
      <div className="flex gap-1 items-center justify-between">
        <span>{token.ui_amount}</span>
        <span className="text-sm text-muted-foreground">
          (${formatDecimal(token.usd_amount, 2)})
        </span>
      </div>
    </div>
  );
};

const SwapForm: FC<{
  mainToken: Token;
  fundOwnedAssets: Asset[];
}> = ({ mainToken, fundOwnedAssets }) => {
  const { publicKey, signTransaction } = useWallet();

  const [inputAsset, setInputAsset] = useState<Asset>(mainToken.asset);
  const [outputAsset, setOutputAsset] = useState<Asset>(
    mainToken.asset.mint === USDC_ASSET.mint ? WSOL_ASSET : USDC_ASSET
  );
  const [inputDrawerOpen, setInputDrawerOpen] = useState(false);
  const [outputDrawerOpen, setOutputDrawerOpen] = useState(false);

  const [inputAmount, setInputAmount] = useState("");
  const [debouncedInputAmount, setDebouncedInputAmount] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInputAmount(inputAmount);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputAmount]);

  const jupQuoteQuery = useJupQuote({
    inputToken: inputAsset,
    outputToken: outputAsset,
    amount: debouncedInputAmount,
  });

  const isJupQuoteLoading = useMemo(
    () => jupQuoteQuery.isPending && Number(inputAmount) > 0,
    [jupQuoteQuery.isPending, inputAmount]
  );

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!signTransaction || !publicKey) return;
      const txn = await getYokoTxn("get-swap-msg", {
        fund_manager: publicKey.toBase58(),
        from_mint: inputAsset.mint,
        to_mint: outputAsset.mint,
        in_amount: Number(debouncedInputAmount),
        quote: jupQuoteQuery.data?.quoteData,
      });
      const signedTxn = await signTransaction(txn);
      const signature = await sendTxn(signedTxn);
      return signature;
    },
    onSuccess: (signature) => {
      toast.success(
        <div className="flex items-center gap-2">
          Swap successful.{" "}
          <a
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Solscan.
          </a>
        </div>,
        {
          duration: 5000,
        }
      );
    },
    onError: () => {
      toast.error("Failed to swap");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-muted-foreground">You're Selling</h4>
        <div className="flex gap-2">
          <Drawer open={inputDrawerOpen} onOpenChange={setInputDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                className="flex gap-2 items-center w-[140px] min-w-[140px] max-w-[140px]"
                variant="secondary"
              >
                <img
                  src={inputAsset.image}
                  alt={inputAsset.symbol}
                  className="w-8 h-8 rounded-full"
                />
                <span>{inputAsset.symbol}</span>
                <ChevronDown size={18} />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>You're Selling</DrawerTitle>
                <SelectAsset
                  fundOwnedAssets={fundOwnedAssets}
                  handleClick={(asset) => {
                    setInputAsset(asset);
                    setInputDrawerOpen(false);
                  }}
                />
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
          <div className="flex flex-col gap-1 w-full">
            <Input
              value={inputAmount}
              onChange={(e) => {
                if (e.target.value[0] === ".") {
                  setInputAmount("0" + e.target.value);
                } else if (REGEX_9_DECIMAL.test(e.target.value)) {
                  setInputAmount(e.target.value);
                }
              }}
              placeholder="0.00"
              className="text-right"
            />
            {jupQuoteQuery.data && (
              <span className="text-xs text-muted-foreground text-right">
                ${jupQuoteQuery.data.inputUsdPrice}
              </span>
            )}
            {!jupQuoteQuery.data && !isJupQuoteLoading && (
              <span className="opacity-0 text-xs text-muted-foreground text-right">
                $0.00
              </span>
            )}
            {isJupQuoteLoading && (
              <div className="flex justify-end">
                <Skeleton className="h-[16px] w-[40px] text-right" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full"
          onClick={() => {
            setInputAsset(outputAsset);
            setOutputAsset(inputAsset);
            setInputAmount(jupQuoteQuery.data?.outAmountUserFormat ?? "");
          }}
        >
          <ArrowDownUp size={18} />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-sm text-muted-foreground">You're Buying</h4>
        <div className="flex gap-2">
          <Drawer open={outputDrawerOpen} onOpenChange={setOutputDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                className="flex gap-2 items-center w-[140px] min-w-[140px] max-w-[140px]"
                variant="secondary"
              >
                <img
                  src={outputAsset.image}
                  alt={outputAsset.symbol}
                  className="w-8 h-8 rounded-full"
                />
                <span>{outputAsset.symbol}</span>
                <ChevronDown size={18} />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>You're Buying</DrawerTitle>
                <SelectAsset
                  fundOwnedAssets={fundOwnedAssets}
                  handleClick={(asset) => {
                    setOutputAsset(asset);
                    setOutputDrawerOpen(false);
                  }}
                />
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
          <div className="flex flex-col gap-1 w-full">
            {jupQuoteQuery.data && (
              <Input
                value={jupQuoteQuery.data.outAmountUserFormat ?? ""}
                disabled
                placeholder="0.00"
                className="text-right"
              />
            )}
            {!isJupQuoteLoading && !jupQuoteQuery.data && (
              <Input disabled placeholder="0.00" className="text-right" />
            )}
            {isJupQuoteLoading && (
              <div className="flex justify-end">
                <Skeleton className="h-[36px] w-[100px] text-right" />
              </div>
            )}
            {jupQuoteQuery.data && (
              <span className="text-xs text-muted-foreground text-right">
                ${jupQuoteQuery.data.outputUsdPrice}
              </span>
            )}
            {!jupQuoteQuery.data && !isJupQuoteLoading && (
              <span className="opacity-0 text-xs text-muted-foreground text-right">
                $0.00
              </span>
            )}
            {isJupQuoteLoading && (
              <div className="flex justify-end">
                <Skeleton className="h-[16px] w-[40px] text-right" />
              </div>
            )}
          </div>
        </div>
      </div>
      <Button
        className="mt-4"
        disabled={!jupQuoteQuery.data || swapMutation.isPending}
        onClick={() => swapMutation.mutate()}
      >
        {swapMutation.isPending ? "Swapping..." : "Swap"}
      </Button>
    </div>
  );
};
