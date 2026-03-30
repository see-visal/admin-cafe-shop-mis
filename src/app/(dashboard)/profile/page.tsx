"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import {
    useGetAdminProfileQuery,
    useUpdateAdminProfileMutation,
    useChangeAdminPasswordMutation,
} from "@/store/api/profileApi";
import {
    User, Mail, Phone, Shield, Star, Calendar, Hash,
    Copy, CheckCheck, Loader2, ShieldCheck, Coffee,
    UserCircle, Crown, Sparkles, BadgeCheck,
    Pencil, KeyRound, Eye, EyeOff, Save, X,
    CheckCircle, AlertCircle,
} from "lucide-react";
import { resolveStorageUrl } from "@/lib/storage";

/* ── helpers ──────────────────────────────────────────────────── */
function normUrl(url: string | null | undefined) {
    return resolveStorageUrl(url) ?? null;
}

const ROLE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ADMIN: { label: "Administrator", color: "bg-red-50 text-red-700 border-red-200", icon: Crown },
    BARISTA: { label: "Barista", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Coffee },
    CUSTOMER: { label: "Customer", color: "bg-blue-50 text-blue-700 border-blue-200", icon: User },
};

/* ── sub-components ───────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-500 hover:border-amber-300 hover:text-amber-700 transition-all active:scale-95"
        >
            {copied ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy UUID"}
        </button>
    );
}

function FormField({
    label, id, type = "text", value, onChange, placeholder, maxLength, hint,
}: {
    label: string; id: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder?: string; maxLength?: number; hint?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-800 placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            {hint && <p className="text-[10px] text-stone-400">{hint}</p>}
        </div>
    );
}

function PasswordField({ label, id, value, onChange, placeholder }: {
    label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder ?? "••••••••"}
                    className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 pr-11 text-sm font-medium text-stone-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
        </div>
    );
}

function Toast({ ok, msg, onDone }: { ok: boolean; msg: string; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl animate-fade-in ${ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            {ok ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
            <p className={`text-sm font-semibold ${ok ? "text-emerald-700" : "text-red-700"}`}>{msg}</p>
        </div>
    );
}

/* ── PAGE ─────────────────────────────────────────────────────── */
type Tab = "view" | "edit" | "password";

