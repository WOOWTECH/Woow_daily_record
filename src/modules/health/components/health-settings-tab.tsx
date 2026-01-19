// src/modules/health/components/health-settings-tab.tsx
"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@/core/components/glass-card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/core/components/ui/alert-dialog';
import Icon from '@mdi/react';
import { mdiPlus, mdiPencil, mdiDelete, mdiAccount } from '@mdi/js';
import { useHealthStore } from '../store';
import { MemberForm } from './member-form';
import type { FamilyMember, NewFamilyMember } from '../types';

interface HealthSettingsTabProps {
  householdId: string;
}

/**
 * Calculate and format age display based on date of birth.
 * - Under 2 years: "X months"
 * - 2-17 years: "X years"
 * - 18+: Just birthdate (no age shown)
 */
function formatAge(dateOfBirth: string | null, t: ReturnType<typeof useTranslations>): string | null {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  // Calculate age in months and years
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();

  // Adjust for day of month
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  const years = Math.floor(months / 12);

  // Under 2 years: show months
  if (years < 2) {
    return t('ageMonths', { count: Math.max(0, months) });
  }

  // 2-17 years: show years
  if (years < 18) {
    return t('ageYears', { count: years });
  }

  // 18+: return null (will show birthdate only)
  return null;
}

/**
 * Format birthdate for display
 */
function formatBirthdate(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null;

  const date = new Date(dateOfBirth);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function HealthSettingsTab({ householdId }: HealthSettingsTabProps) {
  const t = useTranslations('healthSettings');
  const tCommon = useTranslations('common');

  const members = useHealthStore((state) => state.members);
  const setHouseholdId = useHealthStore((state) => state.setHouseholdId);
  const fetchMembers = useHealthStore((state) => state.fetchMembers);
  const addMember = useHealthStore((state) => state.addMember);
  const updateMember = useHealthStore((state) => state.updateMember);
  const deleteMember = useHealthStore((state) => state.deleteMember);

  // Initialize store with householdId and fetch members
  useEffect(() => {
    if (householdId) {
      setHouseholdId(householdId);
      fetchMembers();
    }
  }, [householdId, setHouseholdId, fetchMembers]);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddMember = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (member: FamilyMember) => {
    setMemberToDelete(member);
    setDeleteConfirmName('');
    setIsDeleteDialogOpen(true);
  };

  const handleSaveMember = async (memberData: NewFamilyMember) => {
    await addMember(memberData);
  };

  const handleUpdateMember = async (id: string, updates: Partial<FamilyMember>) => {
    await updateMember(id, updates);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete || deleteConfirmName !== memberToDelete.name) return;

    setIsDeleting(true);
    try {
      await deleteMember(memberToDelete.id);
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      setDeleteConfirmName('');
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleteEnabled = memberToDelete && deleteConfirmName === memberToDelete.name;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
            {t('title')}
          </h2>
          <p className="text-sm text-brand-deep-gray">{t('subtitle')}</p>
        </div>
        <Button onClick={handleAddMember} size="sm">
          <Icon path={mdiPlus} size={0.67} className="mr-1" />
          {t('addMember')}
        </Button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon path={mdiAccount} size={1.5} className="text-gray-400" />
            </div>
            <p className="text-brand-deep-gray">{t('noMembers')}</p>
            <Button onClick={handleAddMember} variant="outline">
              <Icon path={mdiPlus} size={0.67} className="mr-1" />
              {t('addFirstMember')}
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const ageDisplay = formatAge(member.date_of_birth, t);
            const birthdateDisplay = formatBirthdate(member.date_of_birth);

            return (
              <GlassCard key={member.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-brand-gray border border-white/50 flex items-center justify-center">
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon
                        path={mdiAccount}
                        className="h-8 w-8 text-brand-deep-gray"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-black dark:text-brand-white truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-brand-deep-gray">
                      {ageDisplay && <span>{ageDisplay}</span>}
                      {ageDisplay && birthdateDisplay && <span>-</span>}
                      {birthdateDisplay && <span>{birthdateDisplay}</span>}
                      {!ageDisplay && !birthdateDisplay && member.gender && (
                        <span className="capitalize">{t(`gender${member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}`)}</span>
                      )}
                    </div>
                    {member.details && (
                      <p className="text-xs text-brand-deep-gray mt-1 truncate">
                        {member.details}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditMember(member)}
                      title={tCommon('edit')}
                    >
                      <Icon path={mdiPencil} size={0.67} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(member)}
                      title={tCommon('delete')}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Icon path={mdiDelete} size={0.67} />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Member Form Dialog */}
      <MemberForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        member={editingMember}
        onSave={handleSaveMember}
        onUpdate={handleUpdateMember}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t('deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {t('deleteConfirmWarning', { name: memberToDelete?.name || '' })}
              </p>
              <p className="font-medium text-foreground">
                {t('deleteConfirmInstruction', { name: memberToDelete?.name || '' })}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="confirmName" className="text-sm text-muted-foreground">
              {t('typeMemberName')}
            </Label>
            <Input
              id="confirmName"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={memberToDelete?.name || ''}
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmName('')}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!isDeleteEnabled || isDeleting}
            >
              {isDeleting ? t('deleting') : t('deleteForever')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
