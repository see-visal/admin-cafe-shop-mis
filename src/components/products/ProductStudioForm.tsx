"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveStorageUrl } from "@/lib/storage";
import type { StorageImageAsset } from "@/store/api/managementApi";
import type { Category } from "@/types";
import {
    CheckCircle2,
    ChevronDown,
    ImageIcon,
    ImageUp,
    LayoutPanelTop,
    Loader2,
    Sparkles,
    Star,
} from "lucide-react";

type ProductStudioFormValues = {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    showOnHomepage: boolean;
    todaySpecial: boolean;
    homePriority: string;
    imageFile: File | null;
    imagePreview: string;
    imageUrl: string;
    imageUploadState: "idle" | "uploading" | "uploaded" | "error";
    imageUploadMessage: string;
};

interface ProductStudioFormProps {
    form: ProductStudioFormValues;
    setForm: Dispatch<SetStateAction<ProductStudioFormValues>>;
    onSubmit: (event: FormEvent) => void;
    onImageSelected: (file: File | null) => void | Promise<void>;
    onImageUrlChanged: (value: string) => void;
    loading: boolean;
    categories: Category[] | undefined;
    existingImages: StorageImageAsset[];
    loadingExistingImages: boolean;
}

const PRODUCT_IMAGE_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET || "coffeeshop-files";

function normalizeProductImageReference(value: string): string {
    const normalized = value.trim();
    if (!normalized) return "";

    const bareFilenamePattern = /^[^/\\]+\.(jpg|jpeg|png|webp|gif|avif|svg)$/i;
    if (bareFilenamePattern.test(normalized)) {
        return `${PRODUCT_IMAGE_BUCKET}/products/${normalized}`;
    }

    if (normalized.startsWith("/products/")) {
        return `${PRODUCT_IMAGE_BUCKET}${normalized}`;
    }

    if (normalized.startsWith("products/")) {
        return `${PRODUCT_IMAGE_BUCKET}/${normalized}`;
    }

    return normalized;
}

