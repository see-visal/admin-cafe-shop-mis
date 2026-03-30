"use client";

import {
    useGetBaristaQueueQuery,
    useUpdateOrderStatusMutation,
} from "@/store/api/dashboardApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChefHat, Clock, RefreshCw } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

// Snapshot of current time taken when module loads (not during render)
const PAGE_LOAD_TIME = Date.now();

const STATUS_FLOW: OrderStatus[] = ["CONFIRMED", "PREPARING", "READY", "SERVED"];

const statusColors: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-green-100 text-green-800 border-green-200",
    SERVED: "bg-slate-100 text-slate-600 border-slate-200",
};

function OrderCard({ order }: { order: Order }) {
    const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();
    const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
    const nextStatus = STATUS_FLOW[currentIdx + 1];

    const elapsed = Math.round(
        (PAGE_LOAD_TIME - new Date(order.createdAt).getTime()) / 60000
    );

    return (
        <Card className="relative overflow-hidden">
            {/* Colour accent strip */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === "PREPARING"
                        ? "bg-orange-400"
                        : order.status === "READY"
                            ? "bg-green-500"
                        : "bg-blue-400"
                    }`}
            />
            <CardHeader className="pb-3 pl-5">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            {order.orderType === "DINE_IN" ? (
                                <span className="text-amber-600 font-bold">Table {order.tableNumber}</span>
                            ) : (
                                <span className="text-purple-600 font-bold">Takeaway</span>
                            )}
                            <span className="text-muted-foreground text-sm font-normal">
                                #{order.id.slice(0, 8)}
                            </span>
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {elapsed} min ago · {formatDate(order.createdAt)}
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${statusColors[order.status] ?? ""}`}
                    >
                        {order.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pl-5 space-y-3">
                {/* Items */}
                <div className="space-y-1">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <div>
                                <span className="font-medium">{item.quantity}×</span>{" "}
                                {item.productName}

                            </div>
                            <span className="text-muted-foreground">
                                {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                    {nextStatus ? (
                        <Button
                            size="sm"
                            onClick={() => updateStatus({ id: order.id, status: nextStatus })}
                            disabled={isLoading}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isLoading ? "Updating…" : `Mark as ${nextStatus}`}
                        </Button>
                    ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                            Completed
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function BaristaPage() {
    const { data: queue, isLoading, refetch } = useGetBaristaQueueQuery(undefined, {
        pollingInterval: 10000,
    });

    const confirmed = queue?.filter((o) => o.status === "CONFIRMED") ?? [];
    const preparing = queue?.filter((o) => o.status === "PREPARING") ?? [];
    const ready = queue?.filter((o) => o.status === "READY") ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ChefHat className="h-6 w-6 text-amber-600" />
                        Barista
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Live order board · auto-refreshes every 10s
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Confirmed */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <h2 className="font-semibold text-sm">Confirmed</h2>
                            <Badge variant="secondary" className="ml-auto">{confirmed.length}</Badge>
                        </div>
                        <div className="space-y-3">
                            {confirmed.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">No confirmed orders</p>
                            ) : (
                                confirmed.map((o) => <OrderCard key={o.id} order={o} />)
                            )}
                        </div>
                    </div>

                    {/* Preparing */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            <h2 className="font-semibold text-sm">Preparing</h2>
                            <Badge variant="secondary" className="ml-auto">{preparing.length}</Badge>
                        </div>
                        <div className="space-y-3">
                            {preparing.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">Nothing preparing yet</p>
                            ) : (
                                preparing.map((o) => <OrderCard key={o.id} order={o} />)
                            )}
                        </div>
                    </div>

                    {/* Ready */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <h2 className="font-semibold text-sm">Ready to Serve</h2>
                            <Badge variant="secondary" className="ml-auto">{ready.length}</Badge>
                        </div>
                        <div className="space-y-3">
                            {ready.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">Nothing ready yet</p>
                            ) : (
                                ready.map((o) => <OrderCard key={o.id} order={o} />)
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
