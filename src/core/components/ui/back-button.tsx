// src/core/components/ui/back-button.tsx
"use client";

import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import { Button } from "./button";

interface BackButtonProps {
    fallbackHref?: string;
    className?: string;
}

export function BackButton({ fallbackHref, className = "" }: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        if (fallbackHref) {
            router.push(fallbackHref);
        } else {
            router.back();
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className={`h-10 w-10 rounded-full text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white hover:bg-brand-gray/30 dark:hover:bg-white/10 cursor-pointer transition-colors ${className}`}
            aria-label="Go back"
        >
            <Icon path={mdiArrowLeft} size={1} />
        </Button>
    );
}
