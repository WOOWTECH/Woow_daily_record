"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import Icon from "@mdi/react";
import { mdiSend, mdiCheckCircle, mdiContentCopy } from "@mdi/js";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "../../store";
import type { MemberRole, Invitation } from "../../types";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const t = useTranslations("settings.members.invite");
  const tMembers = useTranslations("settings.members");
  const tRoles = useTranslations("roles");
  const createInvitation = useSettingsStore((s) => s.createInvitation);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInvite, setSentInvite] = useState<Invitation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const invite = await createInvitation({
        email: email.trim(),
        role,
      });
      setSentInvite(invite);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (sentInvite) {
      const link = `${window.location.origin}/invite/${sentInvite.invite_code}`;
      navigator.clipboard.writeText(link);
      toast.success(tMembers("linkCopied"));
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("member");
    setSentInvite(null);
    onOpenChange(false);
  };

  const roleOptions: { value: MemberRole; label: string; icon: string }[] = [
    { value: "admin", label: tRoles("admin"), icon: "👑" },
    { value: "member", label: tRoles("member"), icon: "👤" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {sentInvite ? (
          <div className="text-center py-4">
            <Icon
              path={mdiCheckCircle}
              size={2}
              className="text-green-500 mx-auto mb-4"
            />
            <p className="text-lg font-medium mb-1">{t("sent")}</p>
            <p className="text-brand-deep-gray mb-6">{sentInvite.email}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleCopyLink}>
                <Icon path={mdiContentCopy} size={0.67} className="mr-1" />
                {tMembers("copyLink")}
              </Button>
              <Button onClick={handleClose}>{t("done")}</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("subtitle")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("role")}</Label>
                <p className="text-xs text-brand-deep-gray">{t("roleHint")}</p>
                <div className="flex gap-1 bg-white/30 dark:bg-white/10 rounded-lg p-1">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-sm transition-colors",
                        role === option.value
                          ? "bg-white dark:bg-brand-gray shadow text-brand-black dark:text-brand-white"
                          : "text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white"
                      )}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm">
                  <Icon path={mdiSend} size={0.67} className="mr-1" />
                  {isSubmitting ? t("sending") : t("sendInvite")}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
