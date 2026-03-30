"use client";

import { useEffect, useMemo, useState } from "react";
import {
    useGetAdminProductsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useSoftDeleteProductMutation,
    useUploadProductImageMutation,
} from "@/store/api/productsApi";
import { useGetAdminCategoriesQuery } from "@/store/api/dashboardApi";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { resolveStorageUrl } from "@/lib/storage";
import { Coffee, ChevronLeft, ChevronRight, Trash2, Plus, Pencil, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";
import type { Product, Category } from "@/types";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFormValues {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    showOnHomepage: boolean;
    todaySpecial: boolean;
    homePriority: string;
    imageFile: File | null;
    imagePreview: string;
}

type ProductViewMode = "active" | "hidden" | "all";

interface FeedbackState {
    tone: "success" | "error";
    message: string;
}

const emptyForm: ProductFormValues = {
    name: "",
    description: "",
    price: "",
    categoryId: "",
    showOnHomepage: false,
    todaySpecial: false,
    homePriority: "",
    imageFile: null,
    imagePreview: "",
};

// ─── ProductForm — defined at module level so React never remounts it mid-render

interface ProductFormProps {
    form: ProductFormValues;
    setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    categories: Category[] | undefined;
}

function ProductForm({ form, setForm, onSubmit, loading, categories }: ProductFormProps) {
    const isTodaySpecial = form.todaySpecial;
    const typeLabel = isTodaySpecial ? "Today's Special" : "Normal Product";
    const typeDescription = isTodaySpecial
        ? "This item will appear in the homepage special section and stay highlighted for guests."
        : "This item stays in the regular menu flow, with optional homepage placement.";

    return (
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,251,235,0.58),rgba(255,255,255,1)_30%,rgba(248,250,252,0.86))] px-6 py-6">
                <div className="mb-6 rounded-[28px] border border-amber-100 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(120,53,15,0.6)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-200">
                                <Coffee className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase tracking-[0.28em]">Product studio</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight text-white">{typeLabel}</h3>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-50/80">{typeDescription}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-white/15 bg-white/10 px-3 py-1 text-amber-100">
                                {isTodaySpecial ? "Homepage spotlight" : "Daily menu"}
                            </Badge>
                            <Badge variant="outline" className="border-white/15 bg-white/10 px-3 py-1 text-slate-100">
                                {form.imagePreview ? "Image selected" : "Image optional"}
                            </Badge>
                        </div>
                    </div>
                </div>
            <div className="space-y-3 rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
                <Label>Product Type</Label>
                <div className="grid gap-3 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, todaySpecial: false }))}
                        className={`rounded-[24px] border p-5 text-left transition-all ${!isTodaySpecial ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-[0_18px_45px_-34px_rgba(217,119,6,0.7)]" : "border-slate-200 bg-slate-50/70 hover:border-amber-300 hover:bg-amber-50/50"}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-lg font-semibold text-slate-900">Normal Product</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Standard menu item for daily ordering and catalog browsing.
                                </p>
                            </div>
                            {!isTodaySpecial && (
                                <Badge variant="outline" className="border-amber-200 bg-white/90 text-amber-800">
                                    Selected
                                </Badge>
                            )}
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({
                            ...f,
                            todaySpecial: true,
                            showOnHomepage: true,
                        }))}
                        className={`rounded-[24px] border p-5 text-left transition-all ${isTodaySpecial ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-[0_18px_45px_-34px_rgba(217,119,6,0.7)]" : "border-slate-200 bg-slate-50/70 hover:border-amber-300 hover:bg-amber-50/50"}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-lg font-semibold text-slate-900">Today&apos;s Special</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Highlighted for the homepage special section and featured for guests first.
                                </p>
                            </div>
                            {isTodaySpecial && (
                                <Badge variant="outline" className="border-amber-200 bg-white/90 text-amber-800">
                                    Selected
                                </Badge>
                            )}
                        </div>
                    </button>
                </div>
            </div>
            <div className="space-y-2 rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
                <Label className="text-sm font-medium text-slate-800">Name <span className="text-red-500">*</span></Label>
                <Input
                    placeholder="e.g. Caramel Latte"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-base shadow-none focus-visible:ring-amber-400"
                />
            </div>
            <div className="space-y-2 rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
                <Label className="text-sm font-medium text-slate-800">Description</Label>
                <Textarea
                    placeholder="Brief description…"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="min-h-[132px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-base shadow-none focus-visible:ring-amber-400"
                />
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] md:grid-cols-2">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-800">Price (THB) <span className="text-red-500">*</span></Label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        required
                        className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-base shadow-none focus-visible:ring-amber-400"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-800">Category</Label>
                    <Select
                        value={form.categoryId}
                        onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                    >
                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                            {categories?.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.icon && <span className="mr-1">{c.icon}</span>}{c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] md:grid-cols-[1fr_220px]">
                <div className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start gap-3">
                        <input
                            id="show-on-homepage"
                            type="checkbox"
                            checked={form.showOnHomepage}
                            onChange={(e) => setForm((f) => ({ ...f, showOnHomepage: e.target.checked }))}
                            className="mt-1 h-4 w-4 rounded border-border accent-amber-600"
                            disabled={isTodaySpecial}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="show-on-homepage" className="text-sm font-medium text-slate-800">Show on Home Page</Label>
                            <p className="text-sm leading-6 text-slate-600">
                                {isTodaySpecial
                                    ? "Today's Special products are always shown on the homepage."
                                    : "Optional: feature this normal product in the homepage workflow."}
                            </p>
                        </div>
                    </div>
                    <div className={`rounded-[18px] border px-4 py-3 text-sm leading-6 ${isTodaySpecial ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600"}`}>
                        {isTodaySpecial
                            ? "Today's Special: guests will see this item in the homepage spotlight area."
                            : "Normal Product: this stays a regular menu item unless you also enable homepage placement."}
                    </div>
                </div>
                <div className="space-y-2 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                    <Label className="text-sm font-medium text-slate-800">{isTodaySpecial ? "Special Priority" : "Home Priority"}</Label>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={form.homePriority}
                        onChange={(e) => setForm((f) => ({ ...f, homePriority: e.target.value }))}
                        className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-base shadow-none focus-visible:ring-amber-400"
                    />
                    <p className="text-sm leading-6 text-slate-600">
                        {isTodaySpecial
                            ? "Lower numbers appear first in Today's Special."
                            : "Lower numbers appear first if this normal product is shown on home."}
                    </p>
                </div>
            </div>
            <div className="space-y-4 rounded-[26px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-slate-800">Product Image</Label>
                        <p className="mt-1 text-sm text-slate-500">Upload a clean image for the menu and homepage.</p>
                    </div>
                </div>
                <Input
                    type="file"
                    accept="image/*"
                    className="rounded-2xl border-slate-200 bg-white"
                    onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;

                        const nextPreview = URL.createObjectURL(file);
                        setForm((f) => {
                            if (f.imagePreview.startsWith("blob:")) {
                                URL.revokeObjectURL(f.imagePreview);
                            }
                            return { ...f, imageFile: file, imagePreview: nextPreview };
                        });
                    }}
                />
                <p className="text-sm leading-6 text-slate-500">
                    Selected image will be uploaded to MinIO after saving this product.
                </p>
                {form.imagePreview && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                        <Image
                            src={form.imagePreview}
                            alt="Product preview"
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                )}
                {!form.imagePreview && (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_48%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.9))] px-6 text-center">
                        <div className="space-y-2">
                            <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium text-slate-700">No image selected yet</p>
                            <p className="text-sm leading-6 text-slate-500">Add a product photo so guests can recognize this item quickly.</p>
                        </div>
                    </div>
                )}
            </div>
            </div>
            <DialogFooter className="border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Review the product details, then save to publish it to your menu workflow.
                    </p>
                    <Button type="submit" disabled={loading} className="h-12 rounded-2xl bg-amber-600 px-6 text-white shadow-sm hover:bg-amber-700">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Saving…" : "Save Product"}
                    </Button>
                </div>
            </DialogFooter>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
    const [page, setPage] = useState(0);
    const { data, isLoading, isFetching, refetch } = useGetAdminProductsQuery({ page, size: 20 });
    const { data: categories } = useGetAdminCategoriesQuery();
    const [createProduct, { isLoading: creating }] = useCreateProductMutation();
    const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
    const [softDelete, { isLoading: deleting }] = useSoftDeleteProductMutation();
    const [uploadProductImage, { isLoading: uploadingImage }] = useUploadProductImageMutation();

    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductFormValues>(emptyForm);
    const [viewMode, setViewMode] = useState<ProductViewMode>("active");
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [imageFailures, setImageFailures] = useState<Record<string, boolean>>({});

    useEffect(() => {
        return () => {
            if (form.imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(form.imagePreview);
            }
        };
    }, [form.imagePreview]);

    function resetForm() {
        setForm((prev) => {
            if (prev.imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(prev.imagePreview);
            }
            return emptyForm;
        });
    }

    const allProducts = useMemo(() => data?.content ?? [], [data?.content]);
    const productCounts = useMemo(() => {
        const active = allProducts.filter((product) => product.active).length;
        const hidden = allProducts.length - active;
        const withImages = allProducts.filter((product) => Boolean(resolveStorageUrl(product.imageUrl))).length;
        return { active, hidden, withImages };
    }, [allProducts]);

    const visibleProducts = useMemo(() => {
        if (viewMode === "active") return allProducts.filter((product) => product.active);
        if (viewMode === "hidden") return allProducts.filter((product) => !product.active);
        return allProducts;
    }, [allProducts, viewMode]);

    function setSuccess(message: string) {
        setFeedback({ tone: "success", message });
    }

    function setErrorMessage(error: unknown, fallback: string) {
        setFeedback({ tone: "error", message: extractErrorMessage(error, fallback) });
    }

    function openEdit(product: Product) {
        setFeedback(null);
        setEditTarget(product);
        setForm({
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            categoryId: categories?.find((c) => c.name === product.category)?.id?.toString() ?? "",
            showOnHomepage: product.showOnHomepage,
            todaySpecial: product.todaySpecial,
            homePriority: product.homePriority != null ? String(product.homePriority) : "",
            imageFile: null,
            imagePreview: resolveStorageUrl(product.imageUrl) ?? "",
        });
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setFeedback(null);
        try {
            const created = await createProduct({
                name: form.name,
                description: form.description || undefined,
                price: parseFloat(form.price),
                categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
                showOnHomepage: form.showOnHomepage,
                todaySpecial: form.todaySpecial,
                homePriority: form.homePriority ? parseInt(form.homePriority) : undefined,
            }).unwrap();

            if (form.imageFile) {
                await uploadProductImage({ id: created.id, file: form.imageFile }).unwrap();
            }

            await refetch();
            resetForm();
            setOpenCreate(false);
            setImageFailures((current) => {
                const next = { ...current };
                delete next[created.id];
                return next;
            });
            setSuccess(form.imageFile
                ? "Product created and image uploaded to MinIO."
                : "Product created. Upload an image later from edit if needed.");
        } catch (err) {
            console.error("Failed to create product:", err);
            setErrorMessage(err, "Failed to create product.");
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        setFeedback(null);
        try {
            await updateProduct({
                id: editTarget.id,
                body: {
                    name: form.name,
                    description: form.description || undefined,
                    price: parseFloat(form.price),
                    categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
                    showOnHomepage: form.showOnHomepage,
                    todaySpecial: form.todaySpecial,
                    homePriority: form.homePriority ? parseInt(form.homePriority) : undefined,
                },
            }).unwrap();

            if (form.imageFile) {
                await uploadProductImage({ id: editTarget.id, file: form.imageFile }).unwrap();
            }

            await refetch();
            setImageFailures((current) => {
                const next = { ...current };
                delete next[editTarget.id];
                return next;
            });
            setEditTarget(null);
            resetForm();
            setSuccess(form.imageFile
                ? "Product updated and image refreshed from MinIO."
                : "Product details updated.");
        } catch (err) {
            console.error("Failed to update product:", err);
            setErrorMessage(err, "Failed to update product.");
        }
    }

    async function handleArchive(product: Product) {
        setFeedback(null);
        try {
            await softDelete(product.id).unwrap();
            await refetch();
            setSuccess(`"${product.name}" was hidden from the active menu list.`);
        } catch (err) {
            console.error("Failed to hide product:", err);
            setErrorMessage(err, "Failed to hide product.");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Coffee className="h-6 w-6 text-amber-600" />
                        Products
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage your menu items</p>
                </div>
                <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="mt-6 flex max-h-[calc(100vh-3rem)] w-[min(96vw,1100px)] self-start flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-2xl sm:mt-8 sm:max-h-[calc(100vh-4rem)]">
                        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
                            <DialogTitle>New Product</DialogTitle>
                            <DialogDescription>Add a new item to your menu with cleaner storefront placement and imagery.</DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            form={form}
                            setForm={setForm}
                            onSubmit={handleCreate}
                            loading={creating || uploadingImage}
                            categories={categories}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Menu Items</CardTitle>
                    <CardDescription>
                        {data
                            ? `${productCounts.active} active, ${productCounts.hidden} hidden, ${productCounts.withImages} with images`
                            : "Loading..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                            <Button variant={viewMode === "active" ? "default" : "outline"} size="sm" onClick={() => setViewMode("active")}>
                                Active ({productCounts.active})
                            </Button>
                            <Button variant={viewMode === "hidden" ? "default" : "outline"} size="sm" onClick={() => setViewMode("hidden")}>
                                Hidden ({productCounts.hidden})
                            </Button>
                            <Button variant={viewMode === "all" ? "default" : "outline"} size="sm" onClick={() => setViewMode("all")}>
                                All ({allProducts.length})
                            </Button>
                        </div>

                        {feedback && (
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                                {feedback.message}
                            </div>
                        )}

                        {isFetching && !isLoading && (
                            <p className="text-sm text-muted-foreground">Refreshing products...</p>
                        )}
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Home</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? [...Array(8)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(7)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : visibleProducts.map((product) => {
                                    const imageSrc = resolveStorageUrl(product.imageUrl) ?? "";
                                    const imageFailed = Boolean(imageFailures[product.id]);
                                    const canRenderImage = Boolean(product.imageUrl && imageSrc && !imageFailed);

                                    return (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                                {canRenderImage ? (
                                                    <img
                                                        src={imageSrc}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                        onError={() => setImageFailures((current) => ({ ...current, [product.id]: true }))}
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                                                {product.imageUrl && imageFailed && (
                                                    <p className="text-[11px] text-amber-700">Image saved but not loading</p>
                                                )}
                                                {!product.imageUrl && (
                                                    <p className="text-[11px] text-muted-foreground">No image uploaded yet</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{product.category ?? "-"}</Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {product.todaySpecial && (
                                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Today&apos;s Special</Badge>
                                                )}
                                                {product.showOnHomepage && (
                                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                                        Home {product.homePriority != null ? `#${product.homePriority}` : ""}
                                                    </Badge>
                                                )}
                                                {!product.todaySpecial && !product.showOnHomepage && (
                                                    <span className="text-xs text-muted-foreground">Not on home</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={product.active ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                                                {product.active ? "Active" : "Hidden"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* Edit */}
                                                <Dialog open={editTarget?.id === product.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); resetForm(); } }}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="mt-6 flex max-h-[calc(100vh-3rem)] w-[min(96vw,1100px)] self-start flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-2xl sm:mt-8 sm:max-h-[calc(100vh-4rem)]">
                                                        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
                                                            <DialogTitle>Edit Product</DialogTitle>
                                                            <DialogDescription>Update &quot;{editTarget?.name}&quot;</DialogDescription>
                                                        </DialogHeader>
                                                        <ProductForm
                                                            form={form}
                                                            setForm={setForm}
                                                            onSubmit={handleUpdate}
                                                            loading={updating || uploadingImage}
                                                            categories={categories}
                                                        />
                                                    </DialogContent>
                                                </Dialog>

                                                {/* Delete */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Hide &quot;{product.name}&quot;?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This removes the product from the active admin list and customer menu while keeping order history intact.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleArchive(product)} disabled={deleting}>
                                                                {deleting ? "Hiding..." : "Hide Product"}
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

                    {!isLoading && visibleProducts.length === 0 && (
                        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
                            <ImageIcon className="h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium text-slate-800">No products in this view</p>
                            <p className="text-sm text-slate-500">
                                {viewMode === "active"
                                    ? "Hidden products are removed from the main admin list. Switch to Hidden or All to review them."
                                    : viewMode === "hidden"
                                        ? "You do not have any hidden products right now."
                                        : "Create a product to start building the menu."}
                            </p>
                        </div>
                    )}

                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Page {page + 1} of {data.totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                </Button>
                                <Button variant="outline" size="sm" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
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









function extractErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "object" && error !== null) {
        const maybeQueryError = error as FetchBaseQueryError & { data?: { error?: string } | string; message?: string };
        if (typeof maybeQueryError.data === "string" && maybeQueryError.data.trim()) return maybeQueryError.data;
        if (typeof maybeQueryError.data === "object" && maybeQueryError.data?.error) return maybeQueryError.data.error;
        if (typeof maybeQueryError.message === "string" && maybeQueryError.message.trim()) return maybeQueryError.message;
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

