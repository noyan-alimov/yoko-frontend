import { Asset, JupAsset } from "@/lib/getFund";
import { useTokens } from "@/queries/useTokens";
import { useEffect, useState, type FC } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

export const SelectAsset: FC<{
  fundOwnedAssets: Asset[];
  handleClick: (token: Asset) => void;
}> = ({ fundOwnedAssets, handleClick }) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const tokensQuery = useTokens(debouncedSearch);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by token or paste address"
        />
      </div>
      <ScrollArea className="h-[300px]">
        {tokensQuery.data
          ? tokensQuery.data.map((token) => (
              <Token key={token.mint} item={token} handleClick={handleClick} />
            ))
          : fundOwnedAssets.map((token) => (
              <Token key={token.mint} item={token} handleClick={handleClick} />
            ))}
      </ScrollArea>
    </div>
  );
};

const Token: FC<{ item: Asset; handleClick: (token: Asset) => void }> = ({
  item: token,
  handleClick,
}) => {
  return (
    <Button
      className="flex-row items-center justify-between w-full"
      variant="ghost"
      onClick={() => {
        handleClick(token);
      }}
    >
      <div className="flex gap-3 items-center">
        <img
          src={token.image}
          alt={token.symbol}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex gap-1 items-center">
          <p className="text-whiteGrey text-sm font-semibold">{token.symbol}</p>
          {(token as JupAsset).verified && <CheckCircle2 size={18} />}
        </div>
      </div>
      <div className="gap-2 items-end"></div>
    </Button>
  );
};
