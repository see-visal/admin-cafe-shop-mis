"use client";

import { useState, useCallback } from "react";
import {
    useGetAllOrdersQuery,
    useUpdateOrderStatusMutation,
    useCancelOrderMutation,
    useLazyExportOrdersCsvQuery,
    useGetPaymentByOrderQuery,
    useConfirmPaymentMutation,
} from "@/store/api/dashboardApi";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Price } from "@/components/ui/Price";
import {
    ChevronLeft, ChevronRight, ShoppingBag, XCircle, Clock,
    Table as TableIcon, Download, Filter, X, CheckCircle, Loader2, Banknote,
} from "lucide-react";

/* ── Status Config ─────────────────────────────────────────────────────── */
const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_PAYMENT: { bg: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20", text: "text-amber-700 dark:text-amber-300", label: "Payment" },
    CONFIRMED: { bg: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20", text: "text-blue-700 dark:text-blue-300", label: "Confirmed" },
    PREPARING: { bg: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/20", text: "text-orange-700 dark:text-orange-300", label: "Preparing" },
    READY: { bg: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", label: "Ready" },
    SERVED: { bg: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-500/15 dark:text-stone-300 dark:border-stone-500/20", text: "text-stone-500 dark:text-stone-300", label: "Served" },
    CANCELLED: { bg: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/20", text: "text-red-700 dark:text-red-300", label: "Cancelled" },
};

const TERMINAL = new Set(["SERVED", "CANCELLED"]);
const STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY: ["SERVED"],
    SERVED: [],
    CANCELLED: [],
};

const ALL_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];

/* ── CSV helper ─────────────────────────────────────────────────────────── */

function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
    const [page, setPage] = useState(0);
    // Filters (#9)
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const hasFilter = !!(statusFilter || dateFrom || dateTo);

    const { data, isLoading } = useGetAllOrdersQuery({
        page,
        size: 20,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const [updateOrderStatus] = useUpdateOrderStatusMutation();
    const [cancelOrder] = useCancelOrderMutation();
    const [fetchExport, { isFetching: exporting }] = useLazyExportOrdersCsvQuery();
    const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation();

    /* ── Cash / Payment confirmation dialog ──────────────────────────── */
    const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
    const [cashReceived, setCashReceived] = useState("");

    const confirmOrder = data?.content.find((o) => o.id === confirmOrderId);
    const orderTotal   = confirmOrder?.totalPrice ?? 0;

    const { data: pendingPayment, isLoading: loadingPayment } = useGetPaymentByOrderQuery(
        confirmOrderId ?? "",
        { skip: !confirmOrderId },
    );

    const parsedReceived = parseFloat(cashReceived || "0");
    const changeAmount   = parsedReceived - orderTotal;
    const isCash         = pendingPayment?.paymentMethod === "CASH";
    const cashValid      = !isCash || parsedReceived >= orderTotal;

    // #14 — CSV export
    const handleExport = useCallback(async () => {
        const result = await fetchExport({
            status: statusFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
        });
        if (result.data) {
            const date = new Date().toISOString().slice(0, 10);
            downloadCSV(result.data, `orders-export-${date}.csv`);
        }
    }, [fetchExport, statusFilter, dateFrom, dateTo]);

    function clearFilters() {
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(0);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] border border-stone-50 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#151515] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2e1505] text-amber-500 shadow-xl dark:bg-[#241407] dark:text-amber-300">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black leading-none tracking-tight text-stone-900 dark:text-stone-100">Orders History</h1>
                        <p className="mt-1.5 text-sm font-medium text-stone-400 dark:text-stone-400">Manage and track your coffee shop sales</p>
                    </div>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                    {/* #14 — CSV Export button */}
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-xs font-bold text-stone-700 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-white/10 dark:bg-[#1b1b1b] dark:text-stone-200 dark:hover:border-emerald-500/20 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                    >
                        <Download size={14} />
                        {exporting ? "Exporting…" : "Export CSV"}
                    </button>
                    <div className="flex h-12 items-center gap-2 rounded-2xl border border-stone-100 bg-stone-50 px-5 dark:border-white/10 dark:bg-white/5">
                        <Clock size={16} className="text-stone-400 dark:text-stone-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-600 tabular-nums dark:text-stone-300">Real-time</span>
                    </div>
                </div>
            </div>

            {/* #9 — Date-range + Status filter bar */}
            <Card className="rounded-[2rem] border-0 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:bg-[#151515] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                <CardContent className="px-6 py-5">
                    <div className="flex flex-wrap items-end gap-4">
                        <Filter size={14} className="mb-2 shrink-0 text-stone-400 dark:text-stone-400" />

                        {/* Status filter */}
                        <div className="flex flex-col gap-1.5 w-44">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Status</Label>
                            <Select value={statusFilter || "ALL"} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(0); }}>
                                <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-white text-sm dark:border-white/10 dark:bg-[#111111] dark:text-stone-100">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl dark:border-white/10 dark:bg-[#111111] dark:text-stone-100">
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    {ALL_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>{statusStyles[s]?.label ?? s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">From</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                className="h-10 w-40 rounded-xl border-stone-200 bg-white text-sm dark:border-white/10 dark:bg-[#111111] dark:text-stone-100"
                            />
                        </div>

                        {/* Date To */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">To</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                className="h-10 w-40 rounded-xl border-stone-200 bg-white text-sm dark:border-white/10 dark:bg-[#111111] dark:text-stone-100"
                            />
                        </div>

                        {hasFilter && (
                            <button
                                onClick={clearFilters}
                                className="flex h-10 items-center gap-1.5 self-end rounded-xl border border-stone-200 px-4 text-xs font-bold text-stone-500 transition-colors hover:bg-stone-50 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5"
                            >
                                <X size={12} /> Clear
                            </button>
                        )}
                    </div>
                    {hasFilter && (
                        <p className="mt-3 text-[10px] font-medium text-stone-400 dark:text-stone-400">
                            Showing {data?.totalElements ?? 0} filtered results
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.04)] dark:bg-[#151515] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                <CardHeader className="border-b border-stone-50 px-8 py-6 dark:border-white/10">
                    <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                        {hasFilter ? "Filtered Orders" : "Recent Transactions"}
                        <Badge variant="secondary" className="ml-2 rounded-lg border-0 bg-stone-100 px-2 text-stone-500 dark:bg-white/10 dark:text-stone-300">
                            {data?.totalElements ?? 0}
                        </Badge>
                    </CardTitle>
                    <CardDescription className="dark:text-stone-400">A chronological record of every order placed in your shop</CardDescription>
                </CardHeader>
                <CardContent className="px-8 py-4">
                    {/* #44 – overflow-x-auto for mobile tables */}
                    <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                            <TableHeader>
                                <TableRow className="border-stone-100 hover:bg-transparent dark:border-white/10">
                                    <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Order ID</TableHead>
                                    <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Type</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Items</TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Total Price</TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Status</TableHead>
                                    <TableHead className="w-[160px] text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Timestamp</TableHead>
                                    <TableHead className="w-[150px] text-right text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading
                                    ? [...Array(8)].map((_, i) => (
                                        <TableRow key={i} className="border-stone-50 hover:bg-transparent dark:border-white/5">
                                            {[...Array(7)].map((__, j) => (
                                                <TableCell key={j} className="py-4">
                                                    <Skeleton className="h-5 w-full rounded-lg" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                    : data?.content.map((order) => {
                                        const nextStatuses = STATUS_TRANSITIONS[order.status] ?? [];
                                        const canCancel = !TERMINAL.has(order.status) && order.status !== "CANCELLED";
                                        const style = statusStyles[order.status] || statusStyles.SERVED;
                                        return (
                                            <TableRow key={order.id} className="group border-stone-50 transition-colors hover:bg-stone-50/50 dark:border-white/5 dark:hover:bg-white/5">
                                                <TableCell className="py-5 font-mono text-[10px] font-bold text-stone-400 dark:text-stone-400">
                                                    #{order.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-2">
                                                        {order.orderType === "DINE_IN" ? (
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white shadow-sm dark:bg-white/10 dark:text-stone-100">
                                                                <TableIcon size={12} />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shadow-sm">
                                                                <ShoppingBag size={12} />
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-bold tabular-nums text-stone-800 dark:text-stone-100">
                                                            {order.orderType === "DINE_IN" ? `Table ${order.tableNumber}` : "Takeaway"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <p className="max-w-[220px] truncate text-xs font-bold leading-tight text-stone-800 dark:text-stone-100">
                                                        {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <Price amount={order.totalPrice} size="md" />
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`border-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}
                                                    >
                                                        {style.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">{formatDate(order.createdAt)}</span>
                                                        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-tighter text-stone-400 dark:text-stone-400">Processed</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {/* Confirm payment for PENDING_PAYMENT orders */}
                                                        {order.status === "PENDING_PAYMENT" && (
                                                            <button
                                                                onClick={() => {
                                                                    setCashReceived("");
                                                                    setConfirmOrderId(order.id);
                                                                }}
                                                                className="flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
                                                                title="Confirm payment received"
                                                            >
                                                                <CheckCircle size={12} /> Confirm
                                                            </button>
                                                        )}
                                                        {nextStatuses.filter((s) => s !== "CANCELLED").length > 0 && (
                                                            <Select onValueChange={(val) => updateOrderStatus({ id: order.id, status: val })}>
                                                                <SelectTrigger className="h-8 w-[110px] rounded-xl border-stone-200 bg-white text-[11px] font-bold hover:bg-stone-50 dark:border-white/10 dark:bg-[#111111] dark:text-stone-100 dark:hover:bg-white/5">
                                                                    <SelectValue placeholder="Update →" />
                                                                </SelectTrigger>
                                                                    <SelectContent className="rounded-xl dark:border-white/10 dark:bg-[#111111] dark:text-stone-100">
                                                                    {nextStatuses.filter((s) => s !== "CANCELLED").map((s) => (
                                                                        <SelectItem key={s} value={s} className="text-[11px] font-semibold">
                                                                            {statusStyles[s]?.label ?? s}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {canCancel && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-stone-300 transition-all hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-500/10 dark:hover:text-red-300" title="Cancel Order">
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl dark:bg-[#151515] dark:text-stone-100">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="font-black text-xl">Cancel Order?</AlertDialogTitle>
                                                                        <AlertDialogDescription className="font-medium text-stone-500 dark:text-stone-400">
                                                                            Marking order #{order.id.slice(0, 8)} as cancelled will notify the barista and is irreversible.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="mt-6 flex-row gap-3">
                                                                        <AlertDialogCancel className="mt-0 h-11 flex-1 rounded-xl border-stone-200 text-[10px] font-bold uppercase tracking-widest dark:border-white/10 dark:bg-[#111111] dark:text-stone-100">Back</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className="flex-1 rounded-xl bg-red-600 font-bold uppercase tracking-widest text-[10px] h-11 hover:bg-red-700"
                                                                            onClick={() => cancelOrder(order.id)}
                                                                        >
                                                                            Confirm
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-stone-50 pt-6 dark:border-white/10">
                            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-400">
                                Page {page + 1} of {data.totalPages}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-100 bg-stone-50 text-stone-600 transition-all active:scale-95 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    disabled={page >= data.totalPages - 1}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e1505] text-amber-500 shadow-lg transition-all active:scale-95 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-[#241407] dark:text-amber-300"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Payment Confirmation Dialog ───────────────────────────── */}
            <Dialog open={!!confirmOrderId} onOpenChange={(open) => { if (!open) setConfirmOrderId(null); }}>
                <DialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl dark:bg-[#151515] dark:text-stone-100">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl flex items-center gap-2">
                            {isCash ? <Banknote size={20} className="text-emerald-600" /> : <CheckCircle size={20} className="text-blue-600" />}
                            Confirm Payment
                        </DialogTitle>
                    </DialogHeader>

                    {loadingPayment ? (
                        <div className="space-y-3 py-2">
                            <Skeleton className="h-14 w-full rounded-xl" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                    ) : pendingPayment ? (
                        <div className="space-y-3 py-1">
                            {/* Payment method badge */}
                            <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Method</span>
                                <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                                    isCash
                                        ? "bg-emerald-50 text-emerald-700"
                                        : pendingPayment.paymentMethod === "CARD"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-amber-50 text-amber-700"
                                }`}>
                                    {isCash ? "💵 Cash" : pendingPayment.paymentMethod === "CARD" ? "💳 Card (EDC)" : "🧾 KHQR"}
                                </span>
                            </div>

                            {/* Order total */}
                            <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Order Total</span>
                                <span className="text-lg font-black text-stone-900 dark:text-stone-100">${orderTotal.toFixed(2)}</span>
                            </div>

                            {/* Cash received input + change — only for CASH */}
                            {isCash && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                                            Cash Received ($)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            min={orderTotal}
                                            placeholder={orderTotal.toFixed(2)}
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            className="rounded-xl text-base font-bold h-12"
                                            autoFocus
                                        />
                                    </div>

                                    {parsedReceived > 0 && parsedReceived < orderTotal && (
                                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
                                            ⚠ Amount received is less than the order total!
                                        </div>
                                    )}

                                    {parsedReceived >= orderTotal && parsedReceived > 0 && (
                                        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                                            <span className="text-sm font-bold text-emerald-700">💰 Change to return</span>
                                            <span className="text-xl font-black text-emerald-700">${changeAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="py-2 text-sm text-stone-500 dark:text-stone-400">
                            No payment record found. The customer may not have initiated payment yet.
                        </p>
                    )}

                    <DialogFooter className="flex-row gap-3 mt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl font-bold h-11"
                            onClick={() => setConfirmOrderId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold h-11"
                            disabled={!pendingPayment || !cashValid || confirming}
                            onClick={async () => {
                                if (!pendingPayment) return;
                                try {
                                    await confirmPayment({ paymentId: pendingPayment.id }).unwrap();
                                    setConfirmOrderId(null);
                                    setCashReceived("");
                                } catch (e) {
                                    console.error("Failed to confirm payment:", e);
                                }
                            }}
                        >
                            {confirming ? (
                                <><Loader2 size={14} className="animate-spin" /> Confirming…</>
                            ) : (
                                <><CheckCircle size={14} /> Confirm Payment</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
