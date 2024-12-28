import { VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONNECTION, YOKO_SERVER_URL } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RETRY_DELAY = 1000;

export const sendTxn = async (tx: VersionedTransaction): Promise<string> => {
  const MAX_RETRIES = 5;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const signature = await CONNECTION.sendTransaction(tx);
      return signature;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === MAX_RETRIES) {
        console.error("Max retries reached. Throwing error.");
        throw error;
      }

      console.log(`Retrying in ${RETRY_DELAY} ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error("Failed to send transaction after max retries"); // should never reach here
};

export const getYokoTxn = async (
  route: string,
  params: any
): Promise<VersionedTransaction> => {
  const res = await fetch(`${YOKO_SERVER_URL}/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { msg: string };
  const msgBytes = data.msg;
  const msg = VersionedMessage.deserialize(
    new Uint8Array(Buffer.from(msgBytes, "base64"))
  );
  const txn = new VersionedTransaction(msg);
  return txn;
};

export const truncateAddress = (address: string) => {
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
};

export const formatDecimal = (num: number, maxDecimals: number = 9): string => {
  return num.toFixed(maxDecimals).replace(/\.?0+$/, "");
};
