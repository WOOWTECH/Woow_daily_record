"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, useCallback, Suspense } from "react";

export interface Child {
    id: string;
    name: string;
    dob: Date;
    gender: "boy" | "girl";
    photoUrl: string;
}

interface ChildContextType {
    selectedChild: Child | null;
    children: Child[];
    selectChild: (id: string) => void;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export function ChildProviderInner({ children, initialChildren = [] }: { children: React.ReactNode; initialChildren: Child[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize with server-provided children
    const [childList, setChildList] = useState<Child[]>(initialChildren);

    // Initialize selected ID from URL if present, otherwise default to first child
    const urlChildId = searchParams.get("childId");
    const [selectedChildId, setSelectedChildId] = useState<string>(urlChildId || initialChildren[0]?.id || "");

    // Sync state with URL changes (e.g. back button, manual URL change)
    useEffect(() => {
        const idFromUrl = searchParams.get("childId");
        if (idFromUrl && idFromUrl !== selectedChildId) {
            // Verify the child actually exists in our list before switching
            if (childList.some(c => c.id === idFromUrl)) {
                setSelectedChildId(idFromUrl);
            }
        }
    }, [searchParams, selectedChildId, childList]);

    // Stabilize initialChildren to avoid effect loops from usage in RootLayout
    const initialChildrenStr = JSON.stringify(initialChildren);

    // Update internal list when server props change (e.g. after adding a child and router.refresh())
    // This connects the Server Action -> Client Context loop!
    useEffect(() => {
        setChildList(prev => {
            const prevStr = JSON.stringify(prev);
            // Only update if content actually changed
            if (prevStr !== initialChildrenStr) {
                return initialChildren;
            }
            return prev;
        });
    }, [initialChildrenStr, initialChildren]);

    const selectChild = useCallback((id: string) => {
        setSelectedChildId(id);
        // Create new URLSearchParams to preserve other params if we wanted
        const params = new URLSearchParams(searchParams.toString());
        params.set("childId", id);

        // Update URL to trigger server component re-fetch with new ID
        router.push(`?${params.toString()}`);
        // Force server component to re-render with new data
        router.refresh();
    }, [router, searchParams]);

    const selectedChild = childList.find(c => c.id === selectedChildId) || null;

    return (
        <ChildContext.Provider value={{ selectedChild, children: childList, selectChild }}>
            {children}
        </ChildContext.Provider>
    );
}

export function ChildProvider(props: { children: React.ReactNode; initialChildren: Child[] }) {
    return (
        <Suspense fallback={null}>
            <ChildProviderInner {...props} />
        </Suspense>
    );
}

export function useChild() {
    const context = useContext(ChildContext);
    if (context === undefined) {
        throw new Error("useChild must be used within a ChildProvider");
    }
    return context;
}
