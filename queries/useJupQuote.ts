import { formatDecimal } from "@/lib/utils";
import { fetchJupQuote, fetchPricesFromJup } from "@/lib/jupSwap";
import { useQuery } from "@tanstack/react-query";

export const useJupQuote = ({
  inputToken,
  outputToken,
  amount,
}: {
  inputToken: { mint: string; decimals: number };
  outputToken: { mint: string; decimals: number };
  amount: string;
}) => {
  return useQuery({
    queryKey: ["jup-quote", inputToken.mint, outputToken.mint, amount],
    staleTime: 5000,
    queryFn: async () => {
      const amountNumber = Number(amount);
      if (amountNumber <= 0) {
        return {
          quoteData: null,
          inputUsdPrice: null,
          outputUsdPrice: null,
          outAmountUserFormat: null,
        };
      }

      const amountToSwap = amountNumber * 10 ** inputToken.decimals;
      const quoteData = await fetchJupQuote(
        inputToken.mint,
        outputToken.mint,
        amountToSwap.toString()
      );

      const prices = await fetchPricesFromJup(
        inputToken.mint,
        outputToken.mint
      );

      const outAmountNumber = Number(quoteData.outAmount);
      const outAmountUserFormat = formatDecimal(
        outAmountNumber / 10 ** outputToken.decimals,
        outputToken.decimals
      );
      const inputUsdPrice = formatDecimal(
        prices[inputToken.mint] * amountNumber,
        2
      );
      const outputUsdPrice = formatDecimal(
        (prices[outputToken.mint] * outAmountNumber) /
          10 ** outputToken.decimals,
        2
      );

      return {
        quoteData,
        inputUsdPrice,
        outputUsdPrice,
        outAmountUserFormat,
      };
    },
    enabled: Number(amount) > 0,
  });
};
