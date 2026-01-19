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

interface HealthQuickLogProps {
    memberId: string;
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

export function HealthQuickLog({ memberId }: HealthQuickLogProps) {
    const t = useTranslations('health');
    const [customActivities, setCustomActivities] = useState<QuickActivity[]>([]);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<QuickActivity | null>(null);

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
        toast.success(`${selectedActivity?.name} logged successfully`);
        setIsLogDialogOpen(false);
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
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-4">
                    {t('quickLog.title') || 'Quick Log'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    {allActivities.map((activity) => (
                        <div key={activity.id} className="relative group">
                            <button
                                onClick={() => handleActivityClick(activity)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl transition-all duration-200 w-full",
                                    "hover:scale-105 active:scale-95 cursor-pointer",
                                    "bg-brand-gray/30 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10",
                                    "hover:shadow-lg hover:shadow-brand-blue/20"
                                )}
                            >
                                <div className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
                                    activity.bgColor
                                )}>
                                    <Icon path={activity.icon} size={1} className={cn("stroke-none", activity.color)} />
                                </div>
                                <span className="text-xs font-semibold text-brand-deep-gray group-hover:text-brand-black dark:group-hover:text-brand-white transition-colors duration-200">
                                    {activity.name}
                                </span>
                            </button>

                            {activity.isCustom && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCustomActivity(activity.id);
                                    }}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <Icon path={mdiDelete} size={0.5} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Add Custom Activity Button */}
                    <button
                        onClick={() => setIsAddDialogOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl transition-all duration-200",
                            "hover:scale-105 active:scale-95 cursor-pointer",
                            "bg-brand-blue/10 dark:bg-brand-blue/20 hover:bg-brand-blue/20 dark:hover:bg-brand-blue/30",
                            "border-2 border-dashed border-brand-blue/50 hover:border-brand-blue"
                        )}
                    >
                        <Icon path={mdiPlus} size={1.5} className="text-brand-blue" />
                        <span className="text-xs font-semibold text-brand-blue">Add Custom</span>
                    </button>
                </div>
            </GlassCard>

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
                            <Button type="button" variant="outline" onClick={() => setIsLogDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Log Activity</Button>
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
