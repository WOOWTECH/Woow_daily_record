"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { addGrowthRecord } from "@/app/actions/growth";
import { createCustomMetricType, deleteCustomMetricType } from "@/app/actions/growth";
import { Loader2, X, Plus, Trash2 } from "lucide-react";

interface GrowthFormProps {
    childId: string;
    savedMetrics: { id: string; name: string }[];
}

export function GrowthForm({ childId, savedMetrics }: GrowthFormProps) {
    const [isPending, startTransition] = useTransition();
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

    // Optimistically filter metrics
    const visibleMetrics = savedMetrics.filter(m => !deletedIds.has(m.id));

    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    // headCircumference removed as default

    const [customMetrics, setCustomMetrics] = useState<{ id: string; name: string; value: string }[]>([]);

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            // Append custom metrics to formData
            customMetrics.forEach((metric) => {
                if (metric.name && metric.value) {
                    formData.append(`custom_metric_${metric.name}`, metric.value);
                }
            });

            await addGrowthRecord(formData);

            // Reset form
            setHeight("");
            setWeight("");
            setCustomMetrics([]);
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
            <h2 className="text-xl font-bold text-brand-black dark:text-brand-white mb-6">Add Record</h2>
            <form action={handleSubmit} className="space-y-6">
                <input type="hidden" name="childId" value={childId} />
                <input type="hidden" name="date" value={date} />

                {/* Date Picker (Native for simplicity) */}
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
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
                        <Label htmlFor="height">Height (cm)</Label>
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
                        <Label htmlFor="weight">Weight (kg)</Label>
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
                        <Label>Custom Measurements</Label>
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
                                        <Trash2 className="w-3 h-3" />
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
                                        <X className="w-3 h-3" />
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

                <Button type="submit" disabled={isPending} className="w-full bg-[#6184FD] text-white hover:opacity-90">
                    {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                    Save Record
                </Button>
            </form>
        </GlassCard>
    );
}