export default function ProfilePage() {
    const user = useAppSelector((s) => s.auth.user);
    const { data: profile, isLoading, isError } = useGetAdminProfileQuery();
    const [updateProfile, { isLoading: saving }] = useUpdateAdminProfileMutation();
    const [changePassword, { isLoading: changingPw }] = useChangeAdminPasswordMutation();

    const [tab, setTab] = useState<Tab>("view");
    const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

    /* ── edit form state ─────────────────────────────────── */
    const [givenName, setGivenName] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [dob, setDob] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [coverImage, setCoverImage] = useState("");

    /* ── password form state ─────────────────────────────── */
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwError, setPwError] = useState("");

    function openEditTab() {
        if (profile) {
            setGivenName(profile.givenName ?? "");
            setFamilyName(profile.familyName ?? "");
            setPhone(profile.phoneNumber ?? "");
            setGender(profile.gender ?? "");
            setDob(profile.dob ?? "");
            setProfileImage(profile.profileImage ?? "");
            setCoverImage(profile.coverImage ?? "");
        }
        setTab("edit");
    }

    /* ── derived ─────────────────────────────────────────── */
    const initials =
        profile?.givenName && profile?.familyName
            ? `${profile.givenName[0]}${profile.familyName[0]}`.toUpperCase()
            : profile?.username?.slice(0, 2).toUpperCase() ?? user?.username?.slice(0, 2).toUpperCase() ?? "AD";

    const fullName =
        profile?.givenName && profile?.familyName
            ? `${profile.givenName} ${profile.familyName}`
            : profile?.username ?? user?.username ?? "Admin";

    const avatarSrc = normUrl(profile?.profileImage);
    const coverSrc = normUrl(profile?.coverImage);

    /* ── handlers ────────────────────────────────────────── */
    async function handleSave() {
        try {
            await updateProfile({
                givenName: givenName || undefined,
                familyName: familyName || undefined,
                phoneNumber: phone || undefined,
                gender: gender || undefined,
                dob: dob || null,
                profileImage: profileImage || undefined,
                coverImage: coverImage || undefined,
            }).unwrap();
            setToast({ ok: true, msg: "Profile updated successfully!" });
            setTab("view");
        } catch {
            setToast({ ok: false, msg: "Failed to update profile. Please try again." });
        }
    }

    async function handleChangePassword() {
        setPwError("");
        if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
        if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
        if (newPw === currentPw) { setPwError("New password must differ from current password."); return; }
        try {
            await changePassword({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }).unwrap();
            setToast({ ok: true, msg: "Password changed successfully!" });
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
            setTab("view");
        } catch (err) {
            const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to change password.";
            setPwError(msg);
        }
    }

    /* ── tabs config ─────────────────────────────────────── */
    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "view", label: "Overview", icon: UserCircle },
        { id: "edit", label: "Edit Info", icon: Pencil },
        { id: "password", label: "Password", icon: KeyRound },
    ];

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl">

            {/* ── Toast ────────────────────────────────────────────── */}
            {toast && <Toast ok={toast.ok} msg={toast.msg} onDone={() => setToast(null)} />}

            {/* ── Page header ──────────────────────────────────────── */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2e1505] text-amber-500 shadow-xl">
                    <UserCircle size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-stone-900 leading-none">My Profile</h1>
                    <p className="text-stone-400 text-sm mt-1.5 font-medium">View and manage your administrator account</p>
                </div>
                <div className="ml-auto flex items-center gap-2 h-10 px-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <Sparkles size={14} className="text-amber-600" />
                    <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Admin Portal</span>
                </div>
            </div>

            {/* ── Loading ──────────────────────────────────────────── */}
            {isLoading && (
                <div className="flex flex-col items-center gap-4 py-24">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                        <Loader2 size={28} className="animate-spin text-amber-600" />
                    </div>
                    <p className="text-sm text-stone-400 font-medium">Loading profile…</p>
                </div>
            )}
            {isError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm font-semibold text-red-600">Could not load profile. Please try again.</p>
                </div>
            )}

            {!isLoading && !isError && profile && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* ══ Left — Identity card (always visible) ══════════════ */}
                    <div className="lg:col-span-1">
                        <div className="rounded-[2rem] overflow-hidden border border-stone-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                            {/* Cover */}
                            <div
                                className="relative h-28 w-full"
                                style={{
                                    background: coverSrc
                                        ? `url(${coverSrc}) center/cover`
                                        : "linear-gradient(135deg, #2e1505 0%, #78350f 50%, #d97706 100%)",
                                }}
                            >
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
                            </div>
                            {/* Avatar */}
                            <div className="flex flex-col items-center text-center px-6 pb-6 -mt-12">
                                <div className="relative h-20 w-20 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden">
                                    {avatarSrc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarSrc} alt={fullName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-600 to-orange-700 text-white text-2xl font-black">{initials}</div>
                                    )}
                                    <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                </div>
                                <h2 className="mt-3 text-xl font-black text-stone-900 leading-tight">{fullName}</h2>
                                <p className="text-sm text-stone-400 font-medium mt-0.5">@{profile.username}</p>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {profile.roles.map((role) => {
                                        const meta = ROLE_META[role] ?? ROLE_META.CUSTOMER;
                                        const RoleIcon = meta.icon;
                                        return (
                                            <span key={role} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${meta.color}`}>
                                                <RoleIcon size={11} />{meta.label}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 w-full rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">UUID</p>
                                    <p className="font-mono text-[10px] text-stone-500 break-all leading-relaxed">{profile.uuid}</p>
                                    <div className="mt-2 flex justify-center"><CopyButton text={profile.uuid} /></div>
                                </div>
                                {typeof profile.loyaltyPoints === "number" && (
                                    <div className="mt-3 w-full flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                                        <div className="flex items-center gap-2"><Star size={14} className="text-amber-600" /><span className="text-xs font-bold text-amber-700">Loyalty Points</span></div>
                                        <span className="text-lg font-black text-amber-700">{profile.loyaltyPoints}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ══ Right — Tabbed panel ════════════════════════════════ */}
                    <div className="lg:col-span-2">

                        {/* Tab bar */}
                        <div className="flex gap-1.5 mb-5 bg-stone-100 rounded-2xl p-1.5">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => (id === "edit" ? openEditTab() : setTab(id))}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-bold transition-all duration-200 ${tab === id
                                        ? "bg-white shadow-sm text-stone-900"
                                        : "text-stone-400 hover:text-stone-600"
                                        }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* ── VIEW tab ──────────────────────────────────────── */}
                        {tab === "view" && (
                            <div className="space-y-5">
                                {/* Personal info card */}
                                <div className="rounded-[2rem] border border-stone-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-amber-600" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Personal Information</h3>
                                        </div>
                                        <button onClick={openEditTab} className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-all">
                                            <Pencil size={11} /> Edit
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        {[
                                            { icon: User, label: "First Name", value: profile.givenName },
                                            { icon: User, label: "Last Name", value: profile.familyName },
                                            { icon: Mail, label: "Email", value: profile.email },
                                            { icon: Phone, label: "Phone", value: profile.phoneNumber },
                                            { icon: User, label: "Gender", value: profile.gender },
                                            { icon: Calendar, label: "Date of Birth", value: profile.dob ? new Date(profile.dob).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label}>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">{label}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Icon size={13} className="text-stone-300 shrink-0" />
                                                    <p className="text-sm font-semibold text-stone-800 truncate">
                                                        {value ?? <span className="text-stone-300 italic font-normal">Not set</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Account card */}
                                <div className="rounded-[2rem] border border-stone-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-amber-600" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Account & Security</h3>
                                        </div>
                                        <button onClick={() => setTab("password")} className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-100 transition-all">
                                            <KeyRound size={11} /> Change Password
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
                                            <Hash size={14} className="text-stone-400" />
                                            <div><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Username</p><p className="font-mono text-sm font-semibold text-stone-800">{profile.username}</p></div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
                                            <Shield size={14} className="text-stone-400" />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Roles</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {profile.roles.map((role) => {
                                                        const meta = ROLE_META[role] ?? ROLE_META.CUSTOMER;
                                                        const RoleIcon = meta.icon;
                                                        return <span key={role} className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-black ${meta.color}`}><RoleIcon size={10} />{role}</span>;
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
                                            <BadgeCheck size={14} className="text-stone-400" />
                                            <div><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Notification Preference</p><p className="text-sm font-semibold text-stone-800">{profile.notificationPreference ?? "In-App"}</p></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-[1.5rem] border border-stone-100 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-5 flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50"><ShieldCheck size={20} className="text-emerald-600" /></div>
                                        <div><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Status</p><p className="text-base font-black text-emerald-600 mt-0.5">Active</p></div>
                                    </div>
                                    <div className="rounded-[1.5rem] border border-stone-100 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-5 flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50"><Crown size={20} className="text-amber-600" /></div>
                                        <div><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Access Level</p><p className="text-base font-black text-amber-700 mt-0.5">{profile.roles.includes("ADMIN") ? "Full Admin" : profile.roles[0] ?? "Staff"}</p></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── EDIT tab ──────────────────────────────────────── */}
                        {tab === "edit" && (
                            <div className="rounded-[2rem] border border-stone-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-7">
                                <div className="flex items-center gap-2 mb-6">
                                    <Pencil size={15} className="text-amber-600" />
                                    <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest">Edit Profile Information</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <FormField id="givenName" label="First Name" value={givenName} onChange={setGivenName} placeholder="John" maxLength={255} />
                                    <FormField id="familyName" label="Last Name" value={familyName} onChange={setFamilyName} placeholder="Doe" maxLength={255} />
                                    <FormField id="phone" label="Phone Number" value={phone} onChange={setPhone} placeholder="+855 12 345 678" maxLength={32} />
                                    <div className="space-y-1.5">
                                        <label htmlFor="gender" className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Gender</label>
                                        <select
                                            id="gender"
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                        >
                                            <option value="">Not specified</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <FormField id="dob" label="Date of Birth" type="date" value={dob} onChange={setDob} />
                                    <div className="sm:col-span-2">
                                        <FormField id="profileImage" label="Profile Image URL" value={profileImage} onChange={setProfileImage} placeholder="https://example.com/avatar.jpg" maxLength={256} hint="URL to your profile photo" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <FormField id="coverImage" label="Cover Image URL" value={coverImage} onChange={setCoverImage} placeholder="https://example.com/cover.jpg" maxLength={256} hint="URL to your cover/banner image" />
                                    </div>
                                </div>

                                {/* Preview strip */}
                                {(profileImage || coverImage) && (
                                    <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Image Preview</p>
                                        <div className="flex gap-3 items-center">
                                            {profileImage && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={normUrl(profileImage) ?? profileImage} alt="profile preview" className="h-12 w-12 rounded-xl object-cover border-2 border-amber-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            )}
                                            {coverImage && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={normUrl(coverImage) ?? coverImage} alt="cover preview" className="h-12 w-24 rounded-xl object-cover border-2 border-amber-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-7 flex gap-3">
                                    <button
                                        onClick={() => setTab("view")}
                                        className="flex items-center gap-2 h-11 px-5 rounded-xl border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-all"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 h-11 px-7 rounded-xl bg-[#2e1505] text-white text-sm font-bold hover:bg-stone-900 disabled:opacity-60 transition-all active:scale-95 shadow-[0_4px_16px_rgba(46,21,5,0.3)]"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {saving ? "Saving…" : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── PASSWORD tab ──────────────────────────────────── */}
                        {tab === "password" && (
                            <div className="rounded-[2rem] border border-stone-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-7">
                                <div className="flex items-center gap-2 mb-6">
                                    <KeyRound size={15} className="text-amber-600" />
                                    <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest">Change Password</h3>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <PasswordField id="currentPw" label="Current Password" value={currentPw} onChange={setCurrentPw} />
                                    <PasswordField id="newPw" label="New Password" value={newPw} onChange={(v) => { setNewPw(v); setPwError(""); }} placeholder="Min. 6 characters" />
                                    <PasswordField id="confirmPw" label="Confirm New Password" value={confirmPw} onChange={(v) => { setConfirmPw(v); setPwError(""); }} />

                                    {/* Strength dots */}
                                    {newPw && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Password Strength</p>
                                            <div className="flex gap-1.5">
                                                {[6, 10, 14].map((threshold, i) => (
                                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${newPw.length >= threshold ? ["bg-red-400", "bg-amber-400", "bg-emerald-500"][i] : "bg-stone-200"}`} />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-stone-400">
                                                {newPw.length < 6 ? "Too short" : newPw.length < 10 ? "Weak" : newPw.length < 14 ? "Good" : "Strong"}
                                            </p>
                                        </div>
                                    )}

                                    {pwError && (
                                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                                            <AlertCircle size={14} className="text-red-500 shrink-0" />
                                            <p className="text-sm text-red-600 font-medium">{pwError}</p>
                                        </div>
                                    )}

                                    <div className="pt-2 flex gap-3">
                                        <button
                                            onClick={() => { setTab("view"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError(""); }}
                                            className="flex items-center gap-2 h-11 px-5 rounded-xl border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-all"
                                        >
                                            <X size={14} /> Cancel
                                        </button>
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={changingPw || !currentPw || !newPw || !confirmPw}
                                            className="flex items-center gap-2 h-11 px-7 rounded-xl bg-[#2e1505] text-white text-sm font-bold hover:bg-stone-900 disabled:opacity-60 transition-all active:scale-95 shadow-[0_4px_16px_rgba(46,21,5,0.3)]"
                                        >
                                            {changingPw ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                            {changingPw ? "Updating…" : "Update Password"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
