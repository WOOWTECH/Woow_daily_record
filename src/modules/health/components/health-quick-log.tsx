// src/modules/health/components/health-quick-log.tsx
"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Icon from '@mdi/react';
import {
    mdiBed,
    mdiBottleTonicPlus,
    mdiBabyCarriage,
    mdiThermometer,
    mdiScaleBalance,
    mdiRuler,
    mdiWater,
    mdiPill,
    mdiPlus,
    mdiDelete,
    mdiHeart,
    mdiStar,
    mdiCircle,
} from '@mdi/js';
import { GlassCard } from '@/core/components/glass-card';
import { cn } from '@/lib/utils';
import { Button } from '@/core/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { toast } from 'sonner';

import { SkeletonCard } from '@/core/components/skeleton-card';
import type { Log } from '@/modules/baby/lib/constants';
import { ICONS, COLOR_THEMES } from '@/modules/baby/lib/constants';
import { format } from 'date-fns';
import { createClient } from '@/core/lib/supabase/client';

interface HealthQuickLogProps {
    memberId: string;
    recentLogs: Log[];
    isLoading: boolean;
}

interface QuickActivity {
    id: string;
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    isCustom?: boolean;
}

const DEFAULT_ACTIVITIES: QuickActivity[] = [
    { id: 'sleep', name: 'Sleep', icon: mdiBed, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'medication', name: 'Medication', icon: mdiPill, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { id: 'feeding', name: 'Feeding', icon: mdiBottleTonicPlus, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    { id: 'temperature', name: 'Temperature', icon: mdiThermometer, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
    { id: 'weight', name: 'Weight', icon: mdiScaleBalance, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'height', name: 'Height', icon: mdiRuler, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { id: 'hydration', name: 'Hydration', icon: mdiWater, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { id: 'activity', name: 'Activity', icon: mdiBabyCarriage, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
];

const ICON_OPTIONS = [
    { value: mdiHeart, label: 'Heart' },
    { value: mdiStar, label: 'Star' },
    { value: mdiCircle, label: 'Circle' },
    { value: mdiPill, label: 'Pill' },
    { value: mdiBed, label: 'Bed' },
    { value: mdiThermometer, label: 'Thermometer' },
];

const COLOR_OPTIONS = [
    { value: 'purple', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { value: 'red', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { value: 'orange', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    { value: 'green', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { value: 'blue', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { value: 'indigo', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
];

// Mapping of quick activity IDs to activity_type categories
const ACTIVITY_CATEGORY_MAP: Record<string, string> = {
    'sleep': 'sleep',
    'medication': 'health',
    'feeding': 'feeding',
    'temperature': 'health',
    'weight': 'health',
    'height': 'health',
    'hydration': 'health',
    'activity': 'care',
};

export function HealthQuickLog({ memberId, recentLogs, isLoading }: HealthQuickLogProps) {
    const t = useTranslations('health');
    const tBaby = useTranslations('baby.records');
    const [customActivities, setCustomActivities] = useState<QuickActivity[]>([]);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<QuickActivity | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Log form state
    const [time, setTime] = useState('');
    const [value, setValue] = useState('');
    const [note, setNote] = useState('');

    // Add custom activity form state
    const [newActivityName, setNewActivityName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(mdiHeart);
    const [selectedColor, setSelectedColor] = useState('purple');

    const allActivities = [...DEFAULT_ACTIVITIES, ...customActivities];

    const handleActivityClick = (activity: QuickActivity) => {
        setSelectedActivity(activity);
        const now = new Date();
        setTime(now.toTimeString().slice(0, 5));
        setValue('');
        setNote('');
        setIsLogDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivity || !memberId) return;

        setIsSubmitting(true);
        const supabase = createClient();

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Please log in to add records');
                return;
            }

            // Find or create the activity type
            const category = ACTIVITY_CATEGORY_MAP[selectedActivity.id] || 'custom';

            // First try to find existing activity type
            let { data: existingType } = await supabase
                .from('activity_types')
                .select('id')
                .eq('name', selectedActivity.name)
                .eq('category', category)
                .single();

            let activityTypeId: string;

            if (existingType) {
                activityTypeId = existingType.id;
            } else {
                // Create new activity type
                const { data: newType, error: typeError } = await supabase
                    .from('activity_types')
                    .insert({
                        name: selectedActivity.name,
                        category: category,
                        icon_name: 'Circle',
                        color_theme: 'accent-blue',
                        user_id: user.id,
                    })
                    .select('id')
                    .single();

                if (typeError) throw typeError;
                activityTypeId = newType.id;
            }

            // Parse the time and create start_time
            const today = new Date();
            const [hours, minutes] = time.split(':').map(Number);
            const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

            // Parse value as number if possible
            const numericValue = value ? parseFloat(value.replace(/[^\d.-]/g, '')) : null;
            const unit = value ? value.replace(/[\d.-]/g, '').trim() : null;

            // Insert the log (user_id is optional, RLS checks via child ownership)
            const { error: logError } = await supabase
                .from('logs')
                .insert({
                    child_id: memberId,
                    activity_type_id: activityTypeId,
                    start_time: startTime.toISOString(),
                    value: isNaN(numericValue as number) ? null : numericValue,
                    unit: unit || null,
                    note: note || null,
                });

            if (logError) throw logError;

            toast.success(`${selectedActivity.name} logged successfully`);
            setIsLogDialogOpen(false);
        } catch (error) {
            console.error('Error logging activity:', error);
            toast.error('Failed to log activity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCustomActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActivityName.trim()) return;

        const colorOption = COLOR_OPTIONS.find(c => c.value === selectedColor) || COLOR_OPTIONS[0];
        const newActivity: QuickActivity = {
            id: `custom-${Date.now()}`,
            name: newActivityName,
            icon: selectedIcon,
            color: colorOption.color,
            bgColor: colorOption.bgColor,
            isCustom: true,
        };

        setCustomActivities([...customActivities, newActivity]);
        setNewActivityName('');
        setSelectedIcon(mdiHeart);
        setSelectedColor('purple');
        setIsAddDialogOpen(false);
        toast.success('Custom activity added');
    };

    const handleDeleteCustomActivity = (activityId: string) => {
        setCustomActivities(customActivities.filter(a => a.id !== activityId));
        toast.success('Activity removed');
    };

    return (
        <>
            <div className="space-y-6">
                {/* Quick Log Chips */}
                <GlassCard className="p-4">
                    <div className="flex flex-wrap gap-2">
                        {allActivities.map((activity) => (
                            <div key={activity.id} className="relative group">
                                <button
                                    onClick={() => handleActivityClick(activity)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
                                        "hover:scale-105 active:scale-95 cursor-pointer",
                                        "bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10",
                                        "border border-white/20 shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
                                        activity.bgColor
                                    )}>
                                        <Icon path={activity.icon} size={0.6} className={cn("stroke-none", activity.color)} />
                                    </div>
                                    <span className="text-xs font-bold text-brand-deep-gray group-hover:text-brand-black dark:group-hover:text-brand-white transition-colors duration-200">
                                        {activity.name}
                                    </span>
                                </button>

                                {activity.isCustom && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCustomActivity(activity.id);
                                        }}
                                        className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 scale-75"
                                    >
                                        <Icon path={mdiDelete} size={0.4} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add Custom Activity Button */}
                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
                                "hover:scale-105 active:scale-95 cursor-pointer",
                                "bg-brand-blue/10 dark:bg-brand-blue/20 hover:bg-brand-blue/20 dark:hover:bg-brand-blue/30",
                                "border border-dashed border-brand-blue/50 hover:border-brand-blue"
                            )}
                        >
                            <Icon path={mdiPlus} size={0.6} className="text-brand-blue" />
                            <span className="text-xs font-bold text-brand-blue">Add Custom</span>
                        </button>
                    </div>
                </GlassCard>

                {/* Recent Activity View */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-brand-deep-gray uppercase tracking-wider px-2">
                        {t('overview.eventsToday') || 'Recent activity'}
                    </h3>

                    <div className="space-y-2">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <SkeletonCard key={i} className="h-20" />
                            ))
                        ) : recentLogs.length > 0 ? (
                            recentLogs.map((log) => {
                                const iconPath = ICONS[log.activity_type.icon_name] || ICONS["Circle"];
                                const theme = COLOR_THEMES[log.activity_type.color_theme] || COLOR_THEMES["accent-blue"];

                                return (
                                    <GlassCard key={log.id} className="p-4 flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                                                theme.bg, theme.text
                                            )}>
                                                <Icon path={iconPath} size={0.8} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-black dark:text-brand-white">
                                                    {log.activity_type.name}
                                                </p>
                                                <p className="text-xs text-brand-deep-gray">
                                                    {log.value ? `${log.value} ${log.unit || ''}` : tBaby('noDetails')}
                                                    {log.note && ` · ${log.note}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-brand-deep-gray bg-white/50 dark:bg-white/5 px-2 py-1 rounded-lg">
                                            {format(new Date(log.start_time), "HH:mm")}
                                        </div>
                                    </GlassCard>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-brand-deep-gray italic text-sm">
                                {tBaby('noRecordsFound')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Log Activity Dialog */}
            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedActivity && (
                                <>
                                    <div className={cn("p-2 rounded-full", selectedActivity.bgColor)}>
                                        <Icon path={selectedActivity.icon} size={0.8} className={selectedActivity.color} />
                                    </div>
                                    Log {selectedActivity.name}
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="value">Value (optional)</Label>
                            <Input
                                id="value"
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="e.g., 98.6°F, 2 tablets, 30 min"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add any additional notes..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsLogDialogOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Log Activity'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Custom Activity Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Custom Activity</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddCustomActivity} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="activityName">Activity Name</Label>
                            <Input
                                id="activityName"
                                value={newActivityName}
                                onChange={(e) => setNewActivityName(e.target.value)}
                                placeholder="e.g., Yoga, Reading"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="grid grid-cols-6 gap-2">
                                {ICON_OPTIONS.map((iconOption) => (
                                    <button
                                        key={iconOption.label}
                                        type="button"
                                        onClick={() => setSelectedIcon(iconOption.value)}
                                        className={cn(
                                            "p-3 rounded-lg border-2 transition-all",
                                            selectedIcon === iconOption.value
                                                ? "border-brand-blue bg-brand-blue/10"
                                                : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        <Icon path={iconOption.value} size={1} className="text-brand-black dark:text-brand-white" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="grid grid-cols-6 gap-2">
                                {COLOR_OPTIONS.map((colorOption) => (
                                    <button
                                        key={colorOption.value}
                                        type="button"
                                        onClick={() => setSelectedColor(colorOption.value)}
                                        className={cn(
                                            "p-3 rounded-lg border-2 transition-all",
                                            selectedColor === colorOption.value
                                                ? "border-brand-blue"
                                                : "border-transparent"
                                        )}
                                    >
                                        <div className={cn("w-6 h-6 rounded-full", colorOption.bgColor)} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Add Activity</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
