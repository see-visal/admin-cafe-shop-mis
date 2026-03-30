"use client";

import {
    type Dispatch,
    type FormEvent,
    type SetStateAction,
    useMemo,
    useState,
} from "react";
import {
    useGetAdminCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} from "@/store/api/dashboardApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Coffee,
    CupSoda,
    Leaf,
    Loader2,
    Pencil,
    Plus,
    Search,
    Snowflake,
    Sparkles,
    Store,
    Tag,
    Trash2,
    UtensilsCrossed,
    Wheat,
} from "lucide-react";
import type { Category } from "@/types";

interface CategoryFormValues {
    name: string;
    icon: string;
}

type FilterMode = "all" | "drink" | "food" | "special";

type CategoryIconOption = {
    value: string;
    label: string;
    hint: string;
    Icon: typeof Coffee;
    tileClassName: string;
};

const categoryIconOptions: CategoryIconOption[] = [
    {
        value: "coffee",
        label: "Coffee",
        hint: "Great for espresso, hot drinks, and classic coffee lanes.",
        Icon: Coffee,
        tileClassName: "bg-stone-950 text-white",
    },
    {
        value: "cold",
        label: "Cold Drinks",
        hint: "Best for iced drinks, refreshers, and sparkling items.",
        Icon: CupSoda,
        tileClassName: "bg-sky-100 text-sky-700",
    },
    {
        value: "tea",
        label: "Tea & Matcha",
        hint: "Use for tea, matcha, and lighter botanical drinks.",
        Icon: Leaf,
        tileClassName: "bg-emerald-100 text-emerald-700",
    },
    {
        value: "bakery",
        label: "Bakery",
        hint: "A clean fit for pastries, breads, and sweet cabinet items.",
        Icon: Wheat,
        tileClassName: "bg-amber-100 text-amber-700",
    },
    {
        value: "food",
        label: "Food",
        hint: "Works well for toast, sandwiches, brunch, and kitchen items.",
        Icon: UtensilsCrossed,
        tileClassName: "bg-orange-100 text-orange-700",
    },
    {
        value: "special",
        label: "Special",
        hint: "Use for limited drops, featured campaigns, and highlights.",
        Icon: Sparkles,
        tileClassName: "bg-fuchsia-100 text-fuchsia-700",
    },
    {
        value: "seasonal",
        label: "Seasonal",
        hint: "Helpful for festive, winter, or short-run featured menus.",
        Icon: Snowflake,
        tileClassName: "bg-indigo-100 text-indigo-700",
    },
    {
        value: "house",
        label: "House Menu",
        hint: "A safe icon for broad menu groups or storefront sections.",
        Icon: Store,
        tileClassName: "bg-rose-100 text-rose-700",
    },
];

const categoryIconMap = new Map(categoryIconOptions.map((option) => [option.value, option]));

const categorySuggestions = [
    { name: "Espresso Bar", icon: "coffee" },
    { name: "Signature Drinks", icon: "special" },
    { name: "Cold Brew", icon: "cold" },
    { name: "Tea & Matcha", icon: "tea" },
    { name: "Bakery", icon: "bakery" },
    { name: "Seasonal Specials", icon: "seasonal" },
];

const emptyForm: CategoryFormValues = {
    name: "",
    icon: "house",
};

function inferCategoryKind(name: string) {
    const value = name.toLowerCase();

    if (/(cake|sandwich|toast|bakery|pastry|dessert|food|snack|brunch)/.test(value)) {
        return "food";
    }

    if (/(seasonal|special|limited|featured|promo)/.test(value)) {
        return "special";
    }

    return "drink";
}

function inferCategoryIcon(name: string) {
    const value = name.toLowerCase();

    if (/(seasonal|special|limited|featured|promo)/.test(value)) return "special";
    if (/(winter|holiday|festive)/.test(value)) return "seasonal";
    if (/(tea|matcha|herbal)/.test(value)) return "tea";
    if (/(cold|iced|soda|sparkling|brew)/.test(value)) return "cold";
    if (/(bakery|pastry|croissant|bread|cake|dessert)/.test(value)) return "bakery";
    if (/(food|sandwich|toast|brunch|kitchen)/.test(value)) return "food";
    if (/(coffee|espresso|latte|mocha|cappuccino|americano)/.test(value)) return "coffee";

    return "house";
}

