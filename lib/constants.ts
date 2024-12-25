import { Connection, PublicKey } from "@solana/web3.js";

export const YOKO_SERVER_URL = process.env.NEXT_PUBLIC_YOKO_SERVER_URL!;
export const CONNECTION = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);

export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