export function ProductStudioForm({
    form,
    setForm,
    onSubmit,
    onImageSelected,
    onImageUrlChanged,
    loading,
    categories,
    existingImages,
    loadingExistingImages,
}: ProductStudioFormProps) {
    const isTodaySpecial = form.todaySpecial;
    const selectedCategory = categories?.find((category) => String(category.id) === form.categoryId);
    const parsedPrice = Number.parseFloat(form.price);
    const previewPrice = Number.isFinite(parsedPrice) ? `${parsedPrice.toFixed(2)} THB` : "Set price";
    const productLabel = isTodaySpecial ? "Today's Special" : "Normal Product";
    const placementLabel = isTodaySpecial
        ? "Homepage spotlight"
        : form.showOnHomepage
            ? "Featured on home"
            : "Menu only";
    const placementDescription = isTodaySpecial
        ? "Pinned for the homepage spotlight."
        : form.showOnHomepage
            ? "Visible in both the menu and the homepage."
            : "Visible in the main menu only.";
    const livePreviewSrc = form.imagePreview || resolveStorageUrl(form.imageUrl) || "";
    const hasImage = Boolean(livePreviewSrc || form.imageUploadState === "uploaded");
    const imageStatusMessage = form.imageUploadMessage || (hasImage
        ? "Image is ready for save."
        : "Upload a new image or choose one from MinIO.");
    const imageStatusClassName = form.imageUploadState === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : form.imageUploadState === "uploaded"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : form.imageUploadState === "uploading"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-stone-200 bg-stone-50 text-stone-600";
    const previewName = form.name.trim() || "Your new product";
    const previewDescription = form.description.trim() || "Add a short description so guests understand the flavor, texture, or what makes this item worth trying.";
    const panelClassName = "rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_20px_55px_-48px_rgba(15,23,42,0.3)] sm:p-6";
    const fieldClassName = "h-12 rounded-2xl border-stone-200 bg-white px-4 text-[15px] shadow-none focus-visible:ring-amber-400";
    const captionClassName = "text-[10px] font-black uppercase tracking-[0.24em] text-stone-400";
    const summaryCardClassName = "rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]";
    const checklistItems = [
        {
            label: "Name",
            value: form.name.trim() || "Add a product name",
            done: Boolean(form.name.trim()),
        },
        {
            label: "Price",
            value: Number.isFinite(parsedPrice) ? previewPrice : "Set the price",
            done: Number.isFinite(parsedPrice),
        },
        {
            label: "Placement",
            value: placementLabel,
            done: true,
        },
        {
            label: "Image",
            value: hasImage ? "Storefront ready" : "Optional for now",
            done: hasImage,
        },
    ];

    return (
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col bg-[#fbfaf7]">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-5xl space-y-6">
                    <section className="rounded-[32px] border border-amber-100 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),linear-gradient(180deg,#fffdf8_0%,#fff8ec_100%)] p-6 shadow-[0_28px_80px_-58px_rgba(217,119,6,0.35)] sm:p-7">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-amber-700">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Product Composer
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight text-slate-950 sm:text-[2.35rem]">
                                        {isTodaySpecial ? "Create a standout special" : "Create a polished menu item"}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">
                                        Use a clearer publishing flow: add the essentials, choose placement, then finish with an image that feels right for the storefront.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px]">
                                <div className={summaryCardClassName}>
                                    <p className={captionClassName}>Type</p>
                                    <p className="mt-2 text-sm font-bold text-slate-900">{productLabel}</p>
                                </div>
                                <div className={summaryCardClassName}>
                                    <p className={captionClassName}>Price</p>
                                    <p className="mt-2 text-sm font-bold text-slate-900">{previewPrice}</p>
                                </div>
                                <div className={summaryCardClassName}>
                                    <p className={captionClassName}>Category</p>
                                    <p className="mt-2 text-sm font-bold text-slate-900">{selectedCategory?.name || "Optional"}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="min-w-0 space-y-6">
                            <section className={panelClassName}>
                                <div className="mb-6 flex items-start gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                        <Star className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className={captionClassName}>Basics</p>
                                        <h4 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Product details</h4>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Start with the role and the basic information staff and guests need most.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm((current) => ({ ...current, todaySpecial: false }))}
                                        className={`rounded-[24px] border p-5 text-left transition ${!isTodaySpecial
                                            ? "border-amber-400 bg-amber-50 shadow-[0_16px_35px_rgba(217,119,6,0.14)]"
                                            : "border-stone-200 bg-stone-50 hover:border-amber-200 hover:bg-amber-50/50"}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-black tracking-tight text-slate-900">Normal Product</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    Best for daily ordering and regular menu browsing.
                                                </p>
                                            </div>
                                            {!isTodaySpecial && <Badge variant="outline" className="border-amber-300 bg-white text-amber-700">Selected</Badge>}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setForm((current) => ({ ...current, todaySpecial: true, showOnHomepage: true }))}
                                        className={`rounded-[24px] border p-5 text-left transition ${isTodaySpecial
                                            ? "border-orange-400 bg-orange-50 shadow-[0_16px_35px_rgba(234,88,12,0.14)]"
                                            : "border-stone-200 bg-stone-50 hover:border-orange-200 hover:bg-orange-50/50"}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-black tracking-tight text-slate-900">Today&apos;s Special</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    Best for a highlighted item that guests should notice first.
                                                </p>
                                            </div>
                                            {isTodaySpecial && <Badge variant="outline" className="border-orange-300 bg-white text-orange-700">Selected</Badge>}
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className={captionClassName}>Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                placeholder="e.g. Iced Caramel Latte"
                                                value={form.name}
                                                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                                                required
                                                className={fieldClassName}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className={captionClassName}>Description</Label>
                                            <Textarea
                                                placeholder="Describe the taste, texture, or what makes this item special..."
                                                value={form.description}
                                                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                                                rows={5}
                                                className="min-h-[156px] rounded-[24px] border-stone-200 bg-white px-4 py-3 text-base shadow-none focus-visible:ring-amber-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className={captionClassName}>Price (THB) <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={form.price}
                                                onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
                                                required
                                                className={fieldClassName}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className={captionClassName}>Category</Label>
                                            <Select value={form.categoryId} onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}>
                                                <SelectTrigger className={`${fieldClassName} w-full`}>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories?.map((category) => (
                                                        <SelectItem key={category.id} value={String(category.id)}>
                                                            {category.icon && <span className="mr-1">{category.icon}</span>}
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
                                            <p className={captionClassName}>Placement note</p>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {selectedCategory
                                                    ? `This product will appear inside "${selectedCategory.name}" in the menu.`
                                                    : "Adding a category is optional, but it keeps the storefront easier to scan."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section className={panelClassName}>
                                <div className="mb-6 flex items-start gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                                        <LayoutPanelTop className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className={captionClassName}>Visibility</p>
                                        <h4 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Homepage placement</h4>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Decide whether this item stays in the menu only or also gets stronger homepage visibility.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                                    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                                        <div className="flex items-start gap-3">
                                            <input
                                                id="show-on-homepage"
                                                type="checkbox"
                                                checked={form.showOnHomepage}
                                                onChange={(e) => setForm((current) => ({ ...current, showOnHomepage: e.target.checked }))}
                                                className="mt-1 h-4 w-4 rounded border-border accent-amber-600"
                                                disabled={isTodaySpecial}
                                            />
                                            <div>
                                                <Label htmlFor="show-on-homepage" className="text-sm font-bold text-slate-900">
                                                    Show on home page
                                                </Label>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {isTodaySpecial
                                                        ? "Today's Special is always promoted on the homepage."
                                                        : "Turn this on when a regular product should also be featured on the homepage."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`mt-4 rounded-[20px] border px-4 py-3 text-sm leading-6 ${isTodaySpecial ? "border-amber-200 bg-amber-50 text-amber-900" : "border-stone-200 bg-white text-slate-600"}`}>
                                            {placementDescription}
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                                        <Label className={captionClassName}>{isTodaySpecial ? "Spotlight Priority" : "Home Priority"}</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="0"
                                            value={form.homePriority}
                                            onChange={(e) => setForm((current) => ({ ...current, homePriority: e.target.value }))}
                                            className={`${fieldClassName} mt-3`}
                                        />
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            Lower numbers appear earlier in the homepage lineup.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className={panelClassName}>
                                <div className="mb-6 flex items-start gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                        <ImageUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className={captionClassName}>Image</p>
                                        <h4 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Product image</h4>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Add one strong image. Upload a fresh file or choose something already stored in MinIO.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex cursor-pointer items-center gap-4 rounded-[24px] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 transition hover:border-amber-300 hover:bg-amber-50/60">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)]">
                                            <ImageUp className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-900">Upload product image</p>
                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                Use a clean product photo that looks good in the storefront preview.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">Select file</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                if (file) {
                                                    void onImageSelected(file);
                                                }
                                                e.currentTarget.value = "";
                                            }}
                                        />
                                    </label>

                                    <div className={`rounded-[20px] border px-4 py-3 text-sm ${imageStatusClassName}`}>
                                        <div className="flex items-start gap-2">
                                            {form.imageUploadState === "uploading" && <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />}
                                            <span className="leading-6">{imageStatusMessage}</span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                                        <div className="space-y-2">
                                            <Label className={captionClassName}>Use an existing MinIO image</Label>
                                            <Input
                                                type="text"
                                                placeholder="Example: products/cappuccino.jpg"
                                                value={form.imageUrl}
                                                onChange={(e) => onImageUrlChanged(e.target.value)}
                                                className={fieldClassName}
                                            />
                                            <p className="text-sm leading-6 text-slate-500">
                                                Paste one image path, a public MinIO URL, or a browser file link.
                                            </p>
                                        </div>

                                        <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
                                            <p className={captionClassName}>Examples</p>
                                            <p className="mt-3 break-all text-sm font-medium text-slate-700"><code>products/cappuccino.jpg</code></p>
                                            <p className="mt-2 break-all text-sm text-slate-500"><code>{PRODUCT_IMAGE_BUCKET}/products/cappuccino.jpg</code></p>
                                        </div>
                                    </div>

                                    <details className="overflow-hidden rounded-[24px] border border-stone-200 bg-stone-50" open={existingImages.length > 0 && existingImages.length <= 6}>
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Browse uploaded images</p>
                                                <p className="text-sm text-slate-500">
                                                    Pick from files inside <code>{PRODUCT_IMAGE_BUCKET}/products</code>.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-stone-400">
                                                {loadingExistingImages && <Loader2 className="h-4 w-4 animate-spin" />}
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </summary>

                                        <div className="border-t border-stone-200 px-4 py-4">
                                            {existingImages.length > 0 ? (
                                                <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 lg:grid-cols-4">
                                                    {existingImages.map((image) => {
                                                        const previewUrl = resolveStorageUrl(image.path) ?? "";
                                                        const selected = normalizeProductImageReference(form.imageUrl) === image.path || form.imageUrl === previewUrl;

                                                        return (
                                                            <button
                                                                key={image.path}
                                                                type="button"
                                                                onClick={() => onImageUrlChanged(image.path)}
                                                                className={`overflow-hidden rounded-[20px] border text-left transition ${selected
                                                                    ? "border-amber-400 bg-amber-50 shadow-[0_16px_35px_rgba(217,119,6,0.14)]"
                                                                    : "border-stone-200 bg-white hover:border-amber-200 hover:bg-amber-50/40"}`}
                                                            >
                                                                <div className="aspect-square overflow-hidden bg-stone-100">
                                                                    {previewUrl ? (
                                                                        <img src={previewUrl} alt={image.name} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="flex h-full items-center justify-center text-stone-400">
                                                                            <ImageIcon className="h-6 w-6" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="px-3 py-2">
                                                                    <p className="truncate text-sm font-bold text-slate-800">{image.name}</p>
                                                                    <p className="truncate text-xs text-slate-500">{image.path}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="rounded-[20px] border border-dashed border-stone-300 bg-white px-4 py-5 text-sm text-slate-500">
                                                    {loadingExistingImages ? "Loading MinIO product images..." : "No product images were found in MinIO yet."}
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </section>
                        </div>

                        <aside className="min-w-0 space-y-6 xl:sticky xl:top-0 xl:self-start">
                            <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_22px_60px_-46px_rgba(15,23,42,0.28)]">
                                <div className="border-b border-stone-200 bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ea_100%)] px-5 py-4">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-slate-900">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                                        Live Preview
                                    </div>
                                </div>

                                {livePreviewSrc ? (
                                    <div className="aspect-[4/3] overflow-hidden border-b border-stone-200 bg-stone-100">
                                        <img src={livePreviewSrc} alt={previewName} className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="flex aspect-[4/3] items-center justify-center border-b border-dashed border-stone-200 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_48%),linear-gradient(180deg,#fffdf9_0%,#ffffff_100%)] text-stone-400">
                                        <div className="space-y-3 text-center">
                                            <ImageIcon className="mx-auto h-10 w-10" />
                                            <p className="text-sm font-medium">Preview appears here</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 p-5">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{productLabel}</Badge>
                                        <Badge variant="outline" className="border-stone-200 bg-white text-stone-600">{placementLabel}</Badge>
                                    </div>

                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-2xl font-black tracking-tight text-slate-950">{previewName}</p>
                                            <p className="mt-1 text-sm text-slate-500">{selectedCategory?.name || "Category optional"}</p>
                                        </div>
                                        <p className="text-sm font-bold text-amber-700">{previewPrice}</p>
                                    </div>

                                    <p className="text-sm leading-7 text-slate-600">{previewDescription}</p>
                                </div>
                            </section>

                            <section className={panelClassName}>
                                <div className="mb-4 flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className={captionClassName}>Ready To Publish</p>
                                        <h4 className="mt-1 text-xl font-black tracking-tight text-slate-950">Checklist</h4>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {checklistItems.map((item) => (
                                        <div key={item.label} className="flex items-start gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                                            <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}>
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{item.label}</p>
                                                <p className="mt-1 text-sm leading-6 text-slate-500">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>

            <DialogFooter className="border-t border-stone-200 bg-[#fffdf9] px-4 py-4 sm:px-6">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Ready to save this product?</p>
                        <p className="text-sm text-slate-500">
                            The product details, image, and placement settings will be saved together.
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-12 rounded-[18px] bg-[linear-gradient(135deg,#1e120d_0%,#432317_100%)] px-6 text-white shadow-[0_18px_40px_-25px_rgba(15,23,42,0.7)] hover:opacity-95"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Saving..." : isTodaySpecial ? "Save Special" : "Save Product"}
                    </Button>
                </div>
            </DialogFooter>
        </form>
    );
}
