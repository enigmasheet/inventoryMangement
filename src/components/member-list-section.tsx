"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Users, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { removeMember } from "@/app/actions";
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

type Member = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type Props = {
  members: Member[];
  ownerId: string;
};

export function MemberListSection({ members, ownerId }: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const doRemove = useCallback(async (memberId: string) => {
    setRemovingId(memberId);
    const result = await removeMember(memberId);
    setRemovingId(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Member removed");
    }
  }, []);

  return (
    <div className="border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h3 className="font-heading font-bold text-xs uppercase tracking-wider">Members</h3>
        <span className="font-mono text-[10px] text-muted-foreground ml-auto" data-number>{members.length}</span>
      </div>
      <div className="space-y-1">
        {members.map((member) => {
          const isOwner = member.id === ownerId;
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 py-2 px-1 hover:bg-muted/50 transition-colors rounded-sm"
            >
              <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {member.image ? (
                  <Image src={member.image} alt="" width={32} height={32} className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-sans font-semibold text-muted-foreground">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-sans text-sm font-medium truncate">{member.name}</p>
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-wider text-primary">
                      <Shield className="size-3" />
                      Owner
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
              {!isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={removingId === member.id} className="shrink-0 text-muted-foreground hover:text-destructive" />}>
                    <X className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Member</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to remove {member.name} from this shop?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => doRemove(member.id)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
