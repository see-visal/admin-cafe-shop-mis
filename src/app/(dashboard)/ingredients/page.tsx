"use client";

import {
    type Dispatch,
    type ElementType,
    type FormEvent,
    type ReactNode,
    type SetStateAction,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useGetIngredientsQuery,
    useCreateIngredientMutation,
    useUpdateIngredientMutation,
    useUploadIngredientImageMutation,
    useAdjustStockMutation,
    useDeleteIngredientMutation,
} from "@/store/api/inventoryApi";
import { useGetAdminProductsQuery } from "@/store/api/productsApi";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    AlertTriangle, ArrowUpDown, Box, Coffee, FlaskConical, History,
    ListFilter, Loader2, PackagePlus, Pencil, Plus, Search,
    ShieldCheck, Sparkles, Trash2, Truck, Warehouse,
} from "lucide-react";
import Image from "next/image";
import { resolveStorageUrl, isRemoteStorageUrl } from "@/lib/storage";
import type { Ingredient, Product } from "@/types";

interface IngredientForm {
    name: string;
    unit: string;
    stockQty: string;
    lowThreshold: string;
    supplier: string;
    imageFile: File | null;
    imagePreview: string;
}
const emptyIng: IngredientForm = {
    name: "",
    unit: "",
    stockQty: "",
    lowThreshold: "",
    supplier: "",
    imageFile: null,
    imagePreview: "",
};

// ─── Branded Dialog wrapper ────────────────────────────────────────────────────

interface InventoryDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    icon: ElementType;
    children: ReactNode;
}

function InventoryDialog({ open, onClose, title, description, icon: Icon, children }: InventoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 shadow-2xl sm:max-w-md">
                <div
                    className="relative flex items-center gap-3 px-6 py-5 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #2e1505 0%, #4a2209 45%, #7c3f12 100%)" }}
                >
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                    />
                    <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30">
                        <Icon size={18} className="text-amber-300" />
                    </div>
                    <div className="relative z-10">
                        <DialogTitle className="text-base font-black text-white tracking-tight leading-none">
                            {title}
                        </DialogTitle>
                        <p className="text-[11px] text-amber-200/60 mt-0.5 font-medium">
                            {description}
                        </p>
                    </div>
                </div>
                <div className="px-6 py-6 bg-white">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Ingredient Form Fields (module-level to keep stable identity) ──────────────

interface IngredientFormProps {
    form: IngredientForm;
    setForm: Dispatch<SetStateAction<IngredientForm>>;
    onSubmit: (e: FormEvent) => void;
    onClose: () => void;
    loading: boolean;
    mode: "create" | "edit";
    formError: string | null;
}

interface MetricCardProps {
    label: string;
    value: string;
    hint: string;
}

type FilterMode = "all" | "low" | "healthy";
type SortMode = "urgency" | "name" | "stockHigh" | "stockLow";

function formatQty(value: number) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function getCoverageRatio(item: Ingredient) {
    if (item.lowThreshold <= 0) {
        return item.stockQty > 0 ? 3 : 0;
    }

    return item.stockQty / item.lowThreshold;
}

function getCoveragePercent(item: Ingredient) {
    return Math.max(0, Math.min(Math.round((getCoverageRatio(item) / 3) * 100), 100));
}

function getStatusLabel(item: Ingredient) {
    const ratio = getCoverageRatio(item);

    if (ratio < 1) return "Restock now";
    if (ratio < 1.5) return "Watch this";
    return "Ready for service";
}

function ingredientTokens(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !["fresh", "whole", "skim", "full", "organic"].includes(token));
}

