import { type JupAsset } from "@/lib/getFund";
import { useQuery } from "@tanstack/react-query";

export const useTokens = (userInput: string) => {
  return useQuery({
    queryKey: ["tokens", userInput],
    queryFn: async () => {
      if (!userInput.trim()) {
        return null;
      }

      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searches: [
            {
              q: userInput,
              collection: "tokens",
              per_page: 50,
              query_by: "symbol,name,address",
              sort_by: "daily_volume:desc",
            },
          ],
        }),
      });
      const data = (await response.json()) as {
        results: {
          found: number;
          hits: {
            document: {
              address: string;
              chainId: number;
              daily_volume: number;
              decimals: number;
              logoURI: string;
              name: string;
              symbol: string;
              tags: string[];
            };
          }[];
        }[];
      };
      const tokens: JupAsset[] = data.results[0].hits.map((hit) => ({
        mint: hit.document.address,
        symbol: hit.document.symbol,
        decimals: hit.document.decimals,
        image: hit.document.logoURI,
        verified: hit.document.tags.includes("verified"),
      }));
      return tokens;
    },
    enabled: Boolean(userInput.trim()),
  });
};
