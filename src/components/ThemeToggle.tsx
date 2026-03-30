"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "admin-theme";

function applyTheme(theme: ThemeMode) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<ThemeMode>(() => {
        if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
            return "dark";
        }
        return "light";
    });

    useEffect(() => {
        applyTheme(theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            suppressHydrationWarning
            className="h-9 w-9 rounded-full border-border/80 bg-background/90 shadow-sm backdrop-blur"
        >
            {theme === "dark" ? (
                <SunMedium className="h-4 w-4 text-amber-500" />
            ) : (
                <MoonStar className="h-4 w-4 text-slate-700" />
            )}
        </Button>
    );
}
