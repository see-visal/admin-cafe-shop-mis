"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical, Info, ShoppingBag, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuppliersPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 p-4 rounded-2xl glass">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-lg">
                    <Truck size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-stone-900">Suppliers</h1>
                    <p className="text-sm text-stone-400 font-medium">Supplier management is currently merged into inventory flow.</p>
                </div>
            </div>

            <Card className="rounded-2xl shadow-lg border-amber-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Info size={16} className="text-amber-600" /> Feature Simplified
                    </CardTitle>
                    <CardDescription>
                        Supplier work is procurement only. Customer order tracking and receipt are handled in order flow.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl border bg-stone-50 p-4 text-sm text-stone-600">
                        Real flow: customer checks out -&gt; receipt appears -&gt; customer tracks order status. Suppliers support stock availability behind the scenes.
                    </div>

                    <div className="rounded-xl border p-4 text-sm text-stone-600 space-y-2">
                        <p className="font-semibold text-stone-800">How this module fits the real workflow</p>
                        <p className="flex items-start gap-2"><ShoppingBag size={14} className="mt-0.5 shrink-0 text-amber-600" /> Customer flow: order, payment success, receipt, then track order progress.</p>
                        <p className="flex items-start gap-2"><Truck size={14} className="mt-0.5 shrink-0 text-amber-600" /> Supplier flow: restock ingredients, maintain supply quality, support production capacity.</p>
                    </div>

                    <Button asChild className="gap-2">
                        <Link href="/ingredients">
                            <FlaskConical size={14} /> Open Inventory <ArrowRight size={14} />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
