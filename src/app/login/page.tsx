"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/store/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [login, { isLoading, error }] = useLoginMutation();
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            router.replace("/dashboard");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ username: form.username, password: form.password }).unwrap();
            router.push("/dashboard");
        } catch { }
    };

    return (
        <div className="login-root">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb orb-1" />
                <div className="login-bg-orb orb-2" />
                <div className="login-bg-orb orb-3" />
                <div className="login-bg-grid" />
            </div>

            {/* Floating coffee beans */}
            <div className="login-beans" aria-hidden="true">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={`bean bean-${i + 1}`}>☕</div>
                ))}
            </div>

            {/* Card */}
            <div className="login-card login-card--visible">
                {/* Top accent bar */}
                <div className="login-card-accent" />

                {/* Logo area */}
                <div className="login-logo-wrap">
                    <div className="login-logo-ring">
                        <div className="login-logo-inner">
                            <img src="/salsee.png" alt="SalSee Logo" className="login-logo-img" />
                        </div>
                    </div>
                    <div className="login-badge">
                        <ShieldCheck className="login-badge-icon" />
                        Admin Portal
                    </div>
                </div>

                {/* Heading */}
                <div className="login-heading">
                    <h1 className="login-title">Welcome back</h1>
                    <p className="login-subtitle">Sign in to your Coffee Shop dashboard</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    {/* Username */}
                    <div className={`login-field ${focusedField === "username" ? "login-field--focused" : ""}`}>
                        <Label htmlFor="username" className="login-label">Username</Label>
                        <div className="login-input-wrap">
                            <User className="login-input-icon" />
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={form.username}
                                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                                onFocus={() => setFocusedField("username")}
                                onBlur={() => setFocusedField(null)}
                                autoComplete="username"
                                required
                                className="login-input"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className={`login-field ${focusedField === "password" ? "login-field--focused" : ""}`}>
                        <Label htmlFor="password" className="login-label">Password</Label>
                        <div className="login-input-wrap">
                            <Lock className="login-input-icon" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="login-input login-input--password"
                            />
                            <button
                                type="button"
                                className="login-eye-btn"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="login-eye-icon" /> : <Eye className="login-eye-icon" />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            <span className="login-error-dot" />
                            Invalid username or password. Please try again.
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading}
                        id="login-submit-btn"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="login-btn-spinner" />
                                Signing in…
                            </>
                        ) : (
                            <>
                                Sign In
                                <span className="login-btn-arrow">→</span>
                            </>
                        )}
                    </Button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <span className="login-footer-dot" />
                    <span>Secured admin access</span>
                    <span className="login-footer-dot" />
                </div>
            </div>

            <style>{`
                /* ── Root & Background ── */
                .login-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #0d0a07;
                    padding: 1rem;
                }

                .login-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                }

                .login-bg-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.35;
                }

                .orb-1 {
                    width: 520px; height: 520px;
                    background: radial-gradient(circle, #d97706 0%, #92400e 60%, transparent 100%);
                    top: -140px; left: -140px;
                    animation: orbFloat1 14s ease-in-out infinite;
                }

                .orb-2 {
                    width: 420px; height: 420px;
                    background: radial-gradient(circle, #b45309 0%, #451a03 60%, transparent 100%);
                    bottom: -100px; right: -100px;
                    animation: orbFloat2 18s ease-in-out infinite;
                }

                .orb-3 {
                    width: 260px; height: 260px;
                    background: radial-gradient(circle, #f59e0b 0%, #92400e 60%, transparent 100%);
                    top: 50%; left: 60%;
                    transform: translate(-50%, -50%);
                    animation: orbFloat3 22s ease-in-out infinite;
                    opacity: 0.18;
                }

                .login-bg-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(217, 119, 6, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(217, 119, 6, 0.04) 1px, transparent 1px);
                    background-size: 48px 48px;
                }

                @keyframes orbFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(40px, 30px) scale(1.07); }
                }
                @keyframes orbFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-30px, -40px) scale(1.05); }
                }
                @keyframes orbFloat3 {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.15); }
                }

                /* ── Floating beans ── */
                .login-beans {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 1;
                }

                .bean {
                    position: absolute;
                    font-size: 1.4rem;
                    opacity: 0.07;
                    animation: beanDrift linear infinite;
                }

                .bean-1 { left: 5%; animation-duration: 20s; animation-delay: 0s; top: 100%; }
                .bean-2 { left: 15%; animation-duration: 25s; animation-delay: -4s; top: 100%; }
                .bean-3 { left: 28%; animation-duration: 18s; animation-delay: -8s; top: 100%; }
                .bean-4 { left: 42%; animation-duration: 22s; animation-delay: -2s; top: 100%; }
                .bean-5 { left: 55%; animation-duration: 30s; animation-delay: -12s; top: 100%; }
                .bean-6 { left: 68%; animation-duration: 19s; animation-delay: -6s; top: 100%; }
                .bean-7 { left: 80%; animation-duration: 24s; animation-delay: -10s; top: 100%; }
                .bean-8 { left: 92%; animation-duration: 17s; animation-delay: -3s; top: 100%; }

                @keyframes beanDrift {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    5% { opacity: 0.08; }
                    95% { opacity: 0.08; }
                    100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
                }

                /* ── Card ── */
                .login-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 440px;
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(28px) saturate(1.6);
                    -webkit-backdrop-filter: blur(28px) saturate(1.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    box-shadow:
                        0 0 0 1px rgba(217, 119, 6, 0.15),
                        0 32px 80px rgba(0, 0, 0, 0.6),
                        0 0 60px rgba(217, 119, 6, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08);
                    padding: 2.5rem 2.25rem 2rem;
                    opacity: 0;
                    transform: translateY(24px) scale(0.97);
                    transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                                transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
                }

                .login-card--visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                /* ── Accent bar ── */
                .login-card-accent {
                    position: absolute;
                    top: 0; left: 20%; right: 20%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #f59e0b, #d97706, transparent);
                    border-radius: 0 0 4px 4px;
                }

                /* ── Logo ── */
                .login-logo-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .login-logo-ring {
                    width: 76px; height: 76px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(180, 83, 9, 0.2));
                    border: 1px solid rgba(251, 191, 36, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: logoPulse 3s ease-in-out infinite;
                    box-shadow: 0 0 30px rgba(217, 119, 6, 0.2);
                }

                .login-logo-inner {
                    width: 56px; height: 56px;
                    background: #ffffff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(217, 119, 6, 0.4);
                    overflow: hidden;
                }

                .login-logo-img {
                    width: 100%; height: 100%;
                    object-fit: contain;
                    padding: 4px;
                }

                @keyframes logoPulse {
                    0%, 100% { box-shadow: 0 0 30px rgba(217, 119, 6, 0.2); }
                    50% { box-shadow: 0 0 50px rgba(217, 119, 6, 0.4); }
                }

                .login-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: #f59e0b;
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    padding: 0.25rem 0.65rem;
                    border-radius: 100px;
                }

                .login-badge-icon {
                    width: 11px; height: 11px;
                }

                /* ── Heading ── */
                .login-heading {
                    text-align: center;
                    margin-bottom: 1.75rem;
                }

                .login-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.02em;
                    line-height: 1.2;
                    margin-bottom: 0.35rem;
                }

                .login-subtitle {
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.45);
                }

                /* ── Form ── */
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.1rem;
                }

                .login-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                    transition: transform 0.2s ease;
                }

                .login-field--focused {
                    transform: translateY(-1px);
                }

                .login-label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.6);
                    letter-spacing: 0.02em;
                }

                .login-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .login-input-icon {
                    position: absolute;
                    left: 0.85rem;
                    width: 16px; height: 16px;
                    color: rgba(255, 255, 255, 0.3);
                    pointer-events: none;
                    z-index: 1;
                    transition: color 0.2s;
                }

                .login-field--focused .login-input-icon {
                    color: #f59e0b;
                }

                .login-input {
                    width: 100%;
                    height: 46px;
                    padding-left: 2.6rem !important;
                    background: rgba(255, 255, 255, 0.06) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    color: #fff !important;
                    font-size: 0.9rem !important;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s !important;
                    outline: none !important;
                    box-shadow: none !important;
                }

                .login-input::placeholder {
                    color: rgba(255, 255, 255, 0.2) !important;
                }

                .login-input:focus {
                    background: rgba(255, 255, 255, 0.09) !important;
                    border-color: rgba(245, 158, 11, 0.5) !important;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12) !important;
                }

                .login-input--password {
                    padding-right: 2.8rem !important;
                }

                .login-eye-btn {
                    position: absolute;
                    right: 0.85rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    color: rgba(255, 255, 255, 0.3);
                    transition: color 0.2s;
                    z-index: 1;
                }

                .login-eye-btn:hover {
                    color: rgba(255, 255, 255, 0.7);
                }

                .login-eye-icon {
                    width: 16px; height: 16px;
                }

                /* ── Error ── */
                .login-error {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.82rem;
                    color: #fca5a5;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 10px;
                    padding: 0.65rem 0.85rem;
                }

                .login-error-dot {
                    width: 6px; height: 6px;
                    background: #ef4444;
                    border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 8px #ef4444;
                }

                /* ── Submit Button ── */
                .login-btn {
                    width: 100%;
                    height: 48px;
                    margin-top: 0.25rem;
                    background: linear-gradient(135deg, #d97706, #b45309) !important;
                    border: none !important;
                    border-radius: 12px !important;
                    color: #fff !important;
                    font-size: 0.95rem !important;
                    font-weight: 600 !important;
                    letter-spacing: 0.01em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s !important;
                    box-shadow: 0 4px 24px rgba(217, 119, 6, 0.35) !important;
                    position: relative;
                    overflow: hidden;
                }

                .login-btn::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 70%);
                    transform: translateX(-100%);
                    transition: transform 0.5s ease;
                }

                .login-btn:hover::before {
                    transform: translateX(100%);
                }

                .login-btn:hover:not(:disabled) {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 32px rgba(217, 119, 6, 0.5) !important;
                }

                .login-btn:active:not(:disabled) {
                    transform: translateY(0) !important;
                }

                .login-btn:disabled {
                    opacity: 0.6 !important;
                    cursor: not-allowed !important;
                }

                .login-btn-spinner {
                    width: 18px; height: 18px;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .login-btn-arrow {
                    font-size: 1.1rem;
                    transition: transform 0.2s;
                }

                .login-btn:hover .login-btn-arrow {
                    transform: translateX(3px);
                }

                /* ── Footer ── */
                .login-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 1.5rem;
                    font-size: 0.73rem;
                    color: rgba(255, 255, 255, 0.2);
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                .login-footer-dot {
                    width: 3px; height: 3px;
                    background: rgba(245, 158, 11, 0.4);
                    border-radius: 50%;
                }

                /* ── Responsive ── */
                @media (max-width: 480px) {
                    .login-card {
                        padding: 2rem 1.5rem 1.75rem;
                        border-radius: 20px;
                    }
                    .login-title { font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
