"use client";

import { createAuthClient } from "better-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/";
      }}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 font-heading font-bold uppercase text-xs tracking-wider cursor-pointer",
        className
      )}
    >
      <LogOut className="size-3.5" />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  );
}
