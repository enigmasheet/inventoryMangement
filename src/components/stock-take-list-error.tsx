"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  error?: string;
};

export function StockTakeListError({ error }: Props) {
  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [error]);

  return null;
}
