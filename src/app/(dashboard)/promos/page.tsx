"use client";

import { useMemo, useState } from "react";
import {
    useGetPromosQuery,
    useCreatePromoMutation,
    useExpirePromoMutation,
    useDeletePromoMutation,
} from "@/store/api/managementApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BadgePercent, Plus, Trash2, Ban } from "lucide-react";

export default function PromosPage() {
    const { data: promos, isLoading } = useGetPromosQuery();
    const [createPromo, { isLoading: creating }] = useCreatePromoMutation();
    const [expirePromo] = useExpirePromoMutation();
    const [deletePromo] = useDeletePromoMutation();

    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    const sortedPromos = useMemo(
        () => (promos ? [...promos].sort((a, b) => Number(b.active) - Number(a.active)) : []),
        [promos],
    );

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createPromo({
                code: code.trim().toUpperCase(),
                discountType,
                discountValue: Number(discountValue),
                maxUses: maxUses ? Number(maxUses) : undefined,
                expiresAt: expiresAt || undefined,
            }).unwrap();

            setCode("");
            setDiscountType("PERCENTAGE");
            setDiscountValue("");
            setMaxUses("");
            setExpiresAt("");
        } catch (error) {
            console.error("Create promo failed:", error);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <BadgePercent className="h-6 w-6 text-amber-600" />
                    Promo Code Management
                </h1>
                <p className="text-muted-foreground text-sm">Create and track discount campaigns.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Promo</CardTitle>
                    <CardDescription>Publish discount campaigns to the customer checkout app.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1.5">
                            <Label>Code</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={discountType} onValueChange={(v) => setDiscountType(v as "PERCENTAGE" | "FIXED")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                                    <SelectItem value="FIXED">FIXED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Value</Label>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder="10"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Max Uses</Label>
                            <Input
                                type="number"
                                min="1"
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Expires</Label>
                            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                            <Button type="submit" className="gap-2" disabled={creating}>
                                <Plus className="h-4 w-4" />
                                {creating ? "Saving..." : "Save Promo"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Promo List</CardTitle>
                    <CardDescription>{promos ? `${promos.length} total promo codes` : "Loading..."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? [...Array(6)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(7)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : sortedPromos.map((promo) => (
                                    <TableRow key={promo.id}>
                                        <TableCell className="font-medium">{promo.code}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{promo.discountType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                                        </TableCell>
                                        <TableCell>
                                            {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ""}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {promo.expiresAt ? new Date(promo.expiresAt).toLocaleString() : "No expiry"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={promo.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}>
                                                {promo.active ? "Active" : "Expired"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {promo.active && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => expirePromo(promo.id)}
                                                        className="gap-1"
                                                    >
                                                        <Ban className="h-3.5 w-3.5" /> Expire
                                                    </Button>
                                                )}

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete {promo.code}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This removes the promo code permanently.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deletePromo(promo.id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!isLoading && sortedPromos.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No promo codes found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
