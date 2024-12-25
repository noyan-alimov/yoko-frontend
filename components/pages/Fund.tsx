"use client";

import { getFund } from "@/lib/getFund";
import { getYokoTxn, sendTxn, truncateAddress } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type FC } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { USDC_MINT } from "@/lib/constants";

const formSchema = z.object({
  depositAmount: z.coerce.number().positive(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export const FundPage: FC<{ fundManagerPubkey: string }> = ({
  fundManagerPubkey,
}) => {
  const { publicKey, signTransaction } = useWallet();

  const fundQuery = useQuery({
    queryKey: ["fund", fundManagerPubkey],
    queryFn: async () => {
      return await getFund(fundManagerPubkey);
    },
  });

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const depositMutation = useMutation({
    mutationFn: async (data: FormSchemaType) => {
      if (!signTransaction || !publicKey || !fundQuery.data) return;
      const txn = await getYokoTxn("get-deposit-msg", {
        fund: fundQuery.data.fund_pubkey,
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

  const handleSubmit = (data: FormSchemaType) => {
    depositMutation.mutate(data);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div>
        {fundQuery.data && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-end justify-between">
              <p className="text-sm text-muted-foreground">Fund Manager</p>
              <p>{truncateAddress(fundQuery.data.manager)}</p>
            </div>
            <div className="flex gap-2 items-end justify-between">
              <p className="text-sm text-muted-foreground">Main Token</p>
              <p>
                {fundQuery.data.main_mint === USDC_MINT.toBase58()
                  ? "USDC"
                  : "SOL"}
              </p>
            </div>
            <div className="flex gap-2 items-end justify-between">
              <p className="text-sm text-muted-foreground">Manager Fee</p>
              <p>{fundQuery.data.manager_fee}%</p>
            </div>
          </div>
        )}
        {fundQuery.error && <p>Error fetching fund</p>}
        {fundQuery.isLoading && <p>Loading...</p>}
      </div>
      {fundQuery.data?.manager !== publicKey?.toBase58() && fundQuery.data && (
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
                  <FormLabel>Deposit Amount</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Deposit</Button>
          </form>
        </Form>
      )}
    </div>
  );
};
