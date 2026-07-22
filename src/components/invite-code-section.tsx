"use client";

import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { regenerateInviteCode } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  initialCode: string | null;
};

export function InviteCodeSection({ initialCode }: Props) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await regenerateInviteCode();
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.inviteCode) {
        setCode(result.inviteCode);
        setCopied(false);
      }
    } catch {
      setError("Failed to regenerate code");
      toast.error("Failed to regenerate code");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Invite Code</h3>
      </div>
      <p className="text-xs font-sans text-muted-foreground">
        Share this code with others to let them join your shop. Only you can regenerate it.
      </p>
      {error && (
        <p className="text-sm font-sans text-destructive">{error}</p>
      )}
      {code ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-lg tracking-[0.3em] bg-muted px-3 py-2 select-all" data-number>
            {code}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
            title="Copy to clipboard"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="shrink-0"
                title="Generate new code"
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              </Button>
            }>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate the current code. Anyone with the old code will no longer be able to join.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>Regenerate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm font-sans text-muted-foreground italic">No invite code set</p>
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                {loading ? "Generating..." : "Generate Code"}
              </Button>
            }>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate invite code?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a new invite code for your shop. You can share it with others to let them join.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>Generate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
