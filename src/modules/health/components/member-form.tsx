// src/modules/health/components/member-form.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import Icon from '@mdi/react';
import { mdiAccount, mdiCamera } from '@mdi/js';
import type { FamilyMember, NewFamilyMember } from '../types';

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMember | null;
  onSave: (member: NewFamilyMember) => void;
  onUpdate?: (id: string, updates: Partial<FamilyMember>) => void;
}

type Gender = 'boy' | 'girl' | 'other';

export function MemberForm({
  open,
  onOpenChange,
  member,
  onSave,
  onUpdate,
}: MemberFormProps) {
  const t = useTranslations('healthSettings');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [details, setDetails] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setName(member.name);
      setDateOfBirth(member.date_of_birth || '');
      setGender(member.gender || '');
      setDetails(member.details || '');
      setPhotoUrl(member.photo_url || '');
      setPhotoPreview(member.photo_url);
    } else {
      setName('');
      setDateOfBirth('');
      setGender('');
      setDetails('');
      setPhotoUrl('');
      setPhotoPreview(null);
    }
  }, [member, open]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage (placeholder - actual upload logic would go here)
    setIsUploading(true);
    try {
      // TODO: Implement actual photo upload to storage
      // For now, we'll use a data URL as a placeholder
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });
      setPhotoUrl(dataUrl);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const memberData: NewFamilyMember = {
      name: name.trim(),
      date_of_birth: dateOfBirth || undefined,
      gender: gender || undefined,
      details: details.trim() || undefined,
      photo_url: photoUrl || undefined,
    };

    if (isEditing && onUpdate && member) {
      onUpdate(member.id, {
        name: name.trim(),
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        details: details.trim() || null,
        photo_url: photoUrl || null,
      });
    } else {
      onSave(memberData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editMember') : t('addMember')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handlePhotoClick}
              className="relative h-24 w-24 rounded-full overflow-hidden bg-brand-gray border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center group"
            >
              {photoPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt={t('photoAlt')}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icon path={mdiCamera} size={1} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Icon path={mdiAccount} size={1.5} />
                  <span className="text-xs">{t('uploadPhoto')}</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="text-xs text-gray-500">{t('uploading')}</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('name')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
              required
            />
          </div>

          {/* Date of Birth (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          {/* Gender (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="gender">{t('gender')}</Label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | '')}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">{t('selectGender')}</option>
              <option value="boy">{t('genderBoy')}</option>
              <option value="girl">{t('genderGirl')}</option>
              <option value="other">{t('genderOther')}</option>
            </select>
          </div>

          {/* Notes/Details (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="details">{t('details')}</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('detailsPlaceholder')}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || isUploading}>
              {isEditing ? tCommon('save') : t('addMember')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
