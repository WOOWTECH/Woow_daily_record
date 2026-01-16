"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

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

export function ChildProvider({ children, initialChildren = [] }: { children: React.ReactNode; initialChildren: Child[] }) {
    const router = useRouter();
    // Initialize with server-provided children
    const [childList, setChildList] = useState<Child[]>(initialChildren);
    const [selectedChildId, setSelectedChildId] = useState<string>(initialChildren[0]?.id || "");

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
        // Update URL to trigger server component re-fetch with new ID
        router.push(`?childId=${id}`);
        router.refresh();
    }, [router]);

    const selectedChild = childList.find(c => c.id === selectedChildId) || null;

    return (
        <ChildContext.Provider value={{ selectedChild, children: childList, selectChild }}>
            {children}
        </ChildContext.Provider>
    );
}

export function useChild() {
    const context = useContext(ChildContext);
    if (context === undefined) {
        throw new Error("useChild must be used within a ChildProvider");
    }
    return context;
}
