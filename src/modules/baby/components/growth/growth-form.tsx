"use client";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { GlassCard } from "@/core/components/glass-card";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { addGrowthRecord, updateGrowthRecord } from "@/app/actions/growth";
import { createCustomMetricType, deleteCustomMetricType } from "@/app/actions/growth";
import Icon from "@mdi/react";
import { mdiLoading, mdiClose, mdiPlus, mdiDelete } from "@mdi/js";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface GrowthFormProps {
    childId: string;
    savedMetrics: { id: string; name: string }[];
    existingRecord?: {
        id: string;
        date: string;
        height?: number;
        weight?: number;
        headCircumference?: number;
        customMeasurements?: Record<string, number>;
    } | null;
    onClose?: () => void;
}

export function GrowthForm({ childId, savedMetrics, existingRecord, onClose }: GrowthFormProps) {
    const [isPending, startTransition] = useTransition();
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const t = useTranslations('baby.growth');

    // Optimistically filter metrics
    const visibleMetrics = savedMetrics.filter(m => !deletedIds.has(m.id));

    const isEditMode = !!existingRecord;

    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    // headCircumference removed as default

    const [customMetrics, setCustomMetrics] = useState<{ id: string; name: string; value: string }[]>([]);

    // Pre-fill form when editing
    useEffect(() => {
        if (existingRecord) {
            setDate(existingRecord.date);
            setHeight(existingRecord.height?.toString() || "");
            setWeight(existingRecord.weight?.toString() || "");

            // Pre-fill custom metrics
            if (existingRecord.customMeasurements) {
                const metrics = Object.entries(existingRecord.customMeasurements).map(([name, value]) => ({
                    id: crypto.randomUUID(),
                    name,
                    value: value.toString()
                }));
                setCustomMetrics(metrics);
            }
        }
    }, [existingRecord]);

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            // Append custom metrics to formData
            customMetrics.forEach((metric) => {
                if (metric.name && metric.value) {
                    formData.append(`custom_metric_${metric.name}`, metric.value);
                }
            });

            if (isEditMode && existingRecord) {
                formData.append("recordId", existingRecord.id);
                await updateGrowthRecord(formData);
                onClose?.();
            } else {
                await addGrowthRecord(formData);
                // Reset form
                setHeight("");
                setWeight("");
                setCustomMetrics([]);
            }
        });
    }

    // Helper to update custom metric value
    const updateCustomMetricValue = (id: string, value: string) => {
        setCustomMetrics(prev => prev.map(m => m.id === id ? { ...m, value } : m));
    };

    const removeCustomMetric = (id: string) => {
        setCustomMetrics(customMetrics.filter((m) => m.id !== id));
    };

    return (
        <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-brand-black dark:text-brand-white mb-6">{isEditMode ? t('editRecord') : t('addRecord')}</h2>
            <form action={handleSubmit} className="space-y-6">
                <input type="hidden" name="childId" value={childId} />
                <input type="hidden" name="date" value={date} />

                {/* Date Picker (Native for simplicity) */}
                <div className="space-y-2">
                    <Label htmlFor="date">{t('date')}</Label>
                    <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-brand-gray/50 dark:bg-white/5 border-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="height">{t('heightCm')}</Label>
                        <Input
                            id="height"
                            name="height" // Native form handling uses name
                            type="number"
                            step="0.1"
                            placeholder="e.g. 75"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="bg-brand-gray/50 dark:bg-white/5 border-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="weight">{t('weightKg')}</Label>
                        <Input
                            id="weight"
                            name="weight"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 9.5"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="bg-brand-gray/50 dark:bg-white/5 border-none"
                        />
                    </div>
                </div>

                {/* Custom Metrics Section */}
                <div className="space-y-4 pt-4 border-t border-brand-gray dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <Label>{t('customMeasurements')}</Label>
                    </div>

                    {/* Saved Metrics Chips */}
                    {visibleMetrics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {visibleMetrics.map(metric => (
                                <div key={metric.id} className="group relative flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Add to custom metrics if not already there
                                            if (!customMetrics.find(m => m.name === metric.name)) {
                                                setCustomMetrics(prev => [...prev, { id: crypto.randomUUID(), name: metric.name, value: "" }]);
                                            }
                                        }}
                                        className="bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-xs px-3 py-1.5 rounded-full pr-8 transition-colors font-medium border border-transparent hover:border-brand-blue/30"
                                    >
                                        + {metric.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletedIds(prev => {
                                                const next = new Set(prev);
                                                next.add(metric.id);
                                                return next;
                                            });
                                            startTransition(async () => {
                                                await deleteCustomMetricType(metric.id);
                                            });
                                        }}
                                        className="absolute right-1 p-1 text-brand-blue/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <Icon path={mdiDelete} size={0.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Create New Type */}
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Save new metric type (e.g. Foot Size)..."
                            className="h-9 text-xs bg-brand-gray/50 dark:bg-white/5 border-none"
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                        e.currentTarget.value = "";
                                        startTransition(async () => {
                                            await createCustomMetricType(childId, val);
                                        });
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Active Custom Metrics Inputs */}
                    <div className="space-y-4">
                        {customMetrics.map((metric) => (
                            <div key={metric.id} className="space-y-2 relative group">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`custom-${metric.id}`}>{metric.name}</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeCustomMetric(metric.id)}
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                    >
                                        <Icon path={mdiClose} size={0.5} />
                                    </Button>
                                </div>
                                <Input
                                    id={`custom-${metric.id}`}
                                    type="number"
                                    step="any"
                                    placeholder={`Enter ${metric.name}`}
                                    value={metric.value}
                                    onChange={(e) => updateCustomMetricValue(metric.id, e.target.value)}
                                    className="bg-brand-gray/50 dark:bg-white/5 border-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    {isEditMode && onClose && (
                        <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                            {t('cancel')}
                        </Button>
                    )}
                    <Button type="submit" disabled={isPending} className="flex-1 bg-[#6184FD] text-white hover:opacity-90">
                        {isPending ? <Icon path={mdiLoading} size={0.8} spin className="mr-2" /> : null}
                        {t('saveRecord')}
                    </Button>
                </div>
            </form>
        </GlassCard>
    );
}
