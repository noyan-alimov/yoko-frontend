export type JupQuoteResponse = {
  inAmount: string;
  inputMint: string;
  otherAmountThreshold: string;
  outAmount: string;
  outputMint: string;
  priceImpactPct: string;
  slippageBps: number;
  swapMode: string;
  routePlan: JupRoutePlan[];
};

export type JupRoutePlan = {
  percent: number;
  swapInfo: {
    ammKey: string;
    label: string;
    feeAmount: string;
    feeMint: string;
    inAmount: string;
    inputMint: string;
    outAmount: string;
    outputMint: string;
  };
};

export const fetchJupQuote = async (
  inputMint: string,
  outputMint: string,
  amount: string
) => {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippage=0.5&onlyDirectRoutes=true`
  );
  const data = (await response.json()) as JupQuoteResponse;
  return data;
};

export const fetchPricesFromJup = async (
  inputMint: string,
  outputMint: string
) => {
  const response = await fetch(
    `https://fe-api.jup.ag/api/v1/prices?list_address=${inputMint},${outputMint}`
  );
  const data = (await response.json()) as {
    prices: {
      [key in typeof inputMint | typeof outputMint]: number;
    };
  };
  return data.prices;
};
