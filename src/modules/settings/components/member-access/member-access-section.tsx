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
import { mdiAccountPlus, mdiContentCopy, mdiClose, mdiAccountRemove } from "@mdi/js";
import { useSettingsStore } from "../../store";
import { PermissionMatrix } from "./permission-matrix";
import { InviteDialog } from "./invite-dialog";
import type { HouseholdMember, ModuleName, AccessLevel } from "../../types";

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
    module: ModuleName,
    level: AccessLevel
  ) => {
    try {
      await updateMemberPermission(memberId, module, level);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const pendingInvites = invitations.filter((i) => !i.accepted_at);
  const nonOwnerMembers = members.filter((m) => m.role !== "owner");

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
            {t("title")}
          </h2>
          <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm"
        >
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

      {/* Permission Matrix */}
      <div className="mb-6">
        <h3 className="text-sm text-brand-deep-gray mb-3">
          {t("permissionMatrix")}
        </h3>
        <PermissionMatrix
          members={members}
          onUpdatePermission={handleUpdatePermission}
        />
      </div>

      {/* Remove Member Buttons */}
      {nonOwnerMembers.length > 0 && (
        <div className="pt-4 border-t border-white/20">
          <h3 className="text-sm text-brand-deep-gray mb-2">
            {t("removeMembers")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {nonOwnerMembers.map((member) => (
              <Button
                key={member.id}
                variant="outline"
                size="sm"
                onClick={() => setMemberToRemove(member)}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Icon path={mdiAccountRemove} size={0.5} className="mr-1" />
                {member.name}
              </Button>
            ))}
          </div>
        </div>
      )}

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
