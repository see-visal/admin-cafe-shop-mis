"use client";

import { useEffect, useMemo, useState } from "react";
import {
    UserSearch, Search, ChevronLeft, ChevronRight, Users,
    Trophy, ShoppingBag, TrendingUp,
    Mail, Phone, Crown, Eye, Pencil, CheckCircle2, AlertCircle, Lock, Unlock, ShieldCheck, UserPlus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    useCreateUserMutation,
    useGetUsersQuery,
    useDeleteUserMutation,
    useSetUserEnabledMutation,
    useSetUserLockedMutation,
    useUpdateUserMutation,
    useUploadAdminImageMutation,
} from "@/store/api/managementApi";
import type { AdminUser } from "@/types";
import { resolveStorageUrl } from "@/lib/storage";

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({
    title, value, icon: Icon, color, loading,
}: {
    title: string; value: string | number; icon: React.ElementType; color: string; loading?: boolean;
}) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
                        {loading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 text-2xl font-black">{value}</p>}
                    </div>
                    <div className={`rounded-full p-2.5 ${color}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* ── Tier Badge ────────────────────────────────────────────── */
function TierBadge({ points }: { points: number }) {
    const tier = points >= 500 ? "Gold" : points >= 200 ? "Silver" : points >= 50 ? "Bronze" : "New";
    const colors: Record<string, string> = {
        Gold: "bg-amber-100 text-amber-700 border-amber-300",
        Silver: "bg-stone-100 text-stone-600 border-stone-300",
        Bronze: "bg-orange-100 text-orange-700 border-orange-300",
        New: "bg-blue-100 text-blue-600 border-blue-300",
    };
    return (
        <Badge variant="outline" className={`text-[10px] font-bold ${colors[tier]}`}>
            <Crown size={10} className="mr-1" />{tier}
        </Badge>
    );
}

function Toast({ ok, msg, onDone }: { ok: boolean; msg: string; onDone: () => void }) {
    useEffect(() => {
        const timeout = setTimeout(onDone, 3200);
        return () => clearTimeout(timeout);
    }, [onDone]);

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl animate-fade-in ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            {ok ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> : <AlertCircle size={18} className="shrink-0 text-red-600" />}
            <p className={`text-sm font-semibold ${ok ? "text-emerald-700" : "text-red-700"}`}>{msg}</p>
        </div>
    );
}

function normalizeImageUrl(url?: string | null) {
    return resolveStorageUrl(url) ?? null;
}

interface CreateCustomerForm {
    username: string;
    email: string;
    password: string;
    givenName: string;
    familyName: string;
    phoneNumber: string;
}

const createInitial: CreateCustomerForm = {
    username: "",
    email: "",
    password: "",
    givenName: "",
    familyName: "",
    phoneNumber: "",
};

/* ── Page ──────────────────────────────────────────────────── */
export default function CustomersPage() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const { data, isLoading } = useGetUsersQuery({ page, size: 20, roles: ["CUSTOMER"] });
    const [createUser, { isLoading: creating }] = useCreateUserMutation();
    const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
    const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
    const [setUserEnabled, { isLoading: togglingEnabled }] = useSetUserEnabledMutation();
    const [setUserLocked, { isLoading: togglingLocked }] = useSetUserLockedMutation();
    const [uploadAdminImage, { isLoading: uploadingImage }] = useUploadAdminImageMutation();

    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<AdminUser | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
    const [createForm, setCreateForm] = useState<CreateCustomerForm>(createInitial);
    const [updateForm, setUpdateForm] = useState({
        username: "",
        givenName: "",
        familyName: "",
        phoneNumber: "",
        profileImage: "",
        password: "",
    });

    const allUsers = useMemo(() => data?.content ?? [], [data]);

    const filtered = useMemo(() => {
        let list = allUsers;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (u) =>
                    u.username.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    `${u.givenName} ${u.familyName}`.toLowerCase().includes(q)
            );
        }
        return list;
    }, [allUsers, search]);

    const totalCustomers = allUsers.length;
    const activeCustomers = allUsers.filter((u) => u.enabled).length;
    const accessUpdating = togglingEnabled || togglingLocked;

    function openDetails(user: AdminUser) {
        setSelectedCustomer(user);
        setDetailOpen(true);
    }

    function openEdit(user: AdminUser) {
        setSelectedCustomer(user);
        setUpdateForm({
            username: user.username,
            givenName: user.givenName,
            familyName: user.familyName,
            phoneNumber: user.phoneNumber ?? "",
            profileImage: user.profileImage ?? "",
            password: "",
        });
        setUpdateError(null);
        setEditOpen(true);
    }

    async function handleCreateCustomer(e: React.FormEvent) {
        e.preventDefault();
        setCreateError(null);

        try {
            await createUser({
                username: createForm.username,
                email: createForm.email,
                password: createForm.password,
                givenName: createForm.givenName,
                familyName: createForm.familyName,
                phoneNumber: createForm.phoneNumber || undefined,
                role: "CUSTOMER",
            }).unwrap();
            setCreateOpen(false);
            setCreateForm(createInitial);
            setToast({ ok: true, msg: "Customer created successfully." });
        } catch (error) {
            const message = (error as { data?: { message?: string } })?.data?.message;
            setCreateError(message ?? "Failed to create customer. Please try again.");
        }
    }

    async function handleProfileUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedCustomer) return;

        setUpdateError(null);
        try {
            const updated = await updateUser({
                uuid: selectedCustomer.id,
                body: {
                    username: updateForm.username,
                    givenName: updateForm.givenName,
                    familyName: updateForm.familyName,
                    phoneNumber: updateForm.phoneNumber || undefined,
                    profileImage: updateForm.profileImage || undefined,
                    password: updateForm.password || undefined,
                },
            }).unwrap();
            setSelectedCustomer(updated);
            setEditOpen(false);
            setUpdateForm((current) => ({ ...current, password: "" }));
            setToast({ ok: true, msg: "Customer information updated." });
        } catch (error) {
            const message = (error as { data?: { message?: string } })?.data?.message;
            setUpdateError(message ?? "Failed to update customer profile. Please try again.");
        }
    }

    async function handleCustomerAvatarUpload(file: File) {
        try {
            const result = await uploadAdminImage({ directory: "users/customers", file }).unwrap();
            setUpdateForm((current) => ({ ...current, profileImage: result.imageUrl }));
            setToast({ ok: true, msg: "Customer avatar uploaded to MinIO." });
        } catch (error) {
            const message = (error as { data?: { error?: string; message?: string } })?.data?.error
                ?? (error as { data?: { error?: string; message?: string } })?.data?.message
                ?? "Failed to upload customer avatar.";
            setToast({ ok: false, msg: message });
        }
    }

    async function handleCustomerEnabled(enabled: boolean) {
        if (!selectedCustomer) return;
        try {
            const updated = await setUserEnabled({ uuid: selectedCustomer.id, enabled }).unwrap();
            setSelectedCustomer(updated);
            setToast({ ok: true, msg: `Customer ${enabled ? "enabled" : "disabled"} successfully.` });
        } catch (error) {
            const message = (error as { data?: { message?: string } })?.data?.message;
            setToast({ ok: false, msg: message ?? `Failed to ${enabled ? "enable" : "disable"} customer.` });
        }
    }

    async function handleCustomerLocked(locked: boolean) {
        if (!selectedCustomer) return;
        try {
            const updated = await setUserLocked({ uuid: selectedCustomer.id, locked }).unwrap();
            setSelectedCustomer(updated);
            setToast({ ok: true, msg: `Customer ${locked ? "locked" : "unlocked"} successfully.` });
        } catch (error) {
            const message = (error as { data?: { message?: string } })?.data?.message;
            setToast({ ok: false, msg: message ?? `Failed to ${locked ? "lock" : "unlock"} customer.` });
        }
    }

    async function handleDeleteCustomer(user: AdminUser) {
        const confirmed = window.confirm(`Delete customer "${user.username}"? This will permanently remove the account.`);
        if (!confirmed) return;

        try {
            await deleteUser(user.id).unwrap();
            setDetailOpen(false);
            setEditOpen(false);
            setSelectedCustomer(null);
            setToast({ ok: true, msg: "Customer deleted successfully." });
        } catch (error) {
            const message = (error as { data?: { message?: string } })?.data?.message;
            setToast({ ok: false, msg: message ?? "Failed to delete customer." });
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                        <UserSearch size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-stone-900">Customers</h1>
                        <p className="text-sm text-stone-400 font-medium">Manage customers and track engagement</p>
                    </div>
                </div>
                <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Add Customer
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Customers" value={totalCustomers} icon={Users} color="bg-blue-100 text-blue-700" loading={isLoading} />
                <StatCard title="Active" value={activeCustomers} icon={TrendingUp} color="bg-emerald-100 text-emerald-700" loading={isLoading} />
                <StatCard title="Loyalty Members" value={totalCustomers > 0 ? Math.round(totalCustomers * 0.75) : 0} icon={Trophy} color="bg-amber-100 text-amber-700" loading={isLoading} />
                <StatCard title="Avg Orders/Customer" value={totalCustomers > 0 ? "4.2" : "—"} icon={ShoppingBag} color="bg-purple-100 text-purple-700" loading={isLoading} />
            </div>

            <Card className="rounded-2xl border-amber-200 bg-amber-50/70 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Customer editing</p>
                        <p className="mt-1 text-sm text-stone-700">
                            Admin can update customer profile details, set a new password, control account access, and delete the customer from this page. Existing passwords are securely hashed and cannot be viewed.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700">
                        <ShieldCheck size={14} />
                        Profile and access controls
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className="rounded-2xl shadow-lg glass border-blue-100">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users size={16} className="text-amber-600" /> Customer Directory
                            </CardTitle>
                            <CardDescription>{filtered.length} customers found</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="Search by name, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 w-64 rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
                            <UserSearch size={40} className="mb-3 text-stone-300" />
                            <p className="text-sm font-bold">No customers found</p>
                            <p className="text-xs mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-stone-50/50">
                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Customer</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Contact</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Tier</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Joined</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filtered.map((user) => {
                                        const fullName = user.givenName && user.familyName
                                            ? `${user.givenName} ${user.familyName}`
                                            : user.username;
                                        const initials = user.givenName
                                            ? `${user.givenName[0]}${user.familyName?.[0] ?? ""}`.toUpperCase()
                                            : user.username.slice(0, 2).toUpperCase();
                                        const randomPoints = Math.abs(user.id.charCodeAt(0) * 7 + user.id.charCodeAt(1) * 3) % 800;
                                        const avatarSrc = normalizeImageUrl(user.profileImage);
                                        return (
                                            <tr key={user.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {avatarSrc ? (
                                                            <div
                                                                className="h-10 w-10 rounded-xl bg-cover bg-center shadow-sm ring-1 ring-stone-200"
                                                                style={{ backgroundImage: `url("${avatarSrc}")` }}
                                                                aria-label={`${fullName} profile image`}
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold shadow-sm">
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-stone-900">{fullName}</p>
                                                            <p className="text-xs text-stone-400">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-stone-600 flex items-center gap-1">
                                                            <Mail size={10} />{user.email}
                                                        </p>
                                                        {user.phoneNumber && (
                                                            <p className="text-xs text-stone-400 flex items-center gap-1">
                                                                <Phone size={10} />{user.phoneNumber}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <TierBadge points={randomPoints} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="outline" className={`text-[10px] font-bold ${user.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                                                            {user.enabled ? "Active" : "Inactive"}
                                                        </Badge>
                                                        <Badge variant="outline" className={`text-[10px] font-bold ${user.accountNonLocked ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                                                            {user.accountNonLocked ? "Unlocked" : "Locked"}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-stone-500">
                                                        {user.createdAt
                                                            ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                            : "—"}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => openDetails(user)}>
                                                            <Eye size={14} className="mr-1" /> View
                                                        </Button>
                                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => openEdit(user)}>
                                                            <Pencil size={14} className="mr-1" /> Edit
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteCustomer(user)} disabled={deleting}>
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-3">
                            <p className="text-xs text-stone-400">
                                Page {data.number + 1} of {data.totalPages} · {data.totalElements} total
                            </p>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 0}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-lg"
                                >
                                    <ChevronLeft size={14} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= data.totalPages - 1}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-lg"
                                >
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) {
                        setCreateError(null);
                        setCreateForm(createInitial);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Customer</DialogTitle>
                        <DialogDescription>Add a new customer account to the coffee shop system.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateCustomer} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Given Name</Label>
                                <Input
                                    value={createForm.givenName}
                                    onChange={(e) => setCreateForm((form) => ({ ...form, givenName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Family Name</Label>
                                <Input
                                    value={createForm.familyName}
                                    onChange={(e) => setCreateForm((form) => ({ ...form, familyName: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Username</Label>
                                <Input
                                    value={createForm.username}
                                    onChange={(e) => setCreateForm((form) => ({ ...form, username: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm((form) => ({ ...form, email: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm((form) => ({ ...form, password: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Phone Number</Label>
                                <Input
                                    value={createForm.phoneNumber}
                                    onChange={(e) => setCreateForm((form) => ({ ...form, phoneNumber: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Customer role</p>
                            <p className="mt-1 text-sm text-stone-700">
                                New accounts created from this page are always saved as <span className="font-semibold">CUSTOMER</span>.
                            </p>
                        </div>

                        {createError && (
                            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-500">
                                {createError}
                            </p>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating}>
                                {creating ? "Creating..." : "Create Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open);
                    if (!open && !editOpen) setSelectedCustomer(null);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                        <DialogDescription>View complete profile information for this customer.</DialogDescription>
                    </DialogHeader>

                    {selectedCustomer && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {normalizeImageUrl(selectedCustomer.profileImage) ? (
                                    <div
                                        className="h-14 w-14 rounded-2xl bg-cover bg-center ring-1 ring-stone-200"
                                        style={{ backgroundImage: `url("${normalizeImageUrl(selectedCustomer.profileImage)}")` }}
                                        aria-label={`${selectedCustomer.username} profile image`}
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-sm">
                                        {(selectedCustomer.givenName?.[0] ?? selectedCustomer.username[0] ?? "C").toUpperCase()}
                                        {(selectedCustomer.familyName?.[0] ?? "").toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-stone-900">
                                        {selectedCustomer.givenName} {selectedCustomer.familyName}
                                    </p>
                                    <p className="text-xs text-stone-500">@{selectedCustomer.username}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline" className={selectedCustomer.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}>
                                            {selectedCustomer.enabled ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge variant="outline" className={selectedCustomer.accountNonLocked ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-red-50 text-red-600 border-red-200"}>
                                            {selectedCustomer.accountNonLocked ? "Unlocked" : "Locked"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-stone-400">Email</p>
                                    <p className="text-sm text-stone-700">{selectedCustomer.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400">Phone</p>
                                    <p className="text-sm text-stone-700">{selectedCustomer.phoneNumber || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400">Role</p>
                                    <p className="text-sm text-stone-700">{selectedCustomer.roles.join(", ") || "CUSTOMER"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400">Status</p>
                                    <p className="text-sm text-stone-700">{selectedCustomer.enabled ? "Active" : "Inactive"}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-stone-400">Joined</p>
                                    <p className="text-sm text-stone-700">
                                        {selectedCustomer.createdAt
                                            ? new Date(selectedCustomer.createdAt).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Password security</p>
                                <p className="mt-1 text-sm text-stone-700">
                                    Customer passwords are stored securely and cannot be viewed by admin. If a customer needs help signing in, set a new password from the edit screen.
                                </p>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleDeleteCustomer(selectedCustomer)}
                                    disabled={deleting}
                                >
                                    {deleting ? "Deleting..." : "Delete Customer"}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setDetailOpen(false);
                                        openEdit(selectedCustomer);
                                    }}
                                >
                                    Edit Customer
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDetailOpen(false);
                                        if (!editOpen) setSelectedCustomer(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) {
                        setUpdateError(null);
                        if (!detailOpen) setSelectedCustomer(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Customer Profile</DialogTitle>
                        <DialogDescription>Update this customer&apos;s profile details.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        {selectedCustomer && (
                            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-stone-900">
                                            {selectedCustomer.givenName} {selectedCustomer.familyName}
                                        </p>
                                        <p className="text-xs text-stone-500">{selectedCustomer.email}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className={selectedCustomer.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}>
                                            {selectedCustomer.enabled ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge variant="outline" className={selectedCustomer.accountNonLocked ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-red-50 text-red-600 border-red-200"}>
                                            {selectedCustomer.accountNonLocked ? "Unlocked" : "Locked"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Given Name</Label>
                                <Input
                                    value={updateForm.givenName}
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, givenName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Family Name</Label>
                                <Input
                                    value={updateForm.familyName}
                                    onChange={(e) => setUpdateForm((f) => ({ ...f, familyName: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Username</Label>
                            <Input
                                value={updateForm.username}
                                onChange={(e) => setUpdateForm((f) => ({ ...f, username: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input value={selectedCustomer?.email ?? ""} disabled readOnly className="bg-stone-50 text-stone-500" />
                            <p className="text-xs text-stone-400">Email is currently read-only because the admin update API does not accept email changes.</p>
                        </div>

                        <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
                            <div>
                                <Label>Profile Image</Label>
                                <p className="mt-1 text-xs text-stone-400">Upload a customer avatar to MinIO or paste a direct image URL if needed.</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-amber-800 hover:file:bg-amber-200"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    void handleCustomerAvatarUpload(file);
                                    e.currentTarget.value = "";
                                }}
                                disabled={uploadingImage}
                            />
                            <Input
                                value={updateForm.profileImage}
                                onChange={(e) => setUpdateForm((f) => ({ ...f, profileImage: e.target.value }))}
                                placeholder="https://example.com/customer-avatar.jpg"
                            />
                            <p className="text-xs text-stone-400">Saved URL for the customer avatar shown in admin and customer-facing screens.</p>
                        </div>

                        {normalizeImageUrl(updateForm.profileImage) && (
                            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Avatar preview</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <div
                                        className="h-14 w-14 rounded-2xl bg-cover bg-center ring-1 ring-stone-200"
                                        style={{ backgroundImage: `url("${normalizeImageUrl(updateForm.profileImage)}")` }}
                                        aria-label="Customer profile image preview"
                                    />
                                    <p className="text-xs text-stone-500">Preview updates before you save the customer profile.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Phone Number</Label>
                            <Input
                                value={updateForm.phoneNumber}
                                onChange={(e) => setUpdateForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={updateForm.password}
                                onChange={(e) => setUpdateForm((f) => ({ ...f, password: e.target.value }))}
                                placeholder="Set a new password for this customer"
                            />
                            <p className="text-xs text-stone-400">Existing passwords are encrypted and cannot be viewed. Admin can only set a new password.</p>
                        </div>

                        <div className="rounded-xl border border-stone-200 bg-white px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Access controls</p>
                                    <p className="mt-1 text-xs text-stone-500">Use these controls when a customer should be temporarily disabled or their account should be locked.</p>
                                </div>
                                <ShieldCheck size={16} className="mt-0.5 text-amber-600" />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleCustomerEnabled(!(selectedCustomer?.enabled ?? true))}
                                    disabled={accessUpdating || !selectedCustomer}
                                >
                                    {selectedCustomer?.enabled ? "Disable customer" : "Enable customer"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleCustomerLocked(selectedCustomer?.accountNonLocked ?? false)}
                                    disabled={accessUpdating || !selectedCustomer}
                                >
                                    {selectedCustomer?.accountNonLocked ? <Lock size={14} className="mr-1.5" /> : <Unlock size={14} className="mr-1.5" />}
                                    {selectedCustomer?.accountNonLocked ? "Lock account" : "Unlock account"}
                                </Button>
                            </div>
                        </div>

                        {updateError && (
                            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                {updateError}
                            </p>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => selectedCustomer && handleDeleteCustomer(selectedCustomer)}
                                disabled={updating || deleting}
                            >
                                {deleting ? "Deleting..." : "Delete Customer"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEditOpen(false);
                                    setUpdateError(null);
                                    if (!detailOpen) setSelectedCustomer(null);
                                }}
                                disabled={updating}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updating || uploadingImage}>
                                {updating ? "Saving..." : uploadingImage ? "Uploading..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {toast && <Toast ok={toast.ok} msg={toast.msg} onDone={() => setToast(null)} />}
        </div>
    );
}
