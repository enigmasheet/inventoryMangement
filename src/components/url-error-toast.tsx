"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function UrlErrorToast({ error }: { error?: string }) {
  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [error]);

  return null;
}
