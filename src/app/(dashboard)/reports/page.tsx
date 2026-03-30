"use client";

import { useState } from "react";
import { useGetSettlementReportQuery, useLazyExportSettlementCsvQuery } from "@/store/api/managementApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartNoAxesCombined, Download, Wallet, CreditCard, Landmark, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function SummaryTile({
    title,
    value,
    icon: Icon,
    loading,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    loading?: boolean;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
                        {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 text-2xl font-bold">{value}</p>}
                    </div>
                    <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const { data: report, isLoading } = useGetSettlementReportQuery({ date }, { skip: !date });
    const [exportCsv, { isFetching: exporting }] = useLazyExportSettlementCsvQuery();

    async function handleExport() {
        if (!date) return;
        try {
            const result = await exportCsv({ date });
            if (result.data) {
                downloadCsv(result.data, `settlement-${date}.csv`);
            }
        } catch (error) {
            console.error("Settlement export failed:", error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ChartNoAxesCombined className="h-6 w-6 text-amber-600" />
                        Daily Settlement
                    </h1>
                    <p className="text-muted-foreground text-sm">Revenue split by payment method with refund-adjusted totals.</p>
                </div>
                <div className="flex items-end gap-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting || !date}>
                        <Download className="h-4 w-4" />
                        {exporting ? "Exporting..." : "Export CSV"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile title="Gross Revenue" value={formatCurrency(report?.totalRevenue ?? 0)} icon={Wallet} loading={isLoading} />
                <SummaryTile title="Cash Revenue" value={formatCurrency(report?.cashRevenue ?? 0)} icon={Landmark} loading={isLoading} />
                <SummaryTile
                    title="Digital Revenue"
                    value={formatCurrency((report?.khqrRevenue ?? 0) + (report?.cardRevenue ?? 0))}
                    icon={CreditCard}
                    loading={isLoading}
                />
                <SummaryTile title="Net Revenue" value={formatCurrency(report?.netRevenue ?? 0)} icon={Coins} loading={isLoading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Method Breakdown</CardTitle>
                    <CardDescription>{report ? `${report.totalOrders} settled orders` : "Loading report..."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="font-medium">CASH</p>
                                    <p className="text-sm text-muted-foreground">{report?.cashOrders ?? 0} orders</p>
                                </div>
                                <Badge variant="secondary">{formatCurrency(report?.cashRevenue ?? 0)}</Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="font-medium">KHQR</p>
                                    <p className="text-sm text-muted-foreground">{report?.khqrOrders ?? 0} orders</p>
                                </div>
                                <Badge variant="secondary">{formatCurrency(report?.khqrRevenue ?? 0)}</Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="font-medium">CARD</p>
                                    <p className="text-sm text-muted-foreground">{report?.cardOrders ?? 0} orders</p>
                                </div>
                                <Badge variant="secondary">{formatCurrency(report?.cardRevenue ?? 0)}</Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="font-medium">Refunds / Voids</p>
                                    <p className="text-sm text-muted-foreground">Total deductions</p>
                                </div>
                                <Badge className="bg-red-100 text-red-800">{formatCurrency(report?.totalRefunds ?? 0)}</Badge>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
