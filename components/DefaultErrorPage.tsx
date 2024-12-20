import { FC } from "react";
import { Button } from "./ui/button";

export const DefaultErrorPage: FC<{ handleTryAgain: () => void }> = ({
  handleTryAgain,
}) => (
  <div className="flex-1 flex flex-col items-center justify-center h-full w-full">
    <h2 className="text-xl font-semibold mb-4">Something went wrong!</h2>
    <Button onClick={handleTryAgain}>Try Again</Button>
  </div>
);
