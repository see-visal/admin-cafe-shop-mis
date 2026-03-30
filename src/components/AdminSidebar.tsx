"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    Coffee,
    FlaskConical,
    Users,
    ScrollText,
    ChefHat,
    LogOut,
    Menu,
    Tag,
    ChartNoAxesCombined,
    BadgePercent,
    Trophy,
    Star,
    Settings,
    UserSearch,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/store/api/authApi";
import { useGetAdminProfileQuery } from "@/store/api/profileApi";
import { resolveStorageUrl } from "@/lib/storage";

interface NavSection {
    title: string;
    items: { href: string; label: string; icon: React.ElementType; badge?: string }[];
}

const navSections: NavSection[] = [
    {
        title: "Overview",
        items: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/notifications", label: "Notifications", icon: Bell },
        ],
    },
    {
        title: "Operations",
        items: [
            { href: "/orders", label: "Orders", icon: ShoppingBag },
            { href: "/barista", label: "Barista", icon: ChefHat },
        ],
    },
    {
        title: "Catalog",
        items: [
            { href: "/products", label: "Products", icon: Coffee },
            { href: "/categories", label: "Categories", icon: Tag },
            { href: "/ingredients", label: "Inventory", icon: FlaskConical },
        ],
    },
    {
        title: "Customers & Loyalty",
        items: [
            { href: "/customers", label: "Customers", icon: UserSearch },
            { href: "/loyalty", label: "Loyalty", icon: Trophy },
            { href: "/ratings", label: "Ratings", icon: Star },
            { href: "/promos", label: "Promo Codes", icon: BadgePercent },
        ],
    },
    {
        title: "Analytics & Admin",
        items: [
            { href: "/reports", label: "Reports", icon: ChartNoAxesCombined },
            { href: "/users", label: "Staff", icon: Users },
            { href: "/audit", label: "Audit Logs", icon: ScrollText },
            { href: "/settings", label: "Settings", icon: Settings },
        ],
    },
];

function NavContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAppSelector((s) => s.auth.user);
    const [logout] = useLogoutMutation();
    const { data: profile } = useGetAdminProfileQuery();

    const avatarSrc = resolveStorageUrl(profile?.profileImage);

    const displayName = profile?.givenName && profile?.familyName
        ? `${profile.givenName} ${profile.familyName}`
        : user?.givenName && user?.familyName
        ? `${user.givenName} ${user.familyName}`
        : profile?.username ?? user?.username ?? "Admin";

    const initials = profile?.givenName
        ? `${profile.givenName[0]}${profile.familyName?.[0] ?? ""}`.toUpperCase()
        : user?.givenName?.slice(0, 1).toUpperCase()
        ?? user?.username?.slice(0, 2).toUpperCase()
        ?? "AD";

    return (
        <div className="flex h-full flex-col gap-0">
            {/* Logo */}
            <div className="flex h-18 shrink-0 items-center gap-3 border-b border-border/80 px-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
                    <img src="/salsee.png" alt="SalSee Logo" className="w-full h-full object-contain p-0.5" />
                </div>
                <div>
                    <p className="text-sm font-semibold leading-none text-foreground">Coffee Admin</p>
                    <p className="text-xs text-muted-foreground">Management Portal</p>
                </div>
            </div>

            {/* Navigation — scrollable */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
                {navSections.map((section, sIdx) => (
                    <div key={section.title} className={cn(sIdx > 0 && "mt-4")}>
                        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            {section.title}
                        </p>
                        <ul className="space-y-0.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = pathname.startsWith(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                                active
                                                    ? "border border-amber-200/70 bg-amber-50 text-amber-700 shadow-sm"
                                                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge && (
                                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <Separator />

            {/* User Footer */}
            <div className="flex items-center gap-3 p-4 shrink-0">
                <Link href="/profile" title="View my profile">
                    <Avatar className="h-8 w-8 hover:ring-2 hover:ring-amber-400 transition-all">
                        <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.roles?.[0] ?? user?.roles?.[0] ?? "ADMIN"}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={async () => {
                        try {
                            await logout().unwrap();
                        } catch (error) {
                            console.error("Logout failed:", error);
                        } finally {
                            router.push("/login");
                        }
                    }}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function AdminSidebar() {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="glass-sidebar hidden border-r lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <NavContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <NavContent />
                </SheetContent>
            </Sheet>
        </>
    );
}
