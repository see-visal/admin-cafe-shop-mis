"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminEntryPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        router.replace(token ? "/dashboard" : "/login");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                Redirecting...
            </p>
        </div>
    );
}