function getCategoryAccent(kind: string) {
    if (kind === "food") return "bg-orange-50 text-orange-700 border-orange-100";
    if (kind === "special") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-stone-100 text-stone-700 border-stone-200";
}

function getIconOption(iconValue?: string | null, fallbackName = "") {
    return categoryIconMap.get(iconValue ?? "") ?? categoryIconMap.get(inferCategoryIcon(fallbackName)) ?? categoryIconOptions[0];
}

function CategoryForm({
    form,
    setForm,
    onSubmit,
    loading,
}: {
    form: CategoryFormValues;
    setForm: Dispatch<SetStateAction<CategoryFormValues>>;
    onSubmit: (e: FormEvent) => void;
    loading: boolean;
}) {
    const selectedIcon = getIconOption(form.icon, form.name);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="rounded-[1.75rem] border border-[#5f3417] bg-[linear-gradient(135deg,#2c1708_0%,#4b260e_100%)] p-5 text-white shadow-[0_20px_45px_rgba(41,22,10,0.22)]">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-200/80">Category Studio</p>
                        <h3 className="text-2xl font-black tracking-tight">{form.name || "Build a clear category"}</h3>
                        <p className="max-w-md text-sm leading-6 text-amber-50/75">
                            Choose a clean icon so the category looks organized and easy for admins to understand at a glance.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${selectedIcon.tileClassName}`}>
                            <selectedIcon.Icon className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-black text-white">{selectedIcon.label}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400">Quick Picks</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {categorySuggestions.map((suggestion) => (
                        <button
                            key={suggestion.name}
                            type="button"
                            onClick={() => setForm({ name: suggestion.name, icon: suggestion.icon })}
                            className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                        >
                            {suggestion.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Category Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. Hot Coffee"
                    value={form.name}
                    onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                    required
                    className="h-12 rounded-2xl"
                />
                <p className="text-xs font-medium text-stone-500">
                    Use guest-friendly names like Hot Coffee, Bakery, or Seasonal Specials.
                </p>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_12px_32px_rgba(28,25,23,0.04)]">
                <div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Category Icon</Label>
                    <p className="mt-2 text-sm font-medium text-stone-500">
                        Pick one icon that best represents this category. This replaces the image upload flow.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {categoryIconOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, icon: option.value }))}
                            className={`rounded-[1.4rem] border p-4 text-left transition ${
                                form.icon === option.value
                                    ? "border-amber-500 bg-amber-50 shadow-[0_16px_35px_rgba(217,119,6,0.16)]"
                                    : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${option.tileClassName}`}>
                                    <option.Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-black text-stone-950">{option.label}</p>
                                    <p className="mt-1 text-sm leading-6 text-stone-500">{option.hint}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={loading} className="h-11 rounded-2xl bg-amber-600 px-5 text-white hover:bg-amber-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {loading ? "Saving..." : "Save Category"}
                </Button>
            </DialogFooter>
        </form>
    );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/85 p-5 shadow-[0_10px_30px_rgba(28,25,23,0.05)] backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-stone-950">{value}</p>
            <p className="mt-2 text-sm font-medium text-stone-500">{hint}</p>
        </div>
    );
}
export default function CategoriesPage() {
    const { data: categories, isLoading } = useGetAdminCategoriesQuery();
    const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [form, setForm] = useState<CategoryFormValues>(emptyForm);
    const [query, setQuery] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");

    const categoryList = useMemo(() => categories ?? [], [categories]);
    const drinkCount = categoryList.filter((item) => inferCategoryKind(item.name) === "drink").length;
    const foodCount = categoryList.filter((item) => inferCategoryKind(item.name) === "food").length;
    const iconCoverage = categoryList.filter((item) => Boolean(item.icon)).length;

    const filteredCategories = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return [...categoryList]
            .filter((item) => {
                const kind = inferCategoryKind(item.name);
                if (filterMode !== "all" && kind !== filterMode) return false;
                if (!normalizedQuery) return true;

                return item.name.toLowerCase().includes(normalizedQuery);
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [categoryList, filterMode, query]);

    const nextAction = iconCoverage < categoryList.length
        ? "Assign icons to the remaining categories so the menu board feels consistent for admin and staff."
        : "Category structure looks healthy. Review naming and icon choices so the menu stays easy to scan.";

    function resetForm() {
        setForm(emptyForm);
    }

    function openEdit(category: Category) {
        setEditTarget(category);
        setForm({
            name: category.name,
            icon: category.icon ?? inferCategoryIcon(category.name),
        });
    }

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        await createCategory({ name: form.name, icon: form.icon }).unwrap();
        resetForm();
        setOpenCreate(false);
    }

    async function handleUpdate(e: FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        await updateCategory({
            id: editTarget.id,
            body: {
                name: form.name,
                icon: form.icon,
            },
        }).unwrap();
        setEditTarget(null);
        resetForm();
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
                                <Tag size={30} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-amber-200/70">Coffee Shop Categories</p>
                                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Organize the menu with clear names and real icons.</h1>
                            </div>
                        </div>

                        <p className="max-w-2xl text-sm font-medium leading-6 text-amber-50/75">
                            Categories should feel simple for admin to manage. This board now focuses on clean icon-based organization instead of image upload, so menu groups stay easy to understand.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/70">Next Best Action</p>
                                <p className="mt-3 text-lg font-black text-white">{nextAction}</p>
                                <p className="mt-2 text-sm text-amber-100/65">
                                    Pair each category with one icon so the board reads consistently during busy shifts.
                                </p>
                            </div>
                            <div className="rounded-[1.75rem] border border-white/10 bg-[#f8f0e7]/95 p-4 text-stone-900 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-500">Menu Snapshot</p>
                                <div className="mt-3 flex items-end gap-6">
                                    <div>
                                        <p className="text-3xl font-black tracking-tight">{categoryList.length}</p>
                                        <p className="text-xs font-semibold text-stone-500">categories live</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black tracking-tight text-amber-700">{iconCoverage}</p>
                                        <p className="text-xs font-semibold text-stone-500">with saved icons</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm font-medium text-stone-600">
                                    Clear icons make category planning easier without depending on product images.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Dialog open={openCreate} onOpenChange={(open) => { setOpenCreate(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-12 rounded-2xl bg-white px-6 text-sm font-bold text-stone-950 hover:bg-amber-50">
                                <Plus className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black">New Category</DialogTitle>
                                <DialogDescription>Add a new menu group with a clear label and icon.</DialogDescription>
                            </DialogHeader>
                            <CategoryForm form={form} setForm={setForm} onSubmit={handleCreate} loading={creating} />
                        </DialogContent>
                    </Dialog>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="All Categories" value={String(categoryList.length)} hint="Every menu group currently visible to the team." />
                <MetricCard label="Drink Focus" value={String(drinkCount)} hint="Coffee, tea, and refreshment-led sections." />
                <MetricCard label="Food Focus" value={String(foodCount)} hint="Bakery, snacks, and brunch-style groupings." />
                <MetricCard label="Icon Coverage" value={String(iconCoverage)} hint="Categories already using a saved icon." />
            </section>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
                <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.06)]">
                    <CardHeader className="border-b border-stone-100 px-6 py-6 sm:px-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight text-stone-950">Menu Structure</CardTitle>
                                <CardDescription className="mt-1 text-sm text-stone-500">
                                    Search categories, focus on drinks or food, and keep the board clear with icon-based grouping.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {([
                                    ["all", "All"],
                                    ["drink", "Drinks"],
                                    ["food", "Food"],
                                    ["special", "Specials"],
                                ] as [FilterMode, string][]).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFilterMode(value)}
                                        className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em] transition ${
                                            filterMode === value
                                                ? "bg-stone-950 text-white"
                                                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 px-4 py-5 sm:px-8">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search hot drinks, bakery, specials..."
                                className="h-12 rounded-2xl border-stone-200 bg-stone-50 pl-11 font-medium"
                            />
                        </div>

                        {isLoading ? (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[1.5rem]" />)}
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50/80 px-6 py-16 text-center">
                                <Tag className="mx-auto h-10 w-10 text-stone-300" />
                                <p className="mt-4 text-base font-black text-stone-700">
                                    {categoryList.length === 0 ? "No categories yet" : "No categories match this view"}
                                </p>
                                <p className="mt-2 text-sm font-medium text-stone-500">
                                    {categoryList.length === 0
                                        ? "Start by adding categories for drinks, bakery, or seasonal specials."
                                        : "Try another search term or switch the category filter."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredCategories.map((category) => {
                                    const kind = inferCategoryKind(category.name);
                                    const kindLabel = kind === "food" ? "Food" : kind === "special" ? "Special" : "Drink";
                                    const iconOption = getIconOption(category.icon, category.name);

                                    return (
                                        <div key={category.id} className="rounded-[1.75rem] border border-stone-100 bg-white p-5 shadow-[0_8px_24px_rgba(28,25,23,0.04)]">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconOption.tileClassName}`}>
                                                        <iconOption.Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-stone-950">{category.name}</p>
                                                        <p className="mt-1 text-xs font-semibold text-stone-500">
                                                            {category.icon ? `${iconOption.label} icon assigned` : `Using ${iconOption.label.toLowerCase()} icon by default`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getCategoryAccent(kind)}`}>
                                                    {kindLabel}
                                                </span>
                                            </div>

                                            <div className="mt-4 rounded-[1.25rem] bg-stone-50 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Icon Choice</p>
                                                <p className="mt-2 text-sm font-medium text-stone-600">{iconOption.hint}</p>
                                            </div>

                                            <div className="mt-4 flex justify-end gap-2">
                                                <Dialog open={editTarget?.id === category.id} onOpenChange={(open) => { if (!open) { setEditTarget(null); resetForm(); } }}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-stone-100" onClick={() => openEdit(category)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="rounded-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-black">Edit Category</DialogTitle>
                                                            <DialogDescription>Refine how &quot;{editTarget?.name}&quot; appears across the menu.</DialogDescription>
                                                        </DialogHeader>
                                                        <CategoryForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={updating} />
                                                    </DialogContent>
                                                </Dialog>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-stone-100 text-red-500 hover:bg-red-50 hover:text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-3xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-xl font-black">Delete &quot;{category.name}&quot;?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This removes the category label. Products assigned to it stay in the system, but you may want to reassign them for a cleaner menu.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteCategory(category.id)} className="bg-red-600 hover:bg-red-700">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-[2rem] border-0 bg-[#f7efe5] shadow-[0_16px_50px_rgba(28,25,23,0.06)]">
                        <CardHeader className="px-6 py-6">
                            <CardTitle className="text-lg font-black tracking-tight text-stone-950">Category Coaching</CardTitle>
                            <CardDescription className="text-sm text-stone-600">
                                Useful prompts for keeping the menu easy to browse and promote.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 pb-6">
                            <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4">
                                <div className="flex items-start gap-3">
                                    <Coffee className="mt-0.5 h-5 w-5 text-stone-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Lead with familiar names</p>
                                        <p className="mt-1 text-sm font-medium text-stone-500">
                                            Guests scan categories in seconds. Labels like &quot;Hot Coffee&quot; or &quot;Bakery&quot; work better than internal shorthand.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4">
                                <div className="flex items-start gap-3">
                                    <Tag className="mt-0.5 h-5 w-5 text-stone-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Keep icons consistent</p>
                                        <p className="mt-1 text-sm font-medium text-stone-500">
                                            Use one icon per category so the board feels stable instead of changing with product photos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4">
                                <div className="flex items-start gap-3">
                                    <UtensilsCrossed className="mt-0.5 h-5 w-5 text-stone-700" />
                                    <div>
                                        <p className="text-sm font-black text-stone-950">Give food its own lane</p>
                                        <p className="mt-1 text-sm font-medium text-stone-500">
                                            Bakery and light meals should be easy to find so guests can add them without leaving the drink flow.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2rem] border-0 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.06)]">
                        <CardHeader className="px-6 py-6">
                            <CardTitle className="text-lg font-black tracking-tight text-stone-950">Suggested Structure</CardTitle>
                            <CardDescription className="text-sm text-stone-500">
                                A practical setup many coffee shops use to keep menus tidy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 px-6 pb-6">
                            {categorySuggestions.map((suggestion) => {
                                const iconOption = getIconOption(suggestion.icon, suggestion.name);
                                const exists = categoryList.some((item) => item.name.toLowerCase() === suggestion.name.toLowerCase());

                                return (
                                    <div key={suggestion.name} className="flex items-center justify-between rounded-[1.25rem] border border-stone-100 bg-stone-50 px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconOption.tileClassName}`}>
                                                <iconOption.Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-stone-950">{suggestion.name}</p>
                                                <p className="text-xs font-medium text-stone-500">
                                                    {exists
                                                        ? "Already covered in your menu."
                                                        : `${iconOption.label} icon recommended for this structure.`}
                                                </p>
                                            </div>
                                        </div>
                                        {!exists && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setForm({ name: suggestion.name, icon: suggestion.icon });
                                                    setOpenCreate(true);
                                                }}
                                                className="rounded-full bg-stone-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-stone-800"
                                            >
                                                Use
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
