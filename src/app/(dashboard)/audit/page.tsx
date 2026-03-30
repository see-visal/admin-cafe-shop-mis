"use client";

import { useMemo, useState } from "react";
import { useGetAuditLogsQuery } from "@/store/api/managementApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck, UserRound, Coffee } from "lucide-react";
import { formatDate } from "@/lib/utils";

const actionColors: Record<string, string> = {
    CREATE_USER: "bg-green-100 text-green-800",
    UPDATE_USER: "bg-blue-100 text-blue-800",
    ENABLE_USER: "bg-emerald-100 text-emerald-800",
    DISABLE_USER: "bg-amber-100 text-amber-800",
    LOCK_USER: "bg-red-100 text-red-800",
    UNLOCK_USER: "bg-sky-100 text-sky-800",
    DELETE_USER: "bg-red-100 text-red-800",
    PLACE_ORDER: "bg-amber-100 text-amber-800",
    CREATE_PAYMENT: "bg-emerald-100 text-emerald-800",
    SUBMIT_RATING: "bg-fuchsia-100 text-fuchsia-800",
    UPDATE_PROFILE: "bg-blue-100 text-blue-800",
    BARISTA_UPDATE_ORDER_STATUS: "bg-orange-100 text-orange-800",
    CONFIRM_PICKUP: "bg-teal-100 text-teal-800",
    ADJUST_STOCK: "bg-violet-100 text-violet-800",
    CREATE_PRODUCT: "bg-green-100 text-green-800",
    UPDATE_PRODUCT: "bg-blue-100 text-blue-800",
    CREATE_INGREDIENT: "bg-green-100 text-green-800",
    UPDATE_INGREDIENT: "bg-blue-100 text-blue-800",
    CONFIRM_PAYMENT: "bg-emerald-100 text-emerald-800",
};

const roleStyles: Record<string, string> = {
    ADMIN: "bg-red-50 text-red-700 border-red-200",
    BARISTA: "bg-amber-50 text-amber-700 border-amber-200",
    CUSTOMER: "bg-blue-50 text-blue-700 border-blue-200",
};

function RoleSummaryCard({
    title,
    value,
    icon: Icon,
    tone,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    tone: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${tone}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function AuditPage() {
    const [page, setPage] = useState(0);
    const [actorId, setActorId] = useState("");
    const [entity, setEntity] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const params = useMemo(
        () => ({
            page,
            size: 25,
            actorId: actorId || undefined,
            entity: entity || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
        }),
        [page, actorId, entity, dateFrom, dateTo],
    );

    const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery(params);
    const roleCounts = useMemo(() => {
        const counts = { ADMIN: 0, BARISTA: 0, CUSTOMER: 0 };
        for (const log of data?.content ?? []) {
            const roles = log.actorRoles ?? [];
            if (roles.includes("ADMIN")) counts.ADMIN += 1;
            if (roles.includes("BARISTA")) counts.BARISTA += 1;
            if (roles.includes("CUSTOMER")) counts.CUSTOMER += 1;
        }
        return counts;
    }, [data]);

    function clearFilters() {
        setActorId("");
        setEntity("");
        setDateFrom("");
        setDateTo("");
        setPage(0);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ScrollText className="h-6 w-6 text-amber-600" />
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground text-sm">Complete activity trail for security and accountability</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Search activity across customer, admin, and barista actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        <div className="space-y-1.5">
                            <Label>Actor ID</Label>
                            <Input
                                value={actorId}
                                onChange={(e) => {
                                    setActorId(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="UUID"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Entity</Label>
                            <Input
                                value={entity}
                                onChange={(e) => {
                                    setEntity(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="User, Order, Product..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>From</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPage(0);
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>To</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPage(0);
                                }}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" className="w-full" onClick={clearFilters}>Clear</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <RoleSummaryCard title="Admin Actions" value={roleCounts.ADMIN} icon={ShieldCheck} tone="bg-red-100 text-red-700" />
                <RoleSummaryCard title="Barista Actions" value={roleCounts.BARISTA} icon={Coffee} tone="bg-amber-100 text-amber-700" />
                <RoleSummaryCard title="Customer Actions" value={roleCounts.CUSTOMER} icon={UserRound} tone="bg-blue-100 text-blue-700" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Event Log</CardTitle>
                    <CardDescription>
                        {data ? `${data.totalElements} events recorded` : "Loading..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Detail</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? [...Array(8)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(5)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : data?.content.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-foreground">
                                                    {log.actorName || log.actorUsername || log.actorId}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {log.actorRoles?.length ? log.actorRoles.map((role) => (
                                                        <Badge key={`${log.id}-${role}`} variant="outline" className={`text-[10px] font-bold ${roleStyles[role] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                                            {role}
                                                        </Badge>
                                                    )) : (
                                                        <Badge variant="outline" className="text-[10px] font-bold">Unknown</Badge>
                                                    )}
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        {log.actorUsername ? `@${log.actorUsername}` : log.actorId.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${actionColors[log.action] ?? "bg-slate-100 text-slate-700"}`}
                                            >
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <span className="font-medium">{log.entity}</span>
                                            <span className="text-muted-foreground ml-1 font-mono text-xs">{log.entityId.slice(0, 8)}</span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[320px] truncate">{log.detail}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            {!isLoading && data && data.content.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No audit records found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Page {page + 1} of {data.totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= data.totalPages - 1}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
