"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // Read token synchronously on mount — avoids needing setState inside an effect
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            setAllowed(true);
        } else {
            router.replace("/login");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!allowed) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <div className="admin-theme-scope min-h-screen">
            <AdminSidebar />
            <main role="main" className="lg:pl-72">
                <div className="sticky top-0 z-30 flex h-14 items-center justify-end px-4 sm:px-6 lg:px-8">
                    <ThemeToggle />
                </div>
                <div className="px-4 pb-8 pt-2 sm:px-6 lg:px-8" id="main-content">{children}</div>
            </main>
        </div>
    );
}
