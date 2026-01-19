"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";
import Icon from "@mdi/react";
import { mdiAccountPlus, mdiContentCopy, mdiClose } from "@mdi/js";
import { useSettingsStore } from "../../store";
import { MemberCard } from "./member-card";
import { InviteDialog } from "./invite-dialog";
import type { HouseholdMember, PageName, AccessLevel } from "../../types";

export function MemberAccessSection() {
  const t = useTranslations("settings.members");
  const members = useSettingsStore((s) => s.members);
  const invitations = useSettingsStore((s) => s.invitations);
  const fetchMembers = useSettingsStore((s) => s.fetchMembers);
  const fetchInvitations = useSettingsStore((s) => s.fetchInvitations);
  const updateMemberPermission = useSettingsStore((s) => s.updateMemberPermission);
  const removeMember = useSettingsStore((s) => s.removeMember);
  const cancelInvitation = useSettingsStore((s) => s.cancelInvitation);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMember | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  const handleCopyLink = (inviteCode: string) => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success(t("linkCopied"));
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember(memberToRemove.id);
      toast.success(t("memberRemoved"));
    } catch (error) {
      toast.error((error as Error).message);
    }
    setMemberToRemove(null);
  };

  const handleUpdatePermission = async (
    memberId: string,
    page: PageName,
    level: AccessLevel
  ) => {
    try {
      await updateMemberPermission(memberId, page, level);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const pendingInvites = invitations.filter((i) => !i.accepted_at);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
            {t("title")}
          </h2>
          <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <Icon path={mdiAccountPlus} size={0.67} className="mr-1" />
          {t("inviteMember")}
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm text-brand-deep-gray mb-2">
            {t("pendingInvitations")}
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <div>
                  <span className="font-medium">{invite.email}</span>
                  <span className="text-xs text-brand-deep-gray ml-2">
                    {t("expires")} {new Date(invite.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyLink(invite.invite_code)}
                  >
                    <Icon path={mdiContentCopy} size={0.5} className="mr-1" />
                    {t("copyLink")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelInvitation(invite.id)}
                  >
                    <Icon path={mdiClose} size={0.5} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-sm text-brand-deep-gray mb-2">
          {t("activeMembers")} ({members.length})
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onUpdatePermission={(page, level) =>
                handleUpdatePermission(member.id, page, level)
              }
              onRemove={() => setMemberToRemove(member)}
            />
          ))}
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
            <AlertDialogDescription>{t("removeConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}
