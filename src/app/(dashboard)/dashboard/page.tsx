"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
    ArrowRight,
    ChefHat,
    Clock3,
    Coffee,
    CupSoda,
    Package,
    RefreshCw,
    ShoppingBag,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAllOrdersQuery, useGetBaristaQueueQuery, useGetDashboardQuery } from "@/store/api/dashboardApi";
import { useGetStockAlertsQuery } from "@/store/api/inventoryApi";
import type { Order, OrderStatus } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
    PENDING_PAYMENT: "border-amber-200 bg-amber-50 text-amber-700",
    CONFIRMED: "border-blue-200 bg-blue-50 text-blue-700",
    PREPARING: "border-orange-200 bg-orange-50 text-orange-700",
    READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SERVED: "border-teal-200 bg-teal-50 text-teal-700",
    CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

type SalesPoint = {
    dateKey: string;
    label: string;
    revenue: number;
    orders: number;
};

export default function DashboardPage() {
    const { data: stats, isLoading: statsLoading, refetch } = useGetDashboardQuery();
    const { data: recentOrdersData, isLoading: ordersLoading } = useGetAllOrdersQuery({ page: 0, size: 6 });
    const { data: salesOrdersData, isLoading: salesLoading } = useGetAllOrdersQuery({ page: 0, size: 120 });
    const { data: queue, isLoading: queueLoading } = useGetBaristaQueueQuery(undefined, {
        pollingInterval: 15000,
    });
    const { data: alerts, isLoading: alertsLoading } = useGetStockAlertsQuery();

    const now = new Date();
    const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
    const totalOrders = stats?.totalOrders ?? 0;
    const pendingOrders = stats?.pendingOrders ?? 0;
    const preparingOrders = stats?.preparingOrders ?? 0;
    const lowStockCount = stats?.lowStockIngredients ?? 0;

    const recentOrders = recentOrdersData?.content ?? [];
    const liveQueue = queue ?? [];
    const lowStockItems = alerts ?? [];
    const salesOverview = useMemo(() => buildSalesOverview(salesOrdersData?.content ?? []), [salesOrdersData]);

    const nextAction =
        pendingOrders > 0
            ? "Check unpaid orders first so the kitchen does not prepare drinks that are not confirmed yet."
            : preparingOrders > 0
              ? "The brew bar is active. Watch prep time and move completed drinks to pickup quickly."
              : lowStockCount > 0
                ? "The floor is calm. Use this moment to restock ingredients before the next rush."
                : "Service is under control right now. Review recent orders and keep the team ready for the next rush.";

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-amber-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(135deg,_#fffaf2,_#ffffff_55%,_#f8fafc)] px-6 py-6 shadow-sm dark:border-amber-950/50 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_30%),linear-gradient(135deg,_rgba(41,37,36,0.96),_rgba(17,24,39,0.94)_60%,_rgba(15,23,42,0.98))]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
                            <span>Overview</span>
                            <span>/</span>
                            <span>Dashboard</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                                {greeting}, Coffee Shop team
                            </h1>
                            <p className="max-w-2xl text-sm text-stone-600 dark:text-stone-300">
                                Track Coffee Shop sales, spot payment blockers early, and keep the floor focused on what matters most this shift.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Next best action</p>
                            <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">{nextAction}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={statsLoading} className="bg-white/80 dark:bg-white/5">
                            <RefreshCw className={statsLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                            Refresh
                        </Button>
                        <Link
                            href="/orders"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
                        >
                            Open orders
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OverviewCard
                    title="Orders Today"
                    value={totalOrders}
                    description="Total customer demand today"
                    icon={ShoppingBag}
                    loading={statsLoading}
                    tone="default"
                />
                <OverviewCard
                    title="Waiting Payment"
                    value={pendingOrders}
                    description="Orders blocked at checkout"
                    icon={Clock3}
                    loading={statsLoading}
                    tone="warn"
                />
                <OverviewCard
                    title="Drinks In Prep"
                    value={preparingOrders}
                    description="Current barista workload"
                    icon={ChefHat}
                    loading={statsLoading}
                    tone="accent"
                />
                <OverviewCard
                    title="Low Stock Items"
                    value={lowStockCount}
                    description="Ingredients needing restock"
                    icon={Package}
                    loading={statsLoading}
                    tone={lowStockCount > 0 ? "danger" : "neutral"}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                <div className="space-y-6">
                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Daily sales flow</CardTitle>
                                <CardDescription>
                                    Area chart inspired by the shadcn chart pattern, using Coffee Shop sales per day for the last 7 days.
                                </CardDescription>
                            </div>
                            <div className="grid gap-2 sm:text-right">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">7-day total</p>
                                    {salesLoading ? (
                                        <Skeleton className="ml-auto mt-2 h-8 w-28" />
                                    ) : (
                                        <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(salesOverview.totalRevenue)}</p>
                                    )}
                                </div>
                                {!salesLoading && (
                                    <p className="text-xs text-muted-foreground">
                                        {salesOverview.totalOrders} paid orders • Avg ticket {formatCurrency(salesOverview.averageTicket)}
                                    </p>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {salesLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-[280px] w-full rounded-2xl" />
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {[...Array(3)].map((_, index) => (
                                            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={salesOverview.chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="salesRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.32} />
                                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.04} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/70" />
                                                <XAxis
                                                    dataKey="label"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={10}
                                                    className="text-xs"
                                                />
                                                <Tooltip
                                                    cursor={{ stroke: "#d97706", strokeDasharray: "4 4", strokeOpacity: 0.35 }}
                                                    content={({ active, payload, label }) => {
                                                        if (!active || !payload?.length) return null;

                                                        const point = payload[0]?.payload as SalesPoint | undefined;
                                                        if (!point) return null;

                                                        return (
                                                            <div className="min-w-44 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
                                                                <p className="text-sm font-semibold text-foreground">{label}</p>
                                                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Daily sales</p>
                                                                <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(point.revenue)}</p>
                                                                <p className="mt-2 text-xs text-muted-foreground">
                                                                    {point.orders} paid order{point.orders === 1 ? "" : "s"}
                                                                </p>
                                                            </div>
                                                        );
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#d97706"
                                                    strokeWidth={2.5}
                                                    fill="url(#salesRevenueFill)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <InsightTile
                                            label="Best day"
                                            value={salesOverview.bestDayLabel}
                                            description={`${formatCurrency(salesOverview.bestDayRevenue)} in sales`}
                                        />
                                        <InsightTile
                                            label="Today"
                                            value={formatCurrency(salesOverview.todayRevenue)}
                                            description={`${salesOverview.todayOrders} paid orders so far`}
                                        />
                                        <InsightTile
                                            label="Service note"
                                            value={pendingOrders > 0 ? "Payment follow-up" : "Sales steady"}
                                            description={
                                                pendingOrders > 0
                                                    ? `${pendingOrders} order${pendingOrders === 1 ? "" : "s"} still waiting payment`
                                                    : "No payment backlog blocking today's sales"
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg">Recent orders</CardTitle>
                                <CardDescription>
                                    The latest real customer orders flowing through the shop.
                                </CardDescription>
                            </div>
                            <Link href="/orders" className="text-sm font-medium text-primary hover:underline">
                                View all orders
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {ordersLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, index) => (
                                        <Skeleton key={index} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : recentOrders.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Service</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-foreground">
                                                            {order.orderType === "DINE_IN" ? `Dine in | Table ${order.tableNumber ?? "-"}` : "Takeaway"}
                                                        </p>
                                                        <p className="line-clamp-1 text-xs text-muted-foreground">
                                                            {order.items.map((item) => item.productName).join(", ")}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={order.status} />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(order.totalPrice)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState
                                    icon={CupSoda}
                                    title="No recent orders"
                                    description="New customer orders will appear here once the shop starts receiving traffic."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Now preparing</CardTitle>
                                <CardDescription>Current drinks actively being worked on by the team.</CardDescription>
                            </div>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                {liveQueue.length} active
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {queueLoading ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, index) => (
                                        <Skeleton key={index} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : liveQueue.length > 0 ? (
                                <div className="space-y-3">
                                    {liveQueue.slice(0, 5).map((order, index) => (
                                        <div key={order.id} className="flex items-start gap-3 rounded-2xl border border-border/70 px-3 py-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate font-medium text-foreground">
                                                        {order.items.map((item) => item.productName).join(", ")}
                                                    </p>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {order.orderType === "DINE_IN" ? `Table ${order.tableNumber ?? "-"}` : "Takeaway"} | {order.items.length} item{order.items.length > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Coffee}
                                    title="Preparation is clear"
                                    description="There are no active drink preparations right now."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Inventory watch</CardTitle>
                                <CardDescription>Ingredients that could interrupt service.</CardDescription>
                            </div>
                            {(lowStockItems.length > 0 || alertsLoading) && (
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    {alertsLoading ? "..." : `${lowStockItems.length} alerts`}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            {alertsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, index) => (
                                        <Skeleton key={index} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : lowStockItems.length > 0 ? (
                                <div className="space-y-3">
                                    {lowStockItems.slice(0, 4).map((item) => {
                                        const ratio = item.lowThreshold > 0 ? Math.min(100, Math.round((item.stockQty / item.lowThreshold) * 100)) : 0;
                                        return (
                                            <div key={item.id} className="space-y-2 rounded-2xl border border-border/70 px-3 py-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.stockQty} {item.unit} remaining
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "rounded-full px-2.5 py-0.5",
                                                            ratio <= 35 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
                                                        )}
                                                    >
                                                        {ratio}%
                                                    </Badge>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={cn("h-full rounded-full", ratio <= 35 ? "bg-red-500" : "bg-amber-500")}
                                                        style={{ width: `${Math.max(ratio, 6)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Package}
                                    title="Inventory looks healthy"
                                    description="No low-stock ingredients are currently threatening production."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}

function buildSalesOverview(orders: Order[]) {
    const dayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const chartData: SalesPoint[] = Array.from({ length: days }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - 1 - index));
        const key = date.toISOString().slice(0, 10);

        return {
            dateKey: key,
            label: dayFormatter.format(date),
            revenue: 0,
            orders: 0,
        };
    });

    const chartMap = new Map(chartData.map((entry) => [entry.dateKey, entry]));

    for (const order of orders) {
        if (order.status === "PENDING_PAYMENT" || order.status === "CANCELLED") {
            continue;
        }

        const createdDate = new Date(order.createdAt);
        if (Number.isNaN(createdDate.getTime())) {
            continue;
        }

        const key = createdDate.toISOString().slice(0, 10);
        const point = chartMap.get(key);
        if (!point) {
            continue;
        }

        point.revenue += order.totalPrice;
        point.orders += 1;
    }

    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
    const bestDay = chartData.reduce((best, item) => (item.revenue > best.revenue ? item : best), chartData[0]);
    const todayPoint = chartData[chartData.length - 1];

    return {
        chartData,
        totalRevenue,
        totalOrders,
        averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        bestDayLabel: bestDay?.label ?? "No sales",
        bestDayRevenue: bestDay?.revenue ?? 0,
        todayRevenue: todayPoint?.revenue ?? 0,
        todayOrders: todayPoint?.orders ?? 0,
    };
}

function OverviewCard({
    title,
    value,
    description,
    icon: Icon,
    loading,
    tone = "default",
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
    loading: boolean;
    tone?: "default" | "warn" | "accent" | "danger" | "neutral";
}) {
    const toneClasses = {
        default: "bg-primary/10 text-primary",
        warn: "bg-amber-100 text-amber-700",
        accent: "bg-orange-100 text-orange-700",
        danger: "bg-red-100 text-red-700",
        neutral: "bg-slate-100 text-slate-700",
    };

    return (
        <Card className="rounded-3xl shadow-sm">
            <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    {loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-semibold text-foreground">{value}</p>}
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className={cn("rounded-2xl p-3", toneClasses[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function InsightTile({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLES[status])}>
            {status.replaceAll("_", " ")}
        </Badge>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <div className="rounded-2xl bg-muted p-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium text-foreground">{title}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

