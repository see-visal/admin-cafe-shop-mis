"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGetAdminProductsQuery } from "@/store/api/productsApi";
import { useGetProductAverageRatingQuery, useGetProductRatingsQuery } from "@/store/api/managementApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, RefreshCw, MessageSquare, TrendingUp, Search, Sparkles, Clock3, Radio, Zap, AlertTriangle, TrendingDown } from "lucide-react";

function Stars({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`h-4 w-4 ${value >= n ? "fill-amber-500 text-amber-500" : "text-stone-300 dark:text-stone-600"}`}
                />
            ))}
        </div>
    );
}

function getSeverity(stars: number): { label: string; className: string } {
    if (stars <= 1) {
        return {
            label: "Needs follow-up",
            className: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/12 dark:text-red-200",
        };
    }
    if (stars === 2) {
        return {
            label: "Watch closely",
            className: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/12 dark:text-orange-200",
        };
    }
    return {
        label: "Positive",
        className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200",
    };
}

function getMood(average: number, total: number): { label: string; note: string; className: string } {
    if (total === 0) {
        return {
            label: "Waiting for signal",
            note: "No guest feedback yet for this drink.",
            className: "border-stone-200 bg-stone-50 text-stone-700 dark:border-white/10 dark:bg-white/6 dark:text-stone-100",
        };
    }
    if (average >= 4.4) {
        return {
            label: "Guests love this",
            note: "The drink is landing consistently well.",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200",
        };
    }
    if (average >= 3.5) {
        return {
            label: "Mixed feedback",
            note: "Some guests are happy, but consistency may be slipping.",
            className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200",
        };
    }
    return {
        label: "At risk",
        note: "This product needs recipe or handoff attention soon.",
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/12 dark:text-red-200",
    };
}

