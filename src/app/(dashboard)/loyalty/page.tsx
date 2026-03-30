"use client";

import { useMemo } from "react";
import { Coins, Coffee, Gift, HandCoins, RefreshCw, Sparkles, Trophy, Users } from "lucide-react";
import { useGetLoyaltyOverviewQuery } from "@/store/api/managementApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function MetricCard({
    title,
    value,
    note,
    icon: Icon,
    loading,
    tone = "default",
}: {
    title: string;
    value: string;
    note: string;
    icon: React.ElementType;
    loading?: boolean;
    tone?: "default" | "accent" | "success";
}) {
    const toneClass =
        tone === "accent"
            ? "border-amber-200 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-500/12"
            : tone === "success"
              ? "border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/30 dark:bg-emerald-500/12"
              : "border-stone-200 bg-white/90 dark:border-white/10 dark:bg-white/6";

    return (
        <Card className={`loyalty-metric-card rounded-3xl shadow-sm ${toneClass}`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-300">{title}</p>
                        {loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-semibold text-stone-900 dark:text-stone-50">{value}</p>}
                        <p className="text-sm text-stone-600 dark:text-stone-300">{note}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-amber-400 dark:bg-white/10 dark:text-amber-300">
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ProgressRow({ label, value, hint }: { label: string; value: number; hint: string }) {
    const width = Math.max(0, Math.min(100, value));
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-stone-700 dark:text-stone-200">{label}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-50">{Math.round(value)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500" style={{ width: `${width}%` }} />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
        </div>
    );
}

export default function LoyaltyPage() {
    const { data, isLoading, isFetching, refetch } = useGetLoyaltyOverviewQuery();

    const totalPointsIssued = data?.totalPointsIssued ?? 0;
    const totalPointsRedeemed = data?.totalPointsRedeemed ?? 0;
    const activeUsers = data?.activeUsers ?? 0;
    const totalUsersWithPoints = data?.totalUsersWithPoints ?? 0;
    const netPointsBalance = totalPointsIssued - totalPointsRedeemed;

    const redemptionRate = totalPointsIssued > 0 ? (totalPointsRedeemed / totalPointsIssued) * 100 : 0;
    const activeShare = totalUsersWithPoints > 0 ? (activeUsers / totalUsersWithPoints) * 100 : 0;
    const averagePointsPerMember = totalUsersWithPoints > 0 ? totalPointsIssued / totalUsersWithPoints : 0;

    const health = useMemo(() => {
        if (totalUsersWithPoints === 0) {
            return {
                label: "Launch loyalty visibility",
                note: "Guests are not collecting points yet. Make the program visible at checkout and pickup.",
                className: "border-stone-200 bg-stone-50 text-stone-700 dark:border-white/10 dark:bg-white/6 dark:text-stone-100",
            };
        }

        if (redemptionRate < 20 && netPointsBalance > 1000) {
            return {
                label: "Guests are collecting, not redeeming",
                note: "Surface rewards earlier so members feel progress, not just accumulation.",
                className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200",
            };
        }

        if (activeShare < 40) {
            return {
                label: "Member reactivation needed",
                note: "Many members hold points but are not recently active. Use reminders or reward prompts.",
                className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/12 dark:text-red-200",
            };
        }

        if (redemptionRate > 55) {
            return {
                label: "Redemption is healthy",
                note: "Members are using rewards regularly. Keep reward value clear and sustainable.",
                className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200",
            };
        }

        return {
            label: "Program is balanced",
            note: "Guests are earning and redeeming at a reasonable pace for a cafe loyalty loop.",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200",
        };
    }, [activeShare, netPointsBalance, redemptionRate, totalUsersWithPoints]);

    const nextAction = useMemo(() => {
        if (totalUsersWithPoints === 0) {
            return "Coach the counter team to mention loyalty during payment so the program starts building a member base.";
        }
        if (redemptionRate < 20 && netPointsBalance > 1000) {
            return "Guests are saving points without cashing them in. Add a clearer reward reminder near checkout and on receipts.";
        }
        if (activeShare < 40) {
            return "Focus on bringing dormant members back with a simple reward message after handoff or in your next promo push.";
        }
        if (redemptionRate > 55) {
            return "The reward loop is working. Double-check reward margin and make sure the bar team understands current redemption expectations.";
        }
        return "Keep the loyalty loop visible and simple: earn on served orders, remind guests what they can unlock next, and celebrate redemptions.";
    }, [activeShare, netPointsBalance, redemptionRate, totalUsersWithPoints]);

    return (
        <div className="loyalty-page-shell space-y-6">
            <section className="loyalty-hero overflow-hidden rounded-[28px] border border-amber-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(135deg,_#fffaf2,_#ffffff_55%,_#f8fafc)] px-6 py-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-300">
                            <span>Customers</span>
                            <span>/</span>
                            <span>Loyalty</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Coffee Shop loyalty board</h1>
                            <p className="max-w-2xl text-sm text-stone-600 dark:text-stone-300">
                                Track whether members are earning, redeeming, and coming back often enough for the loyalty program to feel rewarding instead of invisible.
                            </p>
                        </div>
                        <div className="loyalty-hero-panel rounded-2xl border border-stone-200 bg-white/80 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-300">Next best action</p>
                            <p className="mt-2 text-sm text-stone-700 dark:text-stone-100">{nextAction}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`border ${health.className}`}>
                            {health.label}
                        </Badge>
                        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                            {isFetching ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Points issued"
                    value={`${totalPointsIssued}`}
                    note="All points credited to members so far."
                    icon={Coins}
                    loading={isLoading}
                />
                <MetricCard
                    title="Points redeemed"
                    value={`${totalPointsRedeemed}`}
                    note="How often guests convert points into value."
                    icon={HandCoins}
                    loading={isLoading}
                    tone="accent"
                />
                <MetricCard
                    title="Active members"
                    value={`${activeUsers}`}
                    note="Members currently engaging with the program."
                    icon={Users}
                    loading={isLoading}
                />
                <MetricCard
                    title="Redemption rate"
                    value={`${redemptionRate.toFixed(1)}%`}
                    note="The share of issued points that have been redeemed."
                    icon={Trophy}
                    loading={isLoading}
                    tone="success"
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Card className="loyalty-surface-card rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Program health</CardTitle>
                        <CardDescription>Use these signals to tell whether loyalty feels motivating, forgotten, or overdue for improvement.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <ProgressRow
                            label="Redemption momentum"
                            value={redemptionRate}
                            hint="If this stays too low, guests may not understand what rewards they can unlock."
                        />
                        <ProgressRow
                            label="Active member share"
                            value={activeShare}
                            hint="This compares active members against everyone currently holding points."
                        />

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-300">Members with points</p>
                                {isLoading ? <Skeleton className="mt-2 h-7 w-16" /> : <p className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-50">{totalUsersWithPoints}</p>}
                            </div>
                            <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-300">Net point balance</p>
                                {isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-50">{netPointsBalance}</p>}
                            </div>
                            <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-300">Avg points per member</p>
                                {isLoading ? <Skeleton className="mt-2 h-7 w-16" /> : <p className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-50">{averagePointsPerMember.toFixed(1)}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="loyalty-guidance-card rounded-3xl border-amber-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.98),_rgba(255,255,255,0.98))] shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                            Shift guidance
                        </CardTitle>
                        <CardDescription>Simple coaching for how the team should present loyalty during service.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="loyalty-guidance-item rounded-2xl border border-white/80 bg-white/85 p-4">
                            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Program status</p>
                            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{health.note}</p>
                        </div>
                        <div className="loyalty-guidance-item rounded-2xl border border-white/80 bg-white/85 p-4">
                            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Counter script</p>
                            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Mention points at payment, remind guests what they can unlock, and confirm redemption value before they leave the counter.</p>
                        </div>
                        <div className="loyalty-guidance-item rounded-2xl border border-white/80 bg-white/85 p-4">
                            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">Credit trigger</p>
                            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Points are credited when an order reaches the <span className="font-semibold">SERVED</span> status.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
                <Card className="loyalty-surface-card rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Guest journey view</CardTitle>
                        <CardDescription>How loyalty should feel from the customer side in a coffee shop setting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-amber-400">
                                    <Coffee className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">1. Order served</p>
                                    <p className="text-sm text-stone-600">The guest completes their drink journey and earns loyalty value only after successful handoff.</p>
                                </div>
                            </div>
                        </div>
                        <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-amber-400">
                                    <Gift className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">2. Points feel visible</p>
                                    <p className="text-sm text-stone-600">Guests should know they earned something and understand how close they are to a reward.</p>
                                </div>
                            </div>
                        </div>
                        <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-amber-400">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">3. Redemption feels easy</p>
                                    <p className="text-sm text-stone-600">Rewards should be simple enough that staff can explain them fast during a busy shift.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="loyalty-surface-card rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">What to watch next</CardTitle>
                        <CardDescription>Helpful signals to keep the loyalty loop healthy over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-white p-4">
                            <p className="text-sm font-semibold text-stone-900">If point balance keeps rising too fast</p>
                            <p className="mt-1 text-sm text-stone-600">Guests may be earning points but not seeing reasons to redeem. Consider making reward thresholds more visible in the ordering journey.</p>
                        </div>
                        <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-white p-4">
                            <p className="text-sm font-semibold text-stone-900">If active member share drops</p>
                            <p className="mt-1 text-sm text-stone-600">The program may be remembered at signup but forgotten later. Reactivation messaging and clearer reward reminders can help.</p>
                        </div>
                        <div className="loyalty-detail-card rounded-2xl border border-stone-200 bg-white p-4">
                            <p className="text-sm font-semibold text-stone-900">If redemption becomes very high</p>
                            <p className="mt-1 text-sm text-stone-600">That can be a good sign, but it is worth checking that the reward value still fits product margins and staff workflows.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
