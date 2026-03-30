"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Settings, Clock, Store, Receipt, Percent, Save, Coffee, ChefHat,
    Loader2, CheckCircle, AlertCircle, MapPin, Phone,
    Globe, Mail, CreditCard, Wifi,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────── */
interface BusinessHour {
    day: string;
    open: string;
    close: string;
    closed: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SETTINGS_STORAGE_KEY = "coffee-admin-settings-v1";

interface SettingsSnapshot {
    shopName: string;
    shopTagline: string;
    shopAddress: string;
    shopPhone: string;
    shopEmail: string;
    shopWebsite: string;
    currency: string;
    timezone: string;
    wifiName: string;
    wifiPassword: string;
    pickupInstructions: string;
    hours: BusinessHour[];
    dineInEnabled: boolean;
    takeawayEnabled: boolean;
    pickupShelfEnabled: boolean;
    defaultPrepMinutes: string;
    rushThreshold: string;
    pickupHoldMinutes: string;
    taxEnabled: boolean;
    taxRate: string;
    taxIncluded: boolean;
    taxLabel: string;
    cashEnabled: boolean;
    cardEnabled: boolean;
    khqrEnabled: boolean;
    tipsEnabled: boolean;
    orderReadyMessage: string;
    receiptHeader: string;
    receiptFooter: string;
    showLogo: boolean;
    showBarcode: boolean;
    loyaltyEnabled: boolean;
    telegramEnabled: boolean;
    telegramToken: string;
    telegramChatId: string;
    bakongEnabled: boolean;
    lastSavedAt: string | null;
}

/* ── Sub-Components ────────────────────────────────────────────── */
function Toast({ ok, msg }: { ok: boolean; msg: string }) {
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl animate-fade-in ${ok ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/12" : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/12"}`}>
            {ok ? <CheckCircle size={18} className="shrink-0 text-emerald-600 dark:text-emerald-300" /> : <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-300" />}
            <p className={`text-sm font-semibold ${ok ? "text-emerald-700 dark:text-emerald-100" : "text-red-700 dark:text-red-100"}`}>{msg}</p>
        </div>
    );
}

type Tab = "general" | "hours" | "tax" | "receipt" | "integrations";

/* ── Page ──────────────────────────────────────────────────────── */
export default function SettingsPage() {
    const [tab, setTab] = useState<Tab>("general");
    const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
    const [saving, setSaving] = useState(false);

    /* General */
    const [shopName, setShopName] = useState("Coffee Shop");
    const [shopTagline, setShopTagline] = useState("Slow mornings, fast service, drinks worth coming back for.");
    const [shopAddress, setShopAddress] = useState("123 Coffee Street, Phnom Penh");
    const [shopPhone, setShopPhone] = useState("+855 12 345 678");
    const [shopEmail, setShopEmail] = useState("hello@coffeeshop.local");
    const [shopWebsite, setShopWebsite] = useState("https://coffeeshop.local");
    const [currency, setCurrency] = useState("USD");
    const [timezone, setTimezone] = useState("Asia/Phnom_Penh");
    const [wifiName, setWifiName] = useState("Coffee Shop Guest");
    const [wifiPassword, setWifiPassword] = useState("sipandsurf");
    const [pickupInstructions, setPickupInstructions] = useState("Pick up at the espresso bar within 15 minutes of the ready alert.");

    /* Hours */
    const [hours, setHours] = useState<BusinessHour[]>(
        DAYS.map((day) => ({
            day,
            open: day === "Sunday" ? "08:00" : "07:00",
            close: day === "Sunday" ? "18:00" : "21:00",
            closed: false,
        }))
    );
    const [dineInEnabled, setDineInEnabled] = useState(true);
    const [takeawayEnabled, setTakeawayEnabled] = useState(true);
    const [pickupShelfEnabled, setPickupShelfEnabled] = useState(true);
    const [defaultPrepMinutes, setDefaultPrepMinutes] = useState("8");
    const [rushThreshold, setRushThreshold] = useState("12");
    const [pickupHoldMinutes, setPickupHoldMinutes] = useState("15");

    /* Tax */
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxRate, setTaxRate] = useState("10");
    const [taxIncluded, setTaxIncluded] = useState(false);
    const [taxLabel, setTaxLabel] = useState("VAT");
    const [cashEnabled, setCashEnabled] = useState(true);
    const [cardEnabled, setCardEnabled] = useState(true);
    const [khqrEnabled, setKhqrEnabled] = useState(true);
    const [tipsEnabled, setTipsEnabled] = useState(false);

    /* Receipt */
    const [orderReadyMessage, setOrderReadyMessage] = useState("Your drink is ready. Please head to pickup when you see your name on the board.");
    const [receiptHeader, setReceiptHeader] = useState("Thanks for spending time with Coffee Shop.");
    const [receiptFooter, setReceiptFooter] = useState("See you again for your next handcrafted favorite.");
    const [showLogo, setShowLogo] = useState(true);
    const [showBarcode, setShowBarcode] = useState(true);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

    /* Integrations */
    const [telegramEnabled, setTelegramEnabled] = useState(true);
    const [telegramToken, setTelegramToken] = useState("••••••••••");
    const [telegramChatId, setTelegramChatId] = useState("-100XXXXXXXXXX");
    const [bakongEnabled, setBakongEnabled] = useState(true);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return;

        try {
            const saved = JSON.parse(raw) as Partial<SettingsSnapshot>;
            if (saved.shopName) setShopName(saved.shopName);
            if (saved.shopTagline) setShopTagline(saved.shopTagline);
            if (saved.shopAddress) setShopAddress(saved.shopAddress);
            if (saved.shopPhone) setShopPhone(saved.shopPhone);
            if (saved.shopEmail) setShopEmail(saved.shopEmail);
            if (saved.shopWebsite) setShopWebsite(saved.shopWebsite);
            if (saved.currency) setCurrency(saved.currency);
            if (saved.timezone) setTimezone(saved.timezone);
            if (saved.wifiName) setWifiName(saved.wifiName);
            if (saved.wifiPassword) setWifiPassword(saved.wifiPassword);
            if (saved.pickupInstructions) setPickupInstructions(saved.pickupInstructions);
            if (saved.hours?.length === DAYS.length) setHours(saved.hours);
            if (typeof saved.dineInEnabled === "boolean") setDineInEnabled(saved.dineInEnabled);
            if (typeof saved.takeawayEnabled === "boolean") setTakeawayEnabled(saved.takeawayEnabled);
            if (typeof saved.pickupShelfEnabled === "boolean") setPickupShelfEnabled(saved.pickupShelfEnabled);
            if (saved.defaultPrepMinutes) setDefaultPrepMinutes(saved.defaultPrepMinutes);
            if (saved.rushThreshold) setRushThreshold(saved.rushThreshold);
            if (saved.pickupHoldMinutes) setPickupHoldMinutes(saved.pickupHoldMinutes);
            if (typeof saved.taxEnabled === "boolean") setTaxEnabled(saved.taxEnabled);
            if (saved.taxRate) setTaxRate(saved.taxRate);
            if (typeof saved.taxIncluded === "boolean") setTaxIncluded(saved.taxIncluded);
            if (saved.taxLabel) setTaxLabel(saved.taxLabel);
            if (typeof saved.cashEnabled === "boolean") setCashEnabled(saved.cashEnabled);
            if (typeof saved.cardEnabled === "boolean") setCardEnabled(saved.cardEnabled);
            if (typeof saved.khqrEnabled === "boolean") setKhqrEnabled(saved.khqrEnabled);
            if (typeof saved.tipsEnabled === "boolean") setTipsEnabled(saved.tipsEnabled);
            if (saved.orderReadyMessage) setOrderReadyMessage(saved.orderReadyMessage);
            if (saved.receiptHeader) setReceiptHeader(saved.receiptHeader);
            if (saved.receiptFooter) setReceiptFooter(saved.receiptFooter);
            if (typeof saved.showLogo === "boolean") setShowLogo(saved.showLogo);
            if (typeof saved.showBarcode === "boolean") setShowBarcode(saved.showBarcode);
            if (typeof saved.loyaltyEnabled === "boolean") setLoyaltyEnabled(saved.loyaltyEnabled);
            if (typeof saved.telegramEnabled === "boolean") setTelegramEnabled(saved.telegramEnabled);
            if (saved.telegramToken) setTelegramToken(saved.telegramToken);
            if (saved.telegramChatId) setTelegramChatId(saved.telegramChatId);
            if (typeof saved.bakongEnabled === "boolean") setBakongEnabled(saved.bakongEnabled);
            if (typeof saved.lastSavedAt === "string" || saved.lastSavedAt === null) setLastSavedAt(saved.lastSavedAt ?? null);
        } catch {
            window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
        }
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    function updateHour(idx: number, field: keyof BusinessHour, value: string | boolean) {
        setHours((h) => h.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    }

    async function handleSave() {
        setSaving(true);
        const snapshot: SettingsSnapshot = {
            shopName,
            shopTagline,
            shopAddress,
            shopPhone,
            shopEmail,
            shopWebsite,
            currency,
            timezone,
            wifiName,
            wifiPassword,
            pickupInstructions,
            hours,
            dineInEnabled,
            takeawayEnabled,
            pickupShelfEnabled,
            defaultPrepMinutes,
            rushThreshold,
            pickupHoldMinutes,
            taxEnabled,
            taxRate,
            taxIncluded,
            taxLabel,
            cashEnabled,
            cardEnabled,
            khqrEnabled,
            tipsEnabled,
            orderReadyMessage,
            receiptHeader,
            receiptFooter,
            showLogo,
            showBarcode,
            loyaltyEnabled,
            telegramEnabled,
            telegramToken,
            telegramChatId,
            bakongEnabled,
            lastSavedAt: new Date().toISOString(),
        };

        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot));
        await new Promise((r) => setTimeout(r, 250));
        setSaving(false);
        setLastSavedAt(snapshot.lastSavedAt);
        setToast({ ok: true, msg: "Coffee Shop settings saved in this browser." });
        setTimeout(() => setToast(null), 3500);
    }

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "general", label: "Shop", icon: Store },
        { id: "hours", label: "Operations", icon: Clock },
        { id: "tax", label: "Checkout", icon: Percent },
        { id: "receipt", label: "Guests", icon: Receipt },
        { id: "integrations", label: "Integrations", icon: Wifi },
    ];

    const serviceModes = useMemo(
        () => [
            dineInEnabled ? "Dine-in" : null,
            takeawayEnabled ? "Takeaway" : null,
            pickupShelfEnabled ? "Pickup shelf" : null,
        ].filter(Boolean) as string[],
        [dineInEnabled, takeawayEnabled, pickupShelfEnabled]
    );

    const paymentModes = useMemo(
        () => [
            cashEnabled ? "Cash" : null,
            cardEnabled ? "Card" : null,
            khqrEnabled ? "KHQR" : null,
        ].filter(Boolean) as string[],
        [cashEnabled, cardEnabled, khqrEnabled]
    );

    const liveStatus = useMemo(() => {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date());
        const day = parts.find((part) => part.type === "weekday")?.value ?? DAYS[0];
        const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
        const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
        const nowMinutes = hour * 60 + minute;
        const todayIndex = DAYS.indexOf(day);
        const todayHours = hours.find((item) => item.day === day);

        const nextOpen = () => {
            for (let offset = 1; offset <= DAYS.length; offset += 1) {
                const next = hours[(todayIndex + offset) % DAYS.length];
                if (!next.closed) return next;
            }
            return null;
        };

        const formatTime = (value: string) =>
            new Date(`2000-01-01T${value}:00`).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            });

        if (!todayHours || todayHours.closed) {
            const next = nextOpen();
            return {
                open: false,
                title: "Closed now",
                note: next ? `Next: ${next.day} ${formatTime(next.open)}` : "No opening hours set",
            };
        }

        const openMinutes = Number(todayHours.open.slice(0, 2)) * 60 + Number(todayHours.open.slice(3));
        const closeMinutes = Number(todayHours.close.slice(0, 2)) * 60 + Number(todayHours.close.slice(3));

        if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
            return { open: true, title: "Open now", note: `Serving until ${formatTime(todayHours.close)}` };
        }
        if (nowMinutes < openMinutes) {
            return { open: false, title: "Closed now", note: `Opens today at ${formatTime(todayHours.open)}` };
        }

        const next = nextOpen();
        return {
            open: false,
            title: "Closed now",
            note: next ? `Next: ${next.day} ${formatTime(next.open)}` : "No opening hours set",
        };
    }, [hours, timezone]);

    const prepTarget = Number(defaultPrepMinutes) || 0;
    const rushLimit = Number(rushThreshold) || 0;
    const pickupWindow = Number(pickupHoldMinutes) || 0;
    const previewSubtotal = 11.5;
    const previewTax = taxEnabled ? previewSubtotal * ((Number(taxRate) || 0) / 100) : 0;
    const previewTotal = previewSubtotal + (taxEnabled && !taxIncluded ? previewTax : 0);
    const lastSavedLabel = lastSavedAt
        ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastSavedAt))
        : "Not saved yet";

    return (
        <div className="settings-page-shell max-w-5xl space-y-6 animate-fade-in">
            {toast && <Toast ok={toast.ok} msg={toast.msg} />}

            {/* Header */}
            <div className="settings-hero mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 glass">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-amber-500 shadow-lg">
                        <Settings size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">Coffee Shop Settings</h1>
                        <p className="text-sm font-medium text-stone-500 dark:text-stone-300">Service flow, pickup clarity, guest messaging, and checkout settings for the cafe.</p>
                        <p className="mt-1 text-xs text-stone-400 dark:text-stone-400">Last saved: {lastSavedLabel}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-lg px-6">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save All Changes"}
                </Button>
            </div>

            {/* Tab Bar */}
            <div className="settings-tab-bar mb-6 flex gap-1 overflow-x-auto rounded-2xl p-1.5 glass scrollbar-hide">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`settings-tab-button flex items-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold transition-all whitespace-nowrap ${tab === id
                            ? "settings-tab-active bg-white shadow-md text-stone-900"
                            : "settings-tab-inactive text-stone-400 hover:text-stone-600"
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── GENERAL ──────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className={`rounded-2xl shadow-sm ${liveStatus.open ? "border-emerald-200 bg-emerald-50/90" : "border-orange-200 bg-orange-50/90"}`}>
                    <CardContent className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Store status</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{liveStatus.title}</p>
                        <p className="mt-1 text-sm text-stone-600">{liveStatus.note}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-amber-200 bg-amber-50/90 shadow-sm">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Service modes</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{serviceModes.length ? serviceModes.join(" • ") : "None active"}</p>
                        <p className="mt-1 text-sm text-stone-600">Keep only the channels this shift can support well.</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-stone-200 bg-white/85 shadow-sm">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Bar promise</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{prepTarget} min prep target</p>
                        <p className="mt-1 text-sm text-stone-600">Rush warning starts above {rushLimit} tickets, with drinks held {pickupWindow} minutes.</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-stone-200 bg-white/85 shadow-sm">
                    <CardContent className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Checkout</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{paymentModes.length ? paymentModes.join(" • ") : "No payment method"}</p>
                        <p className="mt-1 text-sm text-stone-600">{taxEnabled ? `${taxLabel} ${taxRate}% ${taxIncluded ? "included" : "added at checkout"}` : "Tax disabled"}</p>
                    </CardContent>
                </Card>
            </div>

            {tab === "general" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Store size={16} className="text-amber-600" /> Shop Identity
                            </CardTitle>
                            <CardDescription>Set the cafe&apos;s brand, contact details, and pickup guidance.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Shop Name</Label>
                                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Tagline</Label>
                                <Textarea value={shopTagline} onChange={(e) => setShopTagline(e.target.value)} className="min-h-24 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                                    <MapPin size={12} className="inline mr-1" />Address
                                </Label>
                                <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                                        <Phone size={12} className="inline mr-1" />Phone
                                    </Label>
                                    <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                                        <Mail size={12} className="inline mr-1" />Email
                                    </Label>
                                    <Input value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                                    <Globe size={12} className="inline mr-1" />Website
                                </Label>
                                <Input value={shopWebsite} onChange={(e) => setShopWebsite(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Pickup Instructions</Label>
                                <Textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} className="min-h-24 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard size={16} className="text-amber-600" /> Regional And Guest Basics
                            </CardTitle>
                            <CardDescription>Keep in-store details coherent for guests and staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Currency</Label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                >
                                    <option value="USD">USD — US Dollar ($)</option>
                                    <option value="KHR">KHR — Cambodian Riel (៛)</option>
                                    <option value="THB">THB — Thai Baht (฿)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Timezone</Label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                >
                                    <option value="Asia/Phnom_Penh">Asia/Phnom_Penh (UTC+7)</option>
                                    <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Guest Wi-Fi</Label>
                                    <Input value={wifiName} onChange={(e) => setWifiName(e.target.value)} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Wi-Fi Password</Label>
                                    <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} className="rounded-xl" />
                                </div>
                            </div>
                            <Separator />
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">What Guests Feel</p>
                                <p className="text-sm text-stone-700">{shopTagline}</p>
                                <p className="mt-2 text-sm text-stone-600">Wi-Fi: {wifiName} / {wifiPassword}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── HOURS ────────────────────────────────────────────── */}
            {tab === "hours" && (
                <div className="space-y-6">
                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ChefHat size={16} className="text-amber-600" /> Service Modes And Pace
                            </CardTitle>
                            <CardDescription>Decide how the shift runs before the queue gets busy.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Dine-in service</p>
                                    <p className="text-xs text-stone-500">Keep this on when the floor team can support seating.</p>
                                </div>
                                <input type="checkbox" checked={dineInEnabled} onChange={(e) => setDineInEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Takeaway service</p>
                                    <p className="text-xs text-stone-500">Keep commuter and walk-in orders moving quickly.</p>
                                </div>
                                <input type="checkbox" checked={takeawayEnabled} onChange={(e) => setTakeawayEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Pickup shelf workflow</p>
                                    <p className="text-xs text-stone-500">Helpful when the handoff counter gets crowded.</p>
                                </div>
                                <input type="checkbox" checked={pickupShelfEnabled} onChange={(e) => setPickupShelfEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Prep Target</Label>
                                    <Input type="number" value={defaultPrepMinutes} onChange={(e) => setDefaultPrepMinutes(e.target.value)} min="0" className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Rush Threshold</Label>
                                    <Input type="number" value={rushThreshold} onChange={(e) => setRushThreshold(e.target.value)} min="0" className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Pickup Hold</Label>
                                    <Input type="number" value={pickupHoldMinutes} onChange={(e) => setPickupHoldMinutes(e.target.value)} min="0" className="rounded-xl" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock size={16} className="text-amber-600" /> Business Hours
                                </CardTitle>
                                <CardDescription>Keep your posted hours aligned with the guest experience.</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setHours(DAYS.map((day) => ({ day, open: day === "Sunday" ? "08:00" : "07:00", close: day === "Sunday" ? "18:00" : "21:00", closed: false })))}
                            >
                                Cafe Template
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {hours.map((h, i) => (
                                    <div
                                        key={h.day}
                                        className={`flex items-center gap-4 rounded-xl border p-3 transition-all ${h.closed ? "bg-stone-50 border-stone-200 opacity-60" : "bg-white border-stone-100"}`}
                                    >
                                        <div className="w-28 shrink-0">
                                            <p className="text-sm font-bold text-stone-800">{h.day}</p>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={!h.closed}
                                                onChange={(e) => updateHour(i, "closed", !e.target.checked)}
                                                className="rounded accent-amber-600"
                                            />
                                            <span className="text-xs font-medium text-stone-500">Open</span>
                                        </label>
                                        {!h.closed && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    type="time"
                                                    value={h.open}
                                                    onChange={(e) => updateHour(i, "open", e.target.value)}
                                                    className="w-32 rounded-xl text-sm"
                                                />
                                                <span className="text-stone-400 font-medium text-sm">to</span>
                                                <Input
                                                    type="time"
                                                    value={h.close}
                                                    onChange={(e) => updateHour(i, "close", e.target.value)}
                                                    className="w-32 rounded-xl text-sm"
                                                />
                                            </div>
                                        )}
                                        {h.closed && (
                                            <Badge variant="secondary" className="text-xs">Closed</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── TAX ──────────────────────────────────────────────── */}
            {tab === "tax" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Percent size={16} className="text-amber-600" /> Checkout Rules
                            </CardTitle>
                            <CardDescription>Make totals and payment options feel clear at the counter.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taxEnabled}
                                    onChange={(e) => setTaxEnabled(e.target.checked)}
                                    className="rounded accent-amber-600 h-4 w-4"
                                />
                                <span className="text-sm font-bold text-stone-800">Enable Tax</span>
                            </label>
                            {taxEnabled && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Tax Label</Label>
                                        <Input value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} placeholder="e.g. VAT, GST" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Tax Rate (%)</Label>
                                        <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" max="100" step="0.1" className="rounded-xl" />
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={taxIncluded}
                                            onChange={(e) => setTaxIncluded(e.target.checked)}
                                            className="rounded accent-amber-600 h-4 w-4"
                                        />
                                        <span className="text-sm font-medium text-stone-700">Tax included in listed prices</span>
                                    </label>
                                </>
                            )}
                            <Separator />
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Cash accepted</p>
                                    <p className="text-xs text-stone-500">Good for quick walk-in orders.</p>
                                </div>
                                <input type="checkbox" checked={cashEnabled} onChange={(e) => setCashEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Cards accepted</p>
                                    <p className="text-xs text-stone-500">Turn on when the payment terminal is reliable.</p>
                                </div>
                                <input type="checkbox" checked={cardEnabled} onChange={(e) => setCardEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">KHQR accepted</p>
                                    <p className="text-xs text-stone-500">Fast local mobile payment flow for guests.</p>
                                </div>
                                <input type="checkbox" checked={khqrEnabled} onChange={(e) => setKhqrEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">Tips prompt enabled</p>
                                    <p className="text-xs text-stone-500">Only use it if it fits the cafe&apos;s service style.</p>
                                </div>
                                <input type="checkbox" checked={tipsEnabled} onChange={(e) => setTipsEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                            </label>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="text-base">Checkout Preview</CardTitle>
                            <CardDescription>How totals and payment choices feel to a guest at the register.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl bg-stone-50 border border-stone-200 p-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Subtotal</span>
                                    <span className="font-bold text-stone-800">{formatCurrency(previewSubtotal, currency)}</span>
                                </div>
                                {taxEnabled && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-500">{taxLabel} ({taxRate}%)</span>
                                        <span className="font-bold text-amber-700">{taxIncluded ? "Included" : formatCurrency(previewTax, currency)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-base">
                                    <span className="font-bold text-stone-900">Guest Pays</span>
                                    <span className="font-black text-stone-900">{formatCurrency(previewTotal, currency)}</span>
                                </div>
                                {taxEnabled && taxIncluded && (
                                    <p className="text-[11px] text-stone-400 italic">Tax is already built into listed prices.</p>
                                )}
                                <div className="pt-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Accepted Today</p>
                                    <div className="flex flex-wrap gap-2">
                                        {paymentModes.length > 0 ? paymentModes.map((mode) => (
                                            <Badge key={mode} variant="outline">{mode}</Badge>
                                        )) : (
                                            <Badge variant="destructive">No payment method</Badge>
                                        )}
                                    </div>
                                </div>
                                {tipsEnabled && <p className="text-xs text-amber-700">Tip prompt appears after payment selection.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── RECEIPT ──────────────────────────────────────────── */}
            {tab === "receipt" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Coffee size={16} className="text-amber-600" /> Guest Experience
                            </CardTitle>
                            <CardDescription>Write like a real cafe team: warm, short, and easy to act on.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Ready Message</Label>
                                <Textarea value={orderReadyMessage} onChange={(e) => setOrderReadyMessage(e.target.value)} className="min-h-24 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Header Message</Label>
                                <Input value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Footer Message</Label>
                                <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className="rounded-xl" />
                            </div>
                            <Separator />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                                <span className="text-sm font-medium text-stone-700">Show logo on receipt</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                                <span className="text-sm font-medium text-stone-700">Show order barcode</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={loyaltyEnabled} onChange={(e) => setLoyaltyEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                                <span className="text-sm font-medium text-stone-700">Show loyalty reminder</span>
                            </label>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <CardTitle className="text-base">Guest Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-700 mb-4">
                                <p className="font-semibold text-stone-900">Ready alert</p>
                                <p className="mt-1">{orderReadyMessage}</p>
                                <p className="mt-2 text-xs text-stone-500">{pickupInstructions}</p>
                            </div>
                            <div className="mx-auto max-w-xs rounded-xl border-2 border-dashed border-stone-200 bg-white p-6 text-center font-mono text-sm">
                                {showLogo && (
                                    <div className="mb-3 flex justify-center">
                                        <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center"><Coffee size={18} /></div>
                                    </div>
                                )}
                                <p className="font-bold text-stone-900 text-base">{shopName}</p>
                                <p className="text-[11px] text-stone-400 mt-0.5">{receiptHeader}</p>
                                <div className="my-3 border-t border-dashed border-stone-300" />
                                <div className="text-left space-y-1">
                                    <div className="flex justify-between"><span>1x Latte</span><span>{formatCurrency(3.5, currency)}</span></div>
                                    <div className="flex justify-between"><span>1x Croissant</span><span>{formatCurrency(2.5, currency)}</span></div>
                                </div>
                                <div className="my-3 border-t border-dashed border-stone-300" />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span><span>{formatCurrency(6, currency)}</span>
                                </div>
                                {showBarcode && (
                                    <div className="mt-4 mx-auto h-8 w-32 bg-stone-100 rounded flex items-center justify-center text-[10px] text-stone-400">
                                        |||||||||||||||
                                    </div>
                                )}
                                <p className="text-[10px] text-stone-400 mt-3">{receiptFooter}</p>
                                {loyaltyEnabled && <p className="text-[10px] text-amber-700 mt-2">Collect points on your next order.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── INTEGRATIONS ─────────────────────────────────────── */}
            {tab === "integrations" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                                    Telegram Notifications
                                </CardTitle>
                                <Badge variant={telegramEnabled ? "default" : "secondary"} className={`text-xs ${telegramEnabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}`}>
                                    {telegramEnabled ? "Active" : "Disabled"}
                                </Badge>
                            </div>
                            <CardDescription>Send staff alerts without turning the shift into noise.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                                <span className="text-sm font-bold text-stone-700">Enable Telegram alerts</span>
                            </label>
                            {telegramEnabled && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Bot Token</Label>
                                        <Input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} className="rounded-xl font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-stone-400">Chat ID</Label>
                                        <Input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} className="rounded-xl font-mono" />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-lg glass border-amber-100">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard size={16} className="text-amber-600" /> Bakong Payment
                                </CardTitle>
                                <Badge variant={bakongEnabled ? "default" : "secondary"} className={`text-xs ${bakongEnabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}`}>
                                    {bakongEnabled ? "Active" : "Disabled"}
                                </Badge>
                            </div>
                            <CardDescription>Use QR payment only when the guest handoff still feels simple.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={bakongEnabled} onChange={(e) => setBakongEnabled(e.target.checked)} className="rounded accent-amber-600 h-4 w-4" />
                                <span className="text-sm font-bold text-stone-700">Enable Bakong KHQR</span>
                            </label>
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Shift Sanity Check</p>
                                <p className="text-sm text-stone-600">Best practice: even if an integration fails, guests should still know how to pay, where to wait, and when to collect their order.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
