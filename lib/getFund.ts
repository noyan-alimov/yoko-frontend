import { YOKO_SERVER_URL } from "./constants";

export const getFund = async (
  fund_manager: string
): Promise<FundType | null> => {
  try {
    const response = await fetch(`${YOKO_SERVER_URL}/get-fund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fund_manager }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export type FundType = {
  fund_pubkey: string;
  manager: string;
  total_deposited: number;
  payouts_counter: number;
  manager_fee: number;
  main_mint: string;
  other_mints: string[];
};