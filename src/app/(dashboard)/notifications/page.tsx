"use client";

import { useState, useMemo } from "react";
import {
    Bell, CheckCheck, Trash2,
    ShoppingBag, Package, Users, Trophy, Settings, CreditCard,
    Star, XCircle, Megaphone, Loader,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useGetNotificationsQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";

/* ── Types ─────────────────────────────────────────────────── */
type NotifType = "order" | "stock" | "payment" | "loyalty" | "system" | "review" | "staff" | "promo";

interface Notification {
    id: string;
    type: NotifType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    priority: "low" | "medium" | "high";
    createdAt: string;
}

interface NotificationApiItem {
    id: string;
    type?: string;
    title: string;
    message: string;
    priority?: string;
    read: boolean;
    createdAt: string;
}

/* ── Config ────────────────────────────────────────────────── */
const TYPE_META: Record<NotifType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    order: { label: "Orders", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    stock: { label: "Inventory", icon: Package, color: "text-red-600", bg: "bg-red-100" },
    payment: { label: "Payments", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100" },
    loyalty: { label: "Loyalty", icon: Trophy, color: "text-amber-600", bg: "bg-amber-100" },
    system: { label: "System", icon: Settings, color: "text-purple-600", bg: "bg-purple-100" },
    review: { label: "Reviews", icon: Star, color: "text-yellow-600", bg: "bg-yellow-100" },
    staff: { label: "Staff", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    promo: { label: "Promos", icon: Megaphone, color: "text-pink-600", bg: "bg-pink-100" },
};

const PRIORITY_COLORS: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-stone-100 text-stone-500 border-stone-200",
};

function normalizeType(value?: string): NotifType {
    const normalized = (value ?? "").toLowerCase();
    return normalized in TYPE_META ? (normalized as NotifType) : "system";
}

function normalizePriority(value?: string): "low" | "medium" | "high" {
    const normalized = (value ?? "").toLowerCase();
    return normalized === "high" || normalized === "medium" || normalized === "low" ? normalized : "low";
}

/* ── API Hooks ───────────────────────────────────────────── */
// Data is now fetched from backend via RTK Query

/* ── Time Ago Helper ───────────────────────────────────────── */
function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

/* ── Page ──────────────────────────────────────────────────── */
export default function NotificationsPage() {
    const [typeFilter, setTypeFilter] = useState<NotifType | "">("");
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const page = 0;

    // Fetch notifications from API
    const queryParams = {
        page,
        size: 50,
        type: typeFilter || undefined,
    };

    const { data: response, isLoading, error } = useGetNotificationsQuery(queryParams, {
        pollingInterval: 10000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [deleteNotif] = useDeleteNotificationMutation();

    // Transform API response to internal format
    const notifications: Notification[] = useMemo(() => {
        if (!response?.content) return [];
        return response.content.map((n: NotificationApiItem) => ({
            id: n.id,
            type: normalizeType(n.type),
            title: n.title,
            message: n.message,
            timestamp: n.createdAt,
            read: n.read,
            priority: normalizePriority(n.priority),
            createdAt: n.createdAt,
        }));
    }, [response]);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const currentDate = useMemo(() => new Date(), []);

    const filtered = useMemo(() => {
        return showUnreadOnly ? notifications.filter((n) => !n.read) : notifications;
    }, [notifications, showUnreadOnly]);

    async function handleMarkRead(id: string) {
        try {
            await markAsRead(id).unwrap();
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    }

    async function handleMarkAllRead() {
        try {
            await markAllAsRead(undefined).unwrap();
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    }

    async function handleDeleteNotif(id: string) {
        try {
            await deleteNotif(id).unwrap();
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    }

    /* Group by date */
    const today = currentDate.toDateString();
    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();
    
    const grouped = useMemo(() => {
        const groups: { label: string; items: Notification[] }[] = [];

        filtered.forEach((n) => {
            const d = new Date(n.timestamp).toDateString();
            const label = d === today ? "Today" : d === yesterday ? "Yesterday" : new Date(n.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
            const existing = groups.find((g) => g.label === label);
            if (existing) existing.items.push(n);
            else groups.push({ label, items: [n] });
        });

        return groups;
    }, [filtered, today, yesterday]);

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
            {/* Loading State */}
            {isLoading && (
                <Card className="rounded-2xl shadow-lg glass border-amber-100">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center text-stone-400">
                        <Loader size={32} className="text-amber-500 animate-spin mb-4" />
                        <p className="text-base font-bold text-stone-500">Loading notifications...</p>
                    </CardContent>
                </Card>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <Card className="rounded-2xl shadow-lg glass border-red-100">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center text-red-400">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mb-4">
                            <XCircle size={28} className="text-red-500" />
                        </div>
                        <p className="text-base font-bold text-red-600">Failed to load notifications</p>
                        <p className="text-sm mt-1">Please try again later</p>
                    </CardContent>
                </Card>
            )}

            {/* Content */}
            {!isLoading && !error && (
                <>
                {/* Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap p-4 rounded-2xl glass">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                            <Bell size={22} />
                        </div>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-stone-900">Notifications</h1>
                        <p className="text-sm text-stone-400 font-medium">
                            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={handleMarkAllRead} className="gap-2 rounded-xl text-sm">
                            <CheckCheck size={14} /> Mark all read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button variant="outline" onClick={() => notifications.forEach(n => handleDeleteNotif(n.id))} className="gap-2 rounded-xl text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 size={14} /> Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Type Filter pills */}
            <div className="flex gap-2 flex-wrap glass rounded-2xl p-3">
                <button
                    onClick={() => { setTypeFilter(""); setShowUnreadOnly(false); }}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${!typeFilter && !showUnreadOnly ? "bg-stone-900 text-white shadow-sm" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setShowUnreadOnly((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${showUnreadOnly ? "bg-amber-500 text-white shadow-sm" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                >
                    <Bell size={11} /> Unread ({unreadCount})
                </button>
                {(Object.entries(TYPE_META) as [NotifType, (typeof TYPE_META)[NotifType]][]).map(([type, meta]) => {
                    const count = notifications.filter((n) => n.type === type).length;
                    if (count === 0) return null;
                    const Icon = meta.icon;
                    return (
                        <button
                            key={type}
                            onClick={() => setTypeFilter((v) => (v === type ? "" : type))}
                            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${typeFilter === type
                                ? `${meta.bg} ${meta.color} shadow-sm ring-1 ring-current/20`
                                : "bg-stone-50 text-stone-400 hover:bg-stone-100"
                                }`}
                        >
                            <Icon size={11} /> {meta.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* ── Notification List ────────────────────────────────── */}
            {grouped.length === 0 ? (
                <Card className="rounded-2xl shadow-lg glass border-amber-100">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center text-stone-400">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 mb-4">
                            <Bell size={28} className="text-stone-300" />
                        </div>
                        <p className="text-base font-bold text-stone-500">No notifications</p>
                        <p className="text-sm mt-1">You&apos;re all caught up! 🎉</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {grouped.map((group) => (
                        <div key={group.label}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 px-1">{group.label}</p>
                            <div className="space-y-2">
                                {group.items.map((n) => {
                                    const meta = TYPE_META[n.type];
                                    const Icon = meta.icon;
                                    return (
                                        <Card
                                            key={n.id}
                                            className={`rounded-xl shadow-lg glass transition-all hover:shadow-xl cursor-pointer ${!n.read ? "border-l-4 border-l-amber-500 glass" : "glass"}`}
                                            onClick={() => handleMarkRead(n.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.bg} ${meta.color} shrink-0 mt-0.5`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className={`text-sm font-bold ${!n.read ? "text-stone-900" : "text-stone-700"}`}>{n.title}</h3>
                                                                <Badge variant="outline" className={`text-[9px] font-bold ${PRIORITY_COLORS[n.priority]}`}>
                                                                    {n.priority}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className="text-[11px] text-stone-400 font-medium whitespace-nowrap">{timeAgo(n.timestamp)}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 rounded-md"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n.id); }}
                                                                >
                                                                    <XCircle size={12} className="text-stone-300 hover:text-red-400" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <p className={`text-xs mt-1 leading-relaxed ${!n.read ? "text-stone-600" : "text-stone-400"}`}>{n.message}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary" className={`text-[9px] ${meta.bg} ${meta.color} border-0`}>
                                                                {meta.label}
                                                            </Badge>
                                                            {!n.read && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> New
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </>
            )}
        </div>
    );
}
