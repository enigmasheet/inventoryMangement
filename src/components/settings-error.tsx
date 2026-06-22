"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  error?: string;
};

export function SettingsError({ error }: Props) {
  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [error]);

  return null;
}