export default function RatingsPage() {
    const { data: productPage, isLoading: productsLoading } = useGetAdminProductsQuery({ page: 0, size: 200 });
    const products = useMemo(() => productPage?.content ?? [], [productPage]);

    const [selectedProductId, setSelectedProductId] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [reviewSearch, setReviewSearch] = useState("");
    const [starFilter, setStarFilter] = useState<number | "all">("all");
    const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
    const [quickFilter, setQuickFilter] = useState<"none" | "low" | "comments" | "recent" | "praise">("none");
    const [liveMode, setLiveMode] = useState(true);
    const [newRatingNotice, setNewRatingNotice] = useState<string | null>(null);
    const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
    const prevRatingCountRef = useRef(0);

    const filteredProducts = useMemo(() => {
        const search = productSearch.trim().toLowerCase();
        if (!search) return products;
        return products.filter((product) => product.name.toLowerCase().includes(search));
    }, [productSearch, products]);

    const effectiveProductId = selectedProductId || products[0]?.id || "";

    const {
        data: avg,
        isLoading: avgLoading,
        refetch: refetchAvg,
        isFetching: fetchingAvg,
        fulfilledTimeStamp: avgSyncedAt,
    } = useGetProductAverageRatingQuery(effectiveProductId, {
        skip: !effectiveProductId,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        pollingInterval: liveMode ? 5_000 : 30_000,
    });

    const {
        data: ratings,
        isLoading: ratingsLoading,
        refetch: refetchRatings,
        isFetching: fetchingRatings,
        fulfilledTimeStamp: ratingsSyncedAt,
    } = useGetProductRatingsQuery(effectiveProductId, {
        skip: !effectiveProductId,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        pollingInterval: liveMode ? 5_000 : 30_000,
    });

    const selectedProductName = products.find((p) => p.id === effectiveProductId)?.name ?? "Product";
    const isRefreshing = fetchingAvg || fetchingRatings;
    const allRatings = useMemo(() => ratings ?? [], [ratings]);
    const latestSyncMs = Math.max(avgSyncedAt ?? 0, ratingsSyncedAt ?? 0);

    const lastSyncedLabel = useMemo(() => {
        const latest = Math.max(avgSyncedAt ?? 0, ratingsSyncedAt ?? 0);
        if (!latest) return null;
        return new Date(latest).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }, [avgSyncedAt, ratingsSyncedAt]);

    useEffect(() => {
        if (!effectiveProductId) return;

        const previous = prevRatingCountRef.current;
        if (previous > 0 && allRatings.length > previous) {
            const diff = allRatings.length - previous;
            setNewRatingNotice(`${diff} new rating${diff > 1 ? "s" : ""} received`);
        }
        prevRatingCountRef.current = allRatings.length;
    }, [allRatings.length, effectiveProductId]);

    // Auto-fix desyncs instantly if average indicates reviews exist but list is empty.
    useEffect(() => {
        if (!fetchingRatings && !ratingsLoading && allRatings.length === 0 && (avg?.averageStars ?? 0) > 0) {
            refetchRatings();
        }
    }, [fetchingRatings, ratingsLoading, allRatings.length, avg?.averageStars, refetchRatings]);

    const ratingDistribution = useMemo(() => {
        const initial = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
        for (const item of allRatings) {
            if (item.stars >= 1 && item.stars <= 5) {
                initial[item.stars as 1 | 2 | 3 | 4 | 5] += 1;
            }
        }
        return initial;
    }, [allRatings]);

    const positiveCount = useMemo(() => allRatings.filter((item) => item.stars >= 4).length, [allRatings]);
    const positiveShare = allRatings.length ? Math.round((positiveCount / allRatings.length) * 100) : 0;
    const commentedCount = useMemo(
        () => allRatings.filter((item) => (item.comment ?? "").trim().length > 0).length,
        [allRatings]
    );
    const commentCoverage = allRatings.length ? Math.round((commentedCount / allRatings.length) * 100) : 0;
    const lowRatingsCount = useMemo(() => allRatings.filter((item) => item.stars <= 2).length, [allRatings]);
    const lowRatingQueue = useMemo(
        () => allRatings.filter((item) => item.stars <= 2).slice(0, 3),
        [allRatings]
    );
    const displayedAverage = useMemo(() => {
        if (allRatings.length > 0) {
            const total = allRatings.reduce((sum, item) => sum + item.stars, 0);
            return total / allRatings.length;
        }
        return avg?.averageStars ?? 0;
    }, [allRatings, avg?.averageStars]);

    const latestComment = useMemo(() => {
        return allRatings.find((item) => item.comment && item.comment.trim().length > 0)?.comment?.trim() ?? null;
    }, [allRatings]);

    const praiseComments = useMemo(
        () => allRatings.filter((item) => item.stars >= 4 && (item.comment ?? "").trim().length > 0).slice(0, 2),
        [allRatings]
    );

    const oneDayAgo = latestSyncMs > 0 ? latestSyncMs - 24 * 60 * 60 * 1000 : 0;
    const recentRatings = useMemo(
        () => allRatings.filter((item) => new Date(item.createdAt).getTime() >= oneDayAgo),
        [allRatings, oneDayAgo]
    );

    const recentAverage = useMemo(() => {
        if (recentRatings.length === 0) return null;
        return recentRatings.reduce((sum, item) => sum + item.stars, 0) / recentRatings.length;
    }, [recentRatings]);

    const olderRatings = useMemo(
        () => allRatings.filter((item) => new Date(item.createdAt).getTime() < oneDayAgo),
        [allRatings, oneDayAgo]
    );

    const olderAverage = useMemo(() => {
        if (olderRatings.length === 0) return null;
        return olderRatings.reduce((sum, item) => sum + item.stars, 0) / olderRatings.length;
    }, [olderRatings]);

    const trendDelta = recentAverage !== null && olderAverage !== null ? recentAverage - olderAverage : null;
    const mood = useMemo(() => getMood(displayedAverage, allRatings.length), [displayedAverage, allRatings.length]);

    const nextAction = useMemo(() => {
        if (lowRatingsCount > 0 && allRatings.some((item) => item.stars <= 2 && (item.comment ?? "").trim().length > 0)) {
            return `Start with the latest low-rating comments for ${selectedProductName}. Guests are telling us what felt off.`;
        }
        if (lowRatingsCount > 0) {
            return `There are low ratings without comments for ${selectedProductName}. Check recipe consistency, temperature, and pickup timing on the next few orders.`;
        }
        if (commentCoverage < 40 && allRatings.length >= 5) {
            return "Ask the team to invite short comments after handoff so stars come with clearer context.";
        }
        if (positiveShare >= 85 && allRatings.length >= 8) {
            return `${selectedProductName} is landing well. Consider featuring it more while guest sentiment is strong.`;
        }
        return "Keep using this board to catch early shifts in quality, freshness, or handoff experience before they become a trend.";
    }, [allRatings, commentCoverage, lowRatingsCount, positiveShare, selectedProductName]);

    const trendLabel = useMemo(() => {
        if (trendDelta === null) return "Building signal";
        if (trendDelta >= 0.25) return "Improving";
        if (trendDelta <= -0.25) return "Slipping";
        return "Steady";
    }, [trendDelta]);

    const quickFilterCounts = useMemo(() => {
        return {
            low: allRatings.filter((item) => item.stars <= 2).length,
            comments: allRatings.filter((item) => (item.comment ?? "").trim().length > 0).length,
            recent: recentRatings.length,
            praise: praiseComments.length,
        };
    }, [allRatings, praiseComments.length, recentRatings.length]);

    const displayedRatings = useMemo(() => {
        const term = reviewSearch.trim().toLowerCase();
        const filtered = allRatings.filter((item) => {
            if (starFilter !== "all" && item.stars !== starFilter) return false;

            if (quickFilter === "low" && item.stars > 2) return false;
            if (quickFilter === "comments" && !(item.comment ?? "").trim()) return false;
            if (quickFilter === "recent" && new Date(item.createdAt).getTime() < oneDayAgo) return false;
            if (quickFilter === "praise" && !(item.stars >= 4 && (item.comment ?? "").trim())) return false;

            if (!term) return true;
            return (
                item.comment?.toLowerCase().includes(term) ||
                item.orderId.toLowerCase().includes(term)
            );
        });

        const sorted = [...filtered];
        sorted.sort((a, b) => {
            if (sortBy === "highest") return b.stars - a.stars;
            if (sortBy === "lowest") return a.stars - b.stars;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return sorted;
    }, [allRatings, oneDayAgo, quickFilter, reviewSearch, starFilter, sortBy]);

    const latestRatingTime = allRatings.length
        ? new Date(
            allRatings.reduce((latest, current) => (
                new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest
            )).createdAt
        ).toLocaleString()
        : "No ratings yet";

    const activeFilterCount = [
        reviewSearch.trim().length > 0,
        starFilter !== "all",
        sortBy !== "newest",
        quickFilter !== "none",
    ].filter(Boolean).length;

    const quickFilterOptions: Array<{
        id: "low" | "comments" | "recent" | "praise";
        label: string;
        hint: string;
        count: number;
        activeClassName: string;
    }> = [
        {
            id: "low",
            label: "Needs follow-up",
            hint: "Only 1-2 star reviews",
            count: quickFilterCounts.low,
            activeClassName: "border-red-300 bg-red-50 text-red-700",
        },
        {
            id: "comments",
            label: "Comments only",
            hint: "Show written feedback",
            count: quickFilterCounts.comments,
            activeClassName: "border-emerald-300 bg-emerald-50 text-emerald-700",
        },
        {
            id: "recent",
            label: "Last 24h",
            hint: "Focus on fresh issues",
            count: quickFilterCounts.recent,
            activeClassName: "border-blue-300 bg-blue-50 text-blue-700",
        },
        {
            id: "praise",
            label: "Praise",
            hint: "Positive comments worth repeating",
            count: quickFilterCounts.praise,
            activeClassName: "border-amber-300 bg-amber-50 text-amber-700",
        },
    ];

    function handleRefresh() {
        refetchAvg();
        refetchRatings();
    }

    function resetReviewFilters() {
        setReviewSearch("");
        setStarFilter("all");
        setSortBy("newest");
        setQuickFilter("none");
    }

    async function handleCopyOrderId(orderId: string) {
        try {
            await navigator.clipboard.writeText(orderId);
            setCopiedOrderId(orderId);
            setTimeout(() => {
                setCopiedOrderId((current) => (current === orderId ? null : current));
            }, 1500);
        } catch {
            // Keep silent if clipboard is blocked by browser permissions.
        }
    }

    return (
        <div className="ratings-page-shell relative space-y-8 animate-fade-in">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/12" />
                <div className="absolute top-32 right-0 h-64 w-64 rounded-full bg-orange-100/70 blur-3xl dark:bg-orange-500/10" />
            </div>

            <div className="ratings-hero flex flex-col gap-5 rounded-[2rem] border border-orange-100 bg-linear-to-r from-[#fff7ed] via-white to-[#fffaf2] p-6 shadow-[0_10px_36px_rgba(120,53,15,0.08)] lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-300">
                        <span>Guests</span>
                        <span>/</span>
                        <span>Ratings</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2e1505] text-amber-500 shadow-xl shadow-amber-900/30">
                            <Star size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black leading-none tracking-tight text-stone-900 dark:text-stone-50">Coffee Shop Feedback Board</h1>
                            <p className="mt-1.5 max-w-2xl text-sm font-medium text-stone-500 dark:text-stone-300">Use guest ratings to catch quality issues early, protect handoff consistency, and notice which drinks are winning people over.</p>
                        </div>
                    </div>
                    <div className="ratings-hero-panel rounded-2xl border border-stone-200 bg-white/80 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-300">Next best action</p>
                        <p className="mt-2 text-sm text-stone-700 dark:text-stone-100">{nextAction}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                    <button
                        onClick={() => setLiveMode((prev) => !prev)}
                        className={`flex h-10 items-center gap-2 rounded-2xl border px-4 text-xs font-bold transition-all ${liveMode
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-stone-200 bg-white text-stone-600"
                            }`}
                    >
                        {liveMode ? <Radio size={13} /> : <Zap size={13} />}
                        {liveMode ? "Live: 5s" : "Standard: 30s"}
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex h-10 items-center gap-2 rounded-2xl border border-amber-200 bg-white px-5 text-xs font-bold text-stone-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            {(newRatingNotice || lastSyncedLabel) && (
                <div className="ratings-live-banner flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs">
                    <p className="font-semibold text-stone-600 dark:text-stone-200">
                        {newRatingNotice ?? "Watching for new guest feedback..."}
                    </p>
                    {lastSyncedLabel && (
                        <p className="text-stone-500 dark:text-stone-400">
                            Last sync: {lastSyncedLabel}
                        </p>
                    )}
                </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                {/* Product picker */}
                <Card className="ratings-surface-card rounded-[2rem] border-0 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                    <CardHeader className="px-6 pb-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-stone-700">1. Choose a drink</CardTitle>
                                <CardDescription className="mt-1 text-xs">Start with one menu item so the review board stays focused and easy for staff to understand.</CardDescription>
                            </div>
                            <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-bold text-stone-600">
                                {filteredProducts.length} menu match{filteredProducts.length === 1 ? "" : "es"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6">
                        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Find drink</p>
                                <div className="relative">
                                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Search product name"
                                        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 text-sm font-medium text-stone-800 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                    />
                                </div>
                                <p className="text-xs text-stone-500">Use this when your menu is long and you need to find a product fast.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Active review board</p>
                                <select
                                    value={effectiveProductId}
                                    onChange={(e) => {
                                        setSelectedProductId(e.target.value);
                                        resetReviewFilters();
                                        setNewRatingNotice(null);
                                    }}
                                    className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-800 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                >
                                    {productsLoading ? (
                                        <option>Loading products...</option>
                                    ) : filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))
                                    ) : (
                                        <option value="">No products match your search</option>
                                    )}
                                </select>
                                <p className="text-xs text-stone-500">Changing the drink clears the old filters so the next review board starts clean.</p>
                            </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Selected drink</p>
                                <p className="mt-1 text-sm font-semibold text-stone-800">{selectedProductName}</p>
                            </div>
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Guest mood</p>
                                <Badge variant="outline" className={`mt-1 border ${mood.className}`}>{mood.label}</Badge>
                            </div>
                            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Reviews on file</p>
                                <p className="mt-1 text-sm font-semibold text-stone-800">{allRatings.length} total, {commentCoverage}% with comments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="ratings-spotlight-card rounded-[2rem] border border-amber-200/60 bg-linear-to-br from-[#fff8ef] to-white shadow-[0_6px_28px_rgba(180,83,9,0.12)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-900">
                            <Sparkles size={14} />
                            Shift Focus
                        </CardTitle>
                        <CardDescription className="text-xs text-amber-900/70">What this feedback means operationally for the team.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-amber-950/80">
                        <div className="ratings-spotlight-item rounded-xl border border-white/70 bg-white/80 p-3">
                            <p className="font-semibold text-amber-950">{mood.note}</p>
                        </div>
                        <div className="ratings-spotlight-item rounded-xl border border-white/70 bg-white/80 p-3">
                            <p><span className="font-semibold">Recent pace:</span> {recentRatings.length} rating{recentRatings.length === 1 ? "" : "s"} in the last 24 hours.</p>
                        </div>
                        <div className="ratings-spotlight-item rounded-xl border border-white/70 bg-white/80 p-3">
                            <p><span className="font-semibold">Trend:</span> {trendLabel}{trendDelta !== null ? ` (${trendDelta > 0 ? "+" : ""}${trendDelta.toFixed(1)} vs older feedback)` : ""}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="ratings-metric-card rounded-2xl border-0 bg-white shadow-[0_4px_22px_rgba(0,0,0,0.03)]">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Average rating</p>
                        <div className="mt-2 flex items-center gap-2">
                            <p className="text-3xl font-black text-stone-900">{displayedAverage.toFixed(1)}</p>
                            <Stars value={Math.round(displayedAverage)} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="ratings-metric-card rounded-2xl border-0 bg-white shadow-[0_4px_22px_rgba(0,0,0,0.03)]">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Review volume</p>
                        <div className="mt-2 flex items-center gap-2">
                            <MessageSquare size={16} className="text-stone-500" />
                            <p className="text-3xl font-black text-stone-900">{allRatings.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="ratings-metric-card rounded-2xl border-0 bg-white shadow-[0_4px_22px_rgba(0,0,0,0.03)]">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Positive share</p>
                        <div className="mt-2 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-600" />
                            <p className="text-3xl font-black text-stone-900">{positiveShare}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="ratings-metric-card rounded-2xl border-0 bg-white shadow-[0_4px_22px_rgba(0,0,0,0.03)]">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Recent signal</p>
                        <div className="mt-2 flex items-start gap-2">
                            {trendDelta !== null && trendDelta < -0.25 ? (
                                <TrendingDown size={16} className="mt-1 text-red-600" />
                            ) : trendDelta !== null && trendDelta > 0.25 ? (
                                <TrendingUp size={16} className="mt-1 text-emerald-600" />
                            ) : (
                                <Clock3 size={16} className="mt-1 text-stone-500" />
                            )}
                            <div>
                                <p className="line-clamp-1 text-sm font-semibold text-stone-700">{trendLabel}</p>
                                <p className="text-xs text-stone-400">{latestRatingTime}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <Card className="ratings-health-card rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/60 to-white shadow-[0_4px_24px_rgba(59,130,246,0.08)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-900">Feedback Health</CardTitle>
                        <CardDescription className="text-xs text-blue-900/70">A quick read on whether this drink is stable, mixed, or drifting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                        <div className="ratings-health-item flex items-center justify-between rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                            <span className="font-semibold text-blue-900">Comment coverage</span>
                            <span className="font-black text-blue-700">{commentCoverage}%</span>
                        </div>
                        <div className="ratings-health-item flex items-center justify-between rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                            <span className="font-semibold text-blue-900">Low ratings needing review</span>
                            <span className={`font-black ${lowRatingsCount > 0 ? "text-red-600" : "text-emerald-600"}`}>{lowRatingsCount}</span>
                        </div>
                        <div className="ratings-health-item flex items-center justify-between rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                            <span className="font-semibold text-blue-900">Guest mood</span>
                            <span className={`font-black ${mood.className.includes("emerald")
                                ? "text-emerald-700 dark:text-emerald-200"
                                : mood.className.includes("amber")
                                  ? "text-amber-700 dark:text-amber-200"
                                  : mood.className.includes("red")
                                    ? "text-red-700 dark:text-red-200"
                                    : "text-stone-700 dark:text-stone-100"
                                }`}>{mood.label}</span>
                        </div>
                        <p className="pt-1 text-[11px] text-blue-900/70">
                            Tip: comment coverage over 60% gives clearer coaching than stars alone, especially on low ratings.
                        </p>
                    </CardContent>
                </Card>

                <Card className="ratings-recovery-card rounded-2xl border border-red-100 bg-linear-to-br from-rose-50/65 to-white shadow-[0_4px_24px_rgba(244,63,94,0.08)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-rose-900">
                            <AlertTriangle size={14} />
                            Recovery Queue
                        </CardTitle>
                        <CardDescription className="text-xs text-rose-900/70">Start here when the team needs to protect the guest experience quickly.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        {lowRatingQueue.length > 0 ? (
                            lowRatingQueue.map((item) => (
                                <div key={item.id} className="ratings-recovery-item rounded-xl border border-rose-200 bg-white/80 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="border-rose-300 text-[10px] font-black text-rose-700">{item.stars}/5</Badge>
                                            <span className="text-[11px] font-bold text-rose-900">Order #{item.orderId.slice(0, 8)}</span>
                                        </div>
                                        <span className="text-[10px] text-rose-800/70">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mt-1.5 text-xs text-rose-950/85">
                                        {item.comment?.trim() || "No comment provided."}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-800">
                                No urgent recovery items right now. The product is not showing fresh low ratings.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Ratings card */}
            <Card className="ratings-main-card rounded-[2rem] border-0 bg-white overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.04)]">
                <CardHeader className="px-6 py-6 border-b border-stone-50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-black text-stone-900">2. Review workspace for {selectedProductName}</CardTitle>
                            <CardDescription className="mt-0.5 text-xs">Search, sort, and narrow the feedback before deciding what the team should fix or keep doing.</CardDescription>
                        </div>
                        {!avgLoading && (
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                                    <TrendingUp size={13} className="text-amber-600" />
                                    <span className="text-sm font-black text-amber-700">{displayedAverage.toFixed(1)}</span>
                                    <Stars value={Math.round(displayedAverage)} />
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-100 px-3 py-2">
                                    <MessageSquare size={13} className="text-stone-500" />
                                    <span className="text-sm font-black text-stone-700">{allRatings.length}</span>
                                    <span className="text-xs text-stone-400 font-medium">ratings</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.8fr_0.8fr]">
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Search reviews</p>
                                <div className="relative">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        value={reviewSearch}
                                        onChange={(e) => setReviewSearch(e.target.value)}
                                        placeholder="Search comments or order ID"
                                        className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs font-medium text-stone-800 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Stars</p>
                                <select
                                    value={String(starFilter)}
                                    onChange={(e) => setStarFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                                    className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                >
                                    <option value="all">All stars</option>
                                    <option value="5">5 stars</option>
                                    <option value="4">4 stars</option>
                                    <option value="3">3 stars</option>
                                    <option value="2">2 stars</option>
                                    <option value="1">1 star</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Sort order</p>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as "newest" | "highest" | "lowest")}
                                    className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="highest">Highest stars</option>
                                    <option value="lowest">Lowest stars</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            {quickFilterOptions.map((option) => {
                                const isActive = quickFilter === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setQuickFilter((prev) => (prev === option.id ? "none" : option.id))}
                                        className={`rounded-2xl border px-4 py-3 text-left transition ${isActive
                                            ? option.activeClassName
                                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                                            }`}
                                    >
                                        <p className="text-sm font-bold">{option.label}</p>
                                        <p className="mt-1 text-[11px] font-medium opacity-80">{option.hint}</p>
                                        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">{option.count} review{option.count === 1 ? "" : "s"}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
                            <p className="text-xs font-semibold text-stone-600">
                                {displayedRatings.length} review{displayedRatings.length === 1 ? "" : "s"} shown
                                {activeFilterCount > 0 ? ` with ${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}.` : " with no extra filters."}
                            </p>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetReviewFilters}
                                    className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-700 transition hover:bg-stone-50"
                                >
                                    Reset all filters
                                </button>
                            )}
                        </div>
                    </div>

                    {latestComment && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Latest customer comment</p>
                            <p className="mt-1 text-xs font-medium text-emerald-900">&ldquo;{latestComment}&rdquo;</p>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="px-6 py-4 space-y-3">
                    {allRatings.length > 0 && (
                        <div className="grid gap-2 rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = ratingDistribution[stars as 1 | 2 | 3 | 4 | 5];
                                const width = allRatings.length ? (count / allRatings.length) * 100 : 0;
                                return (
                                    <div key={stars} className="flex items-center gap-2 text-xs text-stone-600">
                                        <span className="w-10 font-bold">{stars}★</span>
                                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                                            <div
                                                className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-400"
                                                style={{ width: `${Math.max(width, count > 0 ? 8 : 0)}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right font-semibold">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {ratingsLoading ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                    ) : displayedRatings.length > 0 ? (
                        displayedRatings.map((item) => (
                            <div key={item.id} className="group rounded-xl border border-stone-100 bg-stone-50/50 p-4 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Stars value={item.stars} />
                                        <Badge variant="outline" className="border-stone-200 text-[10px] font-black text-stone-600">{item.stars}/5</Badge>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${getSeverity(item.stars).className}`}
                                        >
                                            {getSeverity(item.stars).label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-stone-400">{new Date(item.createdAt).toLocaleString()}</p>
                                </div>
                                <p className="text-sm text-stone-700 leading-relaxed">
                                    {item.comment ? item.comment : <span className="italic text-stone-400">No comment left.</span>}
                                </p>
                                <div className="mt-1.5 flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-mono font-bold text-stone-400">Order #{item.orderId.slice(0, 8)}</p>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyOrderId(item.orderId)}
                                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${copiedOrderId === item.orderId
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                                            }`}
                                    >
                                        {copiedOrderId === item.orderId ? "Copied" : "Copy order ID"}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : allRatings.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
                                <Star size={28} className="text-stone-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-stone-600">No ratings yet for this product</p>
                                <p className="text-xs text-stone-400 mt-1 max-w-xs">
                                    Ratings submitted after served orders will appear here automatically, or you can check now.
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all mt-1"
                            >
                                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                                {isRefreshing ? "Checking..." : "Check for new ratings"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <p className="text-sm font-bold text-stone-600">No reviews match the current filters</p>
                            <p className="text-xs text-stone-400">Try clearing search text or changing star filter and sort settings.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
