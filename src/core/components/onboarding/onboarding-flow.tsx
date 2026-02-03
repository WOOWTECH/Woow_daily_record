// src/core/components/onboarding/onboarding-flow.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import {
  mdiDomain,
  mdiCheckCircle,
  mdiAccountGroup,
  mdiHomeAutomation,
  mdiChartLine,
  mdiArrowRight,
  mdiArrowLeft,
} from "@mdi/js";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { useCreateSite } from "@/core/hooks/use-sites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OnboardingStep = "welcome" | "create" | "complete";

export function OnboardingFlow() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const createSite = useCreateSite();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdSiteName, setCreatedSiteName] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle step transitions with animation
  const goToStep = (newStep: OnboardingStep) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setIsAnimating(false);
    }, 150);
  };

  const handleCreateSite = async () => {
    if (!siteName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setIsCreating(true);
    try {
      const site = await createSite(siteName.trim());
      if (site) {
        setCreatedSiteName(siteName);
        goToStep("complete");
      } else {
        toast.error(t("createError"));
      }
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnterSite = () => {
    router.push("/");
  };

  const features = [
    { icon: mdiAccountGroup, labelKey: "featureMembers" },
    { icon: mdiHomeAutomation, labelKey: "featureHA" },
    { icon: mdiChartLine, labelKey: "featureTracking" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue/5 via-white to-brand-blue/10 dark:from-brand-black dark:via-brand-black dark:to-brand-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Welcome Step */}
        {step === "welcome" && (
          <div
            className={cn(
              "bg-white/80 dark:bg-brand-gray/20 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20",
              "transition-all duration-300 ease-out",
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="h-20 w-20 rounded-2xl bg-brand-blue mx-auto flex items-center justify-center mb-6">
                <span className="text-white font-bold text-3xl">W</span>
              </div>
              <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white mb-2">
                {t("welcomeTitle")}
              </h1>
              <p className="text-brand-deep-gray dark:text-gray-400">
                {t("welcomeSubtitle")}
              </p>
            </div>

            {/* Features preview */}
            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-brand-blue/5 dark:bg-white/5"
                >
                  <div className="h-10 w-10 rounded-lg bg-brand-blue/10 dark:bg-brand-blue/20 flex items-center justify-center">
                    <Icon
                      path={feature.icon}
                      size={0.9}
                      className="text-brand-blue"
                    />
                  </div>
                  <span className="text-brand-black dark:text-brand-white font-medium">
                    {t(feature.labelKey)}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => goToStep("create")}
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-medium rounded-xl"
            >
              {t("getStarted")}
              <Icon path={mdiArrowRight} size={0.8} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Create Step */}
        {step === "create" && (
          <div
            className={cn(
              "bg-white/80 dark:bg-brand-gray/20 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20",
              "transition-all duration-300 ease-out",
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/20 mx-auto flex items-center justify-center mb-4">
                <Icon
                  path={mdiDomain}
                  size={1.5}
                  className="text-brand-blue"
                />
              </div>
              <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white mb-2">
                {t("createTitle")}
              </h2>
              <p className="text-brand-deep-gray dark:text-gray-400">
                {t("createSubtitle")}
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5 mb-8">
              <div className="space-y-2">
                <Label htmlFor="site-name" className="text-brand-black dark:text-brand-white">
                  {t("siteName")}
                </Label>
                <Input
                  id="site-name"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder={t("siteNamePlaceholder")}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-desc" className="text-brand-black dark:text-brand-white">
                  {t("siteDescription")}
                </Label>
                <Textarea
                  id="site-desc"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder={t("siteDescPlaceholder")}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => goToStep("welcome")}
                className="flex-1 h-12 rounded-xl"
              >
                <Icon path={mdiArrowLeft} size={0.8} className="mr-2" />
                {t("back")}
              </Button>
              <Button
                onClick={handleCreateSite}
                disabled={!siteName.trim() || isCreating}
                className="flex-1 h-12 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl"
              >
                {isCreating ? t("creating") : t("createSite")}
                {!isCreating && (
                  <Icon path={mdiArrowRight} size={0.8} className="ml-2" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div
            className={cn(
              "bg-white/80 dark:bg-brand-gray/20 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20",
              "transition-all duration-300 ease-out",
              isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}
          >
            {/* Success icon */}
            <div className="text-center mb-8">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center mb-6 animate-bounce-in">
                <Icon
                  path={mdiCheckCircle}
                  size={2.5}
                  className="text-green-500"
                />
              </div>
              <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white mb-2">
                {t("completeTitle")}
              </h2>
              <p className="text-brand-deep-gray dark:text-gray-400">
                {t("completeSubtitle", { name: createdSiteName })}
              </p>
            </div>

            {/* Next steps */}
            <div className="bg-brand-blue/5 dark:bg-white/5 rounded-2xl p-5 mb-8">
              <p className="text-sm font-medium text-brand-black dark:text-brand-white mb-3">
                {t("nextSteps")}
              </p>
              <ul className="space-y-2 text-sm text-brand-deep-gray dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                  {t("stepInvite")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                  {t("stepHA")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                  {t("stepRecord")}
                </li>
              </ul>
            </div>

            <Button
              onClick={handleEnterSite}
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-medium rounded-xl"
            >
              {t("enterSite")}
              <Icon path={mdiArrowRight} size={0.8} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {(["welcome", "create", "complete"] as OnboardingStep[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                step === s
                  ? "w-8 bg-brand-blue"
                  : i < ["welcome", "create", "complete"].indexOf(step)
                  ? "w-2 bg-brand-blue/50"
                  : "w-2 bg-brand-gray/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
