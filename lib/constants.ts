import { Connection, PublicKey } from "@solana/web3.js";

export const YOKO_SERVER_URL = process.env.NEXT_PUBLIC_YOKO_SERVER_URL!;
export const CONNECTION = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);

export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

export const USDC_ASSET = {
  mint: USDC_MINT.toBase58(),
  image:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  symbol: "USDC",
  decimals: 6,
};

export const WSOL_ASSET = {
  mint: WSOL_MINT.toBase58(),
  image:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  symbol: "SOL",
  decimals: 9,
};

export const REGEX_9_DECIMAL = /^\d*\.?\d{0,9}$/;
export const REGEX_INTEGER = /^\d+$/;