function scoreIngredientImage(ingredient: Ingredient, product: Product) {
    const productImage = resolveStorageUrl(product.imageUrl);
    if (!productImage) return -1;

    const ingredientName = ingredient.name.toLowerCase();
    const haystack = `${product.name} ${product.description ?? ""} ${product.category ?? ""}`.toLowerCase();

    let score = 0;

    if (haystack.includes(ingredientName)) {
        score += 100;
    }

    for (const token of ingredientTokens(ingredient.name)) {
        if (haystack.includes(token)) score += 12;
    }

    if (ingredientName.includes("bean") || ingredientName.includes("espresso")) {
        if (haystack.includes("coffee") || haystack.includes("espresso") || haystack.includes("latte") || haystack.includes("cappuccino")) score += 16;
    }

    if (ingredientName.includes("milk")) {
        if (haystack.includes("latte") || haystack.includes("cappuccino") || haystack.includes("milk")) score += 16;
    }

    if (ingredientName.includes("matcha") || ingredientName.includes("tea")) {
        if (haystack.includes("matcha") || haystack.includes("tea")) score += 16;
    }

    if (ingredientName.includes("pastry") || ingredientName.includes("butter") || ingredientName.includes("flour")) {
        if (haystack.includes("pastry") || haystack.includes("croissant") || haystack.includes("bakery")) score += 16;
    }

    return score;
}

function IngredientFormFields({ form, setForm, onSubmit, onClose, loading, mode, formError }: IngredientFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Ingredient Name</Label>
                    <Input placeholder="e.g. Espresso Beans" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="h-12 rounded-xl focus:border-amber-400" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Unit</Label>
                    <Input placeholder="kg / L / pcs" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} required className="h-12 rounded-xl focus:border-amber-400" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Supplier</Label>
                    <Input placeholder="Optional" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} className="h-12 rounded-xl focus:border-amber-400" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Current Stock</Label>
                    <Input type="number" min="0" step="0.01" value={form.stockQty} onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))} required className="h-12 rounded-xl focus:border-amber-400" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Low Threshold</Label>
                    <Input type="number" min="0" step="0.01" value={form.lowThreshold} onChange={(e) => setForm((f) => ({ ...f, lowThreshold: e.target.value }))} required className="h-12 rounded-xl focus:border-amber-400" />
                </div>
                <div className="col-span-2 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Ingredient Image</Label>
                        <p className="mt-2 text-sm font-medium text-stone-500">
                            Upload an ingredient image to MinIO so this stock item has its own photo across inventory screens.
                        </p>
                    </div>
                    <Input
                        type="file"
                        accept="image/*"
                        className="h-12 rounded-xl focus:border-amber-400"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (!file) return;

                            const nextPreview = URL.createObjectURL(file);
                            setForm((current) => {
                                if (current.imagePreview.startsWith("blob:")) {
                                    URL.revokeObjectURL(current.imagePreview);
                                }

                                return { ...current, imageFile: file, imagePreview: nextPreview };
                            });
                        }}
                    />
                    <p className="text-sm leading-6 text-stone-500">
                        Selected image will be uploaded to MinIO after saving this ingredient.
                    </p>
                    {form.imagePreview ? (
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white">
                            <Image
                                src={form.imagePreview}
                                alt="Ingredient preview"
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-white px-6 text-center">
                            <div className="space-y-2">
                                <Box className="mx-auto h-8 w-8 text-stone-400" />
                                <p className="text-sm font-medium text-stone-700">No image selected yet</p>
                                <p className="text-sm leading-6 text-stone-500">
                                    Add a photo for beans, milk, syrup, or other stock so the item is easier to recognize.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {formError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600">
                    {formError}
                </div>
            )}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-stone-100">
                <button type="button" onClick={onClose} className="text-xs font-bold text-stone-400 hover:text-stone-600 px-4">Cancel</button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 h-11 px-6 rounded-2xl font-bold text-xs text-white transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {mode === "create" ? "Add Ingredient" : "Save Changes"}
                </button>
            </div>
        </form>
    );
}

