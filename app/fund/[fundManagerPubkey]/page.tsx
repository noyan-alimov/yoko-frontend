import { FundPage } from "@/components/pages/Fund";

export default function Fund({
  params,
}: {
  params: { fundManagerPubkey: string };
}) {
  return <FundPage fundManagerPubkey={params.fundManagerPubkey} />;
}
