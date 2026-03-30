"use client";

import { useState } from "react";
import {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useSetUserEnabledMutation,
    useSetUserLockedMutation,
    useDeleteUserMutation,
} from "@/store/api/managementApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, ShieldCheck, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { AdminUser } from "@/types";

const roleOptions = ["ADMIN", "BARISTA"];
const managedRoles = ["ADMIN", "BARISTA"];

interface CreateUserForm {
    username: string;
    email: string;
    password: string;
    givenName: string;
    familyName: string;
    phoneNumber: string;
    role: string;
}

interface UpdateUserForm {
    username: string;
    givenName: string;
    familyName: string;
    phoneNumber: string;
    role: string;
    password: string;
}

const createInitial: CreateUserForm = {
    username: "",
    email: "",
    password: "",
    givenName: "",
    familyName: "",
    phoneNumber: "",
    role: "BARISTA",
};

const updateInitial: UpdateUserForm = {
    username: "",
    givenName: "",
    familyName: "",
    phoneNumber: "",
    role: "BARISTA",
    password: "",
};

function CreateForm({
    form,
    setForm,
    onSubmit,
    loading,
    onCancel,
    error,
}: {
    form: CreateUserForm;
    setForm: React.Dispatch<React.SetStateAction<CreateUserForm>>;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    onCancel: () => void;
    error?: string | null;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Given Name</Label>
                    <Input value={form.givenName} onChange={(e) => setForm((f) => ({ ...f, givenName: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Family Name</Label>
                    <Input value={form.familyName} onChange={(e) => setForm((f) => ({ ...f, familyName: e.target.value }))} required />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create User"}</Button>
            </DialogFooter>
        </form>
    );
}

function UpdateForm({
    form,
    setForm,
    onSubmit,
    loading,
    onCancel,
    error,
}: {
    form: UpdateUserForm;
    setForm: React.Dispatch<React.SetStateAction<UpdateUserForm>>;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    onCancel: () => void;
    error?: string | null;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Given Name</Label>
                    <Input value={form.givenName} onChange={(e) => setForm((f) => ({ ...f, givenName: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Family Name</Label>
                    <Input value={form.familyName} onChange={(e) => setForm((f) => ({ ...f, familyName: e.target.value }))} required />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>New Password (optional)</Label>
                    <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Leave empty to keep current"
                    />
                </div>
            </div>
            {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function UsersPage() {
    const [page, setPage] = useState(0);
    const { data, isLoading } = useGetUsersQuery({ page, size: 20, roles: managedRoles });

    const [createUser, { isLoading: creating }] = useCreateUserMutation();
    const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
    const [setUserEnabled] = useSetUserEnabledMutation();
    const [setUserLocked] = useSetUserLockedMutation();
    const [deleteUser] = useDeleteUserMutation();

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateUserForm>(createInitial);
    const [createError, setCreateError] = useState<string | null>(null);

    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [updateForm, setUpdateForm] = useState<UpdateUserForm>(updateInitial);
    const [updateError, setUpdateError] = useState<string | null>(null);

    function openEdit(user: AdminUser) {
        setEditUser(user);
        setUpdateForm({
            username: user.username,
            givenName: user.givenName,
            familyName: user.familyName,
            phoneNumber: user.phoneNumber ?? "",
            role: user.roles[0] ?? "BARISTA",
            password: "",
        });
    }

    async function handleCreate(e: React.FormEvent) {
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
                role: createForm.role,
            }).unwrap();
            setCreateOpen(false);
            setCreateForm(createInitial);
            setCreateError(null);
        } catch (error) {
            const msg = (error as { data?: { message?: string } })?.data?.message;
            setCreateError(msg ?? "Failed to create user. Please try again.");
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editUser) return;
        setUpdateError(null);

        try {
            await updateUser({
                uuid: editUser.id,
                body: {
                    username: updateForm.username,
                    givenName: updateForm.givenName,
                    familyName: updateForm.familyName,
                    phoneNumber: updateForm.phoneNumber || undefined,
                    role: updateForm.role,
                    password: updateForm.password || undefined,
                },
            }).unwrap();
            setEditUser(null);
            setUpdateForm(updateInitial);
            setUpdateError(null);
        } catch (error) {
            const msg = (error as { data?: { message?: string } })?.data?.message;
            setUpdateError(msg ?? "Failed to update user. Please try again.");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-amber-600" />
                        User Management
                    </h1>
                    <p className="text-muted-foreground text-sm">Create and manage staff/admin accounts.</p>
                </div>

                <Dialog
                    open={createOpen}
                    onOpenChange={(open) => {
                        setCreateOpen(open);
                        if (!open) { setCreateForm(createInitial); setCreateError(null); }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>Provision a staff or admin account.</DialogDescription>
                        </DialogHeader>
                        <CreateForm form={createForm} setForm={setCreateForm} onSubmit={handleCreate} loading={creating} onCancel={() => { setCreateOpen(false); setCreateError(null); }} error={createError} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Staff and Admin Accounts
                    </CardTitle>
                    <CardDescription>{data ? `${data.totalElements} staff/admin users` : "Loading..."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                : data?.content.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <p className="font-medium">{user.givenName} {user.familyName}</p>
                                            <p className="text-xs text-muted-foreground">{user.username} • {user.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.roles[0] ?? "-"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge className={user.enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}>
                                                    {user.enabled ? "Enabled" : "Disabled"}
                                                </Badge>
                                                <Badge className={user.accountNonLocked ? "bg-sky-100 text-sky-800" : "bg-red-100 text-red-800"}>
                                                    {user.accountNonLocked ? "Unlocked" : "Locked"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end flex-wrap gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setUserEnabled({ uuid: user.id, enabled: !user.enabled })}
                                                >
                                                    {user.enabled ? "Disable" : "Enable"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setUserLocked({ uuid: user.id, locked: user.accountNonLocked })}
                                                >
                                                    {user.accountNonLocked ? "Lock" : "Unlock"}
                                                </Button>

                                                <Dialog
                                                    open={editUser?.id === user.id}
                                                    onOpenChange={(open) => {
                                                        if (!open) {
                                                            setEditUser(null);
                                                            setUpdateForm(updateInitial);
                                                            setUpdateError(null);
                                                        }
                                                    }}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit User</DialogTitle>
                                                            <DialogDescription>Update account settings for {user.username}.</DialogDescription>
                                                        </DialogHeader>
                                                        <UpdateForm
                                                            form={updateForm}
                                                            setForm={setUpdateForm}
                                                            onSubmit={handleUpdate}
                                                            loading={updating}
                                                            error={updateError}
                                                            onCancel={() => {
                                                                setEditUser(null);
                                                                setUpdateForm(updateInitial);
                                                                setUpdateError(null);
                                                            }}
                                                        />
                                                    </DialogContent>
                                                </Dialog>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete {user.username}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This permanently removes the user account and cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteUser(user.id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!isLoading && data && data.content.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No users found.</TableCell>
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