function MetricCard({ label, value, hint }: MetricCardProps) {
    return (
        <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/85 p-5 shadow-[0_10px_30px_rgba(28,25,23,0.05)] backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-stone-950">{value}</p>
            <p className="mt-2 text-sm font-medium text-stone-500">{hint}</p>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function IngredientsPage() {
    const { data: ingredients, isLoading } = useGetIngredientsQuery();
    const { data: productPage } = useGetAdminProductsQuery({ page: 0, size: 200 });
    const [createIngredient, { isLoading: creating }] = useCreateIngredientMutation();
    const [updateIngredient, { isLoading: updating }] = useUpdateIngredientMutation();
    const [uploadIngredientImage, { isLoading: uploadingImage }] = useUploadIngredientImageMutation();
    const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();
    const [deleteIngredient] = useDeleteIngredientMutation();

    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
    const [adjustTarget, setAdjustTarget] = useState<Ingredient | null>(null);
    const [form, setForm] = useState<IngredientForm>(emptyIng);
    const [adjustForm, setAdjustForm] = useState({ delta: "", reason: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [sortMode, setSortMode] = useState<SortMode>("urgency");

    useEffect(() => {
        return () => {
            if (form.imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(form.imagePreview);
            }
        };
    }, [form.imagePreview]);

    const ingredientList = useMemo(() => ingredients ?? [], [ingredients]);
    const productList = useMemo(() => productPage?.content ?? [], [productPage]);
    const lowStockCount = ingredientList.filter((item) => item.lowStock).length;
    const healthyCount = ingredientList.length - lowStockCount;
    const ingredientImageMap = useMemo(() => {
        return new Map(
            ingredientList.map((ingredient) => {
                const bestProduct = [...productList]
                    .sort((a, b) => scoreIngredientImage(ingredient, b) - scoreIngredientImage(ingredient, a))[0];

                return [ingredient.id, resolveStorageUrl(ingredient.imageUrl) ?? resolveStorageUrl(bestProduct?.imageUrl)];
            }),
        );
    }, [ingredientList, productList]);

    const supplierCount = useMemo(() => new Set(
        ingredientList
            .map((item) => item.supplier?.trim())
            .filter((supplier): supplier is string => Boolean(supplier)),
    ).size, [ingredientList]);

    const restockQueue = useMemo(() => {
        return [...ingredientList]
            .filter((item) => item.lowStock)
            .sort((a, b) => getCoverageRatio(a) - getCoverageRatio(b))
            .slice(0, 5);
    }, [ingredientList]);

    const filteredIngredients = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return [...ingredientList]
            .filter((item) => {
                if (filterMode === "low" && !item.lowStock) return false;
                if (filterMode === "healthy" && item.lowStock) return false;
                if (!normalizedQuery) return true;

                return [item.name, item.unit, item.supplier ?? ""].some((value) =>
                    value.toLowerCase().includes(normalizedQuery),
                );
            })
            .sort((a, b) => {
                if (sortMode === "name") return a.name.localeCompare(b.name);
                if (sortMode === "stockHigh") return b.stockQty - a.stockQty;
                if (sortMode === "stockLow") return a.stockQty - b.stockQty;

                return getCoverageRatio(a) - getCoverageRatio(b);
            });
    }, [filterMode, ingredientList, query, sortMode]);

    const nextAction = lowStockCount > 0
        ? `Restock ${restockQueue[0]?.name ?? "priority items"} before the next rush.`
        : "Inventory is healthy for the next service window.";

    function openCreateDialog() {
        setForm(emptyIng);
        setOpenCreate(true);
    }

    function openEdit(ingredient: Ingredient) {
        setEditTarget(ingredient);
        setForm({
            name: ingredient.name,
            unit: ingredient.unit,
            stockQty: String(ingredient.stockQty),
            lowThreshold: String(ingredient.lowThreshold),
            supplier: ingredient.supplier ?? "",
            imageFile: null,
            imagePreview: resolveStorageUrl(ingredient.imageUrl) ?? "",
        });
    }

    function closeDialogs() {
        if (form.imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(form.imagePreview);
        }
        setOpenCreate(false);
        setEditTarget(null);
        setAdjustTarget(null);
        setForm(emptyIng);
        setAdjustForm({ delta: "", reason: "" });
        setFormError(null);
    }

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            const created = await createIngredient({
                name: form.name,
                unit: form.unit,
                stockQty: parseFloat(form.stockQty),
                lowThreshold: parseFloat(form.lowThreshold),
                supplier: form.supplier || undefined,
            }).unwrap();
            if (form.imageFile) {
                await uploadIngredientImage({
                    id: created.id,
                    file: form.imageFile,
                }).unwrap();
            }
            closeDialogs();
        } catch (error: unknown) {
            const apiError = error as { data?: { message?: string } };
            setFormError(apiError?.data?.message ?? "Failed to update ingredient. Please try again.");
        }
    }

    async function handleUpdate(e: FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        setFormError(null);
        try {
            await updateIngredient({
                id: editTarget.id,
                body: {
                    name: form.name,
                    unit: form.unit,
                    stockQty: parseFloat(form.stockQty),
                    lowThreshold: parseFloat(form.lowThreshold),
                    supplier: form.supplier || undefined,
                    imageUrl: editTarget.imageUrl ?? undefined,
                },
            }).unwrap();
            if (form.imageFile) {
                await uploadIngredientImage({
                    id: editTarget.id,
                    file: form.imageFile,
                }).unwrap();
            }
            closeDialogs();
        } catch (error: unknown) {
            const apiError = error as { data?: { message?: string } };
            setFormError(apiError?.data?.message ?? "Failed to save ingredient. Please try again.");
        }
    }

    async function handleAdjust(e: FormEvent) {
        e.preventDefault();
        if (!adjustTarget) return;
        setFormError(null);
        try {
            await adjustStock({
                ingredientId: adjustTarget.id,
                delta: parseFloat(adjustForm.delta),
                reason: adjustForm.reason || undefined,
            }).unwrap();
            closeDialogs();
        } catch (error: unknown) {
            const apiError = error as { data?: { message?: string } };
            setFormError(apiError?.data?.message ?? "Failed to adjust stock. Please try again.");
        }
    }

    return (
        <div className="space-y-8 pb-10 animate-fade-in">
            <section className="relative overflow-hidden rounded-[2.5rem] border border-[#5f3417] bg-[#2e1505] p-8 text-white shadow-2xl">
                <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                />
                <div className="absolute -left-10 top-0 h-44 w-44 rounded-full bg-amber-500/15 blur-[70px]" />
                <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-orange-400/10 blur-[90px]" />

                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-amber-500 text-white shadow-xl">
                                <FlaskConical size={30} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-200/70">Coffee Shop Inventory</p>
                                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Keep beans, milk, and syrups ready for every rush.</h1>
                            </div>
                        </div>

                        <p className="max-w-2xl text-sm font-medium leading-6 text-amber-50/75">
                            This board turns ingredients into a daily service tool: spot shortages quickly, queue restocks for the next bar shift, and update stock without digging through a generic table.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/70">Next Best Action</p>
                                <p className="mt-3 text-lg font-black text-white">{nextAction}</p>
                                <p className="mt-2 text-sm text-amber-100/65">
                                    {lowStockCount > 0
                                        ? `${lowStockCount} ingredients are below par and should be checked before peak orders build up.`
                                        : "All tracked ingredients are above their safety threshold right now."}
                                </p>
                            </div>
                            <div className="rounded-[1.75rem] border border-white/10 bg-[#f8f0e7]/95 p-4 text-stone-900 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-500">Shift Snapshot</p>
                                <div className="mt-3 flex items-end gap-6">
                                    <div>
                                        <p className="text-3xl font-black tracking-tight">{ingredientList.length}</p>
                                        <p className="text-xs font-semibold text-stone-500">ingredients tracked</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black tracking-tight text-red-600">{lowStockCount}</p>
                                        <p className="text-xs font-semibold text-stone-500">need attention</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm font-medium text-stone-600">
                                    Use quick adjust during receiving, waste logging, or end-of-shift recounts.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={openCreateDialog}
                        className="h-12 rounded-2xl bg-white px-6 text-sm font-bold text-stone-950 hover:bg-amber-50"
                    >
                        <Plus size={18} className="mr-2" />
                        Add Ingredient
                    </Button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Tracked Items" value={String(ingredientList.length)} hint="Everything the bar team is actively counting." />
                <MetricCard label="Low Stock" value={String(lowStockCount)} hint={lowStockCount > 0 ? "Priority ingredients are below threshold." : "No current shortages."} />
                <MetricCard label="Ready For Service" value={String(healthyCount)} hint="Items with enough stock to cover normal flow." />
                <MetricCard label="Suppliers" value={String(supplierCount)} hint="Distinct partners currently tied to inventory." />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
                <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.06)]">
                    <CardHeader className="border-b border-stone-100 px-6 py-6 sm:px-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight text-stone-950">Inventory Flow</CardTitle>
                                <CardDescription className="mt-1 text-sm text-stone-500">
                                    Search ingredients, filter by urgency, and sort the list the way your shift thinks.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(["all", "low", "healthy"] as FilterMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setFilterMode(mode)}
                                        className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em] transition ${
                                            filterMode === mode
                                                ? "bg-stone-950 text-white"
                                                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                                        }`}
                                    >
                                        {mode === "all" ? "All Items" : mode === "low" ? "Needs Restock" : "Healthy"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 px-4 py-5 sm:px-8">
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search beans, milk, syrup, supplier..."
                                    className="h-12 rounded-2xl border-stone-200 bg-stone-50 pl-11 font-medium"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {([
                                    ["urgency", "Urgency"],
                                    ["name", "Name"],
                                    ["stockHigh", "Most Stock"],
                                    ["stockLow", "Least Stock"],
                                ] as [SortMode, string][]).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSortMode(value)}
                                        className={`rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition ${
                                            sortMode === value
                                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                                : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-stone-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-stone-100 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Ingredient</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">On Hand</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Coverage</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(6)].map((_, index) => (
                                            <TableRow key={index} className="border-stone-50">
                                                {[...Array(4)].map((__, cellIndex) => (
                                                    <TableCell key={cellIndex} className="py-5">
                                                        <Skeleton className="h-5 w-full rounded-lg" />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : filteredIngredients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center">
                                                <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-stone-100 bg-stone-50">
                                                        <Search className="h-8 w-8 text-stone-300" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-stone-700">
                                                            {ingredientList.length === 0 ? "No ingredients tracked yet" : "No ingredients match this view"}
                                                        </p>
                                                        <p className="text-xs font-medium text-stone-400">
                                                            {ingredientList.length === 0
                                                                ? "Add your first ingredient to start managing coffee shop stock."
                                                                : "Try a different search term or switch the stock filter."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredIngredients.map((item) => {
                                        const coveragePercent = getCoveragePercent(item);
                                        const statusLabel = getStatusLabel(item);
                                        const ingredientImage = ingredientImageMap.get(item.id);
                                        const ownIngredientImage = resolveStorageUrl(item.imageUrl);

                                        return (
                                        <TableRow key={item.id} className="border-stone-50 transition-colors hover:bg-stone-50/70">
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border ${item.lowStock ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50"}`}>
                                                        {ingredientImage ? (
                                                            <Image
                                                                src={ingredientImage}
                                                                alt={item.name}
                                                                fill
                                                                unoptimized={isRemoteStorageUrl(ingredientImage)}
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className={`flex h-full w-full items-center justify-center font-black ${item.lowStock ? "text-red-600" : "text-emerald-600"}`}>
                                                                {item.name.slice(0, 1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-black text-stone-950">{item.name}</p>
                                                        <p className="mt-1 text-[11px] font-semibold text-stone-500">{item.supplier || "No supplier set"} - {item.unit}</p>
                                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                                                            {ownIngredientImage
                                                                ? "Ingredient image from MinIO"
                                                                : ingredientImage
                                                                    ? "Using related product image"
                                                                    : "No image yet"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="space-y-1">
                                                    <p className={`text-lg font-black tracking-tight ${item.lowStock ? "text-red-600" : "text-stone-950"}`}>
                                                        {formatQty(item.stockQty)}
                                                        <span className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                                                            {item.unit}
                                                        </span>
                                                    </p>
                                                    <p className="text-[11px] font-semibold text-stone-500">
                                                        Threshold {formatQty(item.lowThreshold)} {item.unit}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[180px] py-5">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                                                        <span className={item.lowStock ? "text-red-500" : "text-emerald-600"}>{statusLabel}</span>
                                                        <span className="text-stone-400">{coveragePercent}% ready</span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${item.lowStock ? "bg-red-500" : "bg-emerald-500"}`}
                                                            style={{ width: `${coveragePercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl border border-stone-100 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600"
                                                        title="Quick Adjust"
                                                        onClick={() => setAdjustTarget(item)}
                                                    >
                                                        <PackagePlus size={16} />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl border border-stone-100 bg-white shadow-sm hover:bg-stone-100 hover:text-stone-900"
                                                        onClick={() => openEdit(item)}
                                                    >
                                                        <Pencil size={16} />
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl border border-stone-100 bg-white text-stone-300 shadow-sm hover:bg-red-50 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="font-black text-xl">Delete Ingredient?</AlertDialogTitle>
                                                                <AlertDialogDescription className="font-medium text-stone-500">
                                                                    This will permanently remove &quot;{item.name}&quot; from inventory tracking.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="mt-6 flex-row gap-3">
                                                                <AlertDialogCancel className="mt-0 h-11 flex-1 rounded-xl border-stone-200 text-[10px] font-bold uppercase tracking-widest">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteIngredient(item.id)}
                                                                    className="h-11 flex-1 rounded-xl bg-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700"
                                                                >
                                                                    Delete Item
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-[2rem] border-0 bg-[#f7efe5] shadow-[0_16px_50px_rgba(28,25,23,0.06)]">
                        <CardHeader className="px-6 py-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2e1505] text-white">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black tracking-tight text-stone-950">Restock Queue</CardTitle>
                                    <CardDescription className="text-sm text-stone-600">Most urgent ingredients to check before service peaks.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 px-6 pb-6">
                            {restockQueue.length === 0 ? (
                                <div className="rounded-[1.5rem] border border-emerald-200 bg-white/70 p-5">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                                        <div>
                                            <p className="text-sm font-black text-stone-900">No urgent shortages right now</p>
                                            <p className="mt-1 text-sm font-medium text-stone-500">
                                                The bar is stocked above threshold. Keep using quick adjust after deliveries and waste checks.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                restockQueue.map((item) => {
                                    const queueImage = ingredientImageMap.get(item.id);
                                    const ownIngredientImage = resolveStorageUrl(item.imageUrl);

                                    return (
                                        <div key={item.id} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                                                        {queueImage ? (
                                                            <Image
                                                                src={queueImage}
                                                                alt={item.name}
                                                                fill
                                                                unoptimized={isRemoteStorageUrl(queueImage)}
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-sm font-black text-stone-500">
                                                                {item.name.slice(0, 1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-stone-950">{item.name}</p>
                                                        <p className="mt-1 text-xs font-semibold text-stone-500">
                                                            {item.supplier || "Supplier not set"} - {formatQty(item.stockQty)} {item.unit} left
                                                        </p>
                                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                                                            {ownIngredientImage
                                                                ? "Ingredient image"
                                                                : queueImage
                                                                    ? "Related product image"
                                                                    : "No image yet"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdjustTarget(item)}
                                                    className="rounded-full bg-stone-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-stone-800"
                                                >
                                                    Adjust
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                                                <span>Threshold {formatQty(item.lowThreshold)} {item.unit}</span>
                                                <span className="text-red-500">{getStatusLabel(item)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-0 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.06)]">
                        <CardHeader className="px-6 py-6">
                            <CardTitle className="text-lg font-black tracking-tight text-stone-950">Shift Guidance</CardTitle>
                            <CardDescription className="text-sm text-stone-500">
                                Helpful prompts for smoother receiving, prep, and waste tracking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 pb-6">
                            <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
                                <div className="flex items-start gap-3">
                                    <Warehouse className="mt-0.5 h-5 w-5 text-stone-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Receiving checklist</p>
                                        <p className="mt-1 text-sm font-medium text-stone-500">
                                            Use quick adjust the moment beans, milk, cups, or syrups arrive so the next shift sees real stock.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
                                <div className="flex items-start gap-3">
                                    <Truck className="mt-0.5 h-5 w-5 text-stone-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Supplier coverage</p>
                                        <p className="mt-1 text-sm font-medium text-stone-500">
                                            {supplierCount > 0
                                                ? `${supplierCount} suppliers are linked to current inventory. Fill missing supplier names to make reorder calls faster.`
                                                : "Supplier names are still empty. Adding them will make reorder decisions easier for staff."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
                                <div className="flex items-start gap-3">
                                    <Coffee className="mt-0.5 h-5 w-5 text-stone-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Coffee shop pacing</p>
                                        <p className="mt-1 text-sm font-medium text-stone-500">
                                            Keep core ingredients like espresso beans, milk, and takeaway cups above 150% of threshold to stay ready for a lunch rush.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <ListFilter className="mt-0.5 h-5 w-5 text-amber-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Best way to scan</p>
                                        <p className="mt-1 text-sm font-medium text-stone-600">
                                            Start with the “Needs Restock” filter, then sort by urgency to clear the most at-risk items first.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* ── Dialogs ── */}
            <InventoryDialog
                open={openCreate}
                onClose={closeDialogs}
                title="New Ingredient"
                description="Track a new stock item for the bar"
                icon={Box}
            >
                <IngredientFormFields form={form} setForm={setForm} onSubmit={handleCreate} onClose={closeDialogs} loading={creating || uploadingImage} mode="create" formError={formError} />
            </InventoryDialog>

            <InventoryDialog
                open={editTarget !== null}
                onClose={closeDialogs}
                title="Edit Ingredient"
                description={`Update ${editTarget?.name ?? "ingredient"} details`}
                icon={Pencil}
            >
                <IngredientFormFields form={form} setForm={setForm} onSubmit={handleUpdate} onClose={closeDialogs} loading={updating || uploadingImage} mode="edit" formError={formError} />
            </InventoryDialog>

            <InventoryDialog
                open={adjustTarget !== null}
                onClose={closeDialogs}
                title="Quick Adjust"
                description={`Log a stock movement for ${adjustTarget?.name ?? "this item"}`}
                icon={ArrowUpDown}
            >
                <form onSubmit={handleAdjust} className="space-y-5">
                    <div className="grid gap-3 rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4 sm:grid-cols-2">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Current Stock</span>
                            <span className="text-xl font-black text-stone-900">{formatQty(adjustTarget?.stockQty ?? 0)} <span className="text-[10px] uppercase opacity-50">{adjustTarget?.unit}</span></span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">New Calculated</span>
                            <span className="text-xl font-black text-amber-600">
                                {formatQty((adjustTarget?.stockQty ?? 0) + parseFloat(adjustForm.delta || "0"))} <span className="text-[10px] uppercase opacity-50">{adjustTarget?.unit}</span>
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Adjustment Delta (+/-)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. +10 or -2.5"
                                value={adjustForm.delta}
                                onChange={(e) => setAdjustForm((f) => ({ ...f, delta: e.target.value }))}
                                required
                                className="h-12 rounded-xl focus:border-amber-400 text-lg font-black"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reason / Note</Label>
                            <Input
                                placeholder="e.g. Morning restock or waste"
                                value={adjustForm.reason}
                                onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                                className="h-12 rounded-xl focus:border-amber-400"
                            />
                        </div>
                    </div>

                    {formError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600">
                            {formError}
                        </div>
                    )}
                    <div className="pt-4 flex items-center justify-between gap-3 border-t border-stone-100">
                        <button type="button" onClick={closeDialogs} className="text-xs font-bold text-stone-400 hover:text-stone-600 px-4">Cancel</button>
                        <button
                            type="submit"
                            disabled={adjusting}
                            className="flex items-center gap-2 h-11 px-6 rounded-2xl font-bold text-xs text-white transition-all active:scale-95 disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 4px_12px rgba(59,130,246,0.3)" }}
                        >
                            {adjusting ? <Loader2 size={14} className="animate-spin" /> : <History size={14} />}
                            Apply Adjustment
                        </button>
                    </div>
                </form>
            </InventoryDialog>

        </div>
    );
}
