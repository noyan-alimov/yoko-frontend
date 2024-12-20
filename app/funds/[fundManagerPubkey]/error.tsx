"use client";

import { DefaultErrorPage } from "@/components/DefaultErrorPage";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DefaultErrorPage handleTryAgain={reset} />;
}
