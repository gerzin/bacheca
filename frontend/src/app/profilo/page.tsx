"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiServiceError } from "@/lib/api";
import { User } from "@/lib/types";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Profile form state
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

    // Password form state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = api.isAuthenticated();
            setIsAuthenticated(authenticated);
            if (!authenticated) {
                router.push("/");
                return;
            }
            try {
                const userData = await api.getMe();
                setUser(userData);
                setEmail(userData.email);
                setPhoneNumber(userData.phone_number || "");
            } catch {
                const storedUser = api.getStoredUser();
                if (storedUser) {
                    setUser(storedUser);
                    setEmail(storedUser.email);
                    setPhoneNumber(storedUser.phone_number || "");
                }
            }
        };
        checkAuth();
    }, [router]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);
        setIsUpdatingProfile(true);

        try {
            const updatedUser = await api.updateProfile({
                email,
                phone_number: phoneNumber,
            });
            setUser(updatedUser);
            setProfileSuccess("Profilo aggiornato con successo!");
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setProfileError(err.message);
            } else {
                setProfileError("Si è verificato un errore. Riprova.");
            }
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== newPasswordConfirm) {
            setPasswordError("Le nuove password non coincidono.");
            return;
        }

        setIsChangingPassword(true);

        try {
            await api.changePassword({
                old_password: oldPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm,
            });
            setPasswordSuccess("Password cambiata con successo!");
            setOldPassword("");
            setNewPassword("");
            setNewPasswordConfirm("");
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setPasswordError(err.message);
            } else {
                setPasswordError("Si è verificato un errore. Riprova.");
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Loading state while checking authentication
    if (isAuthenticated === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    // If not authenticated, don't render (redirect will happen)
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
                    >
                        Bacheca
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                        ← Torna alla bacheca
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                        Impostazioni profilo
                    </h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Gestisci i tuoi dati personali
                    </p>
                </div>

                {/* User info card */}
                <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
                            {user.first_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {user.full_name || `${user.first_name} ${user.last_name}`}
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile update form */}
                <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Modifica dati
                    </h2>

                    {profileError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {profileError}
                        </div>
                    )}

                    {profileSuccess && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                            {profileSuccess}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Numero di telefono
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+39XXXXXXXXXX"
                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Formato italiano: +39 seguito da 9-10 cifre
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isUpdatingProfile ? "Salvataggio..." : "Salva modifiche"}
                        </button>
                    </form>
                </div>

                {/* Password change form */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Cambia password
                    </h2>

                    {passwordError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                            {passwordSuccess}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="oldPassword"
                                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Password attuale
                            </label>
                            <input
                                type="password"
                                id="oldPassword"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="newPassword"
                                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Nuova password
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="newPasswordConfirm"
                                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Conferma nuova password
                            </label>
                            <input
                                type="password"
                                id="newPasswordConfirm"
                                value={newPasswordConfirm}
                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                required
                                minLength={8}
                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isChangingPassword ? "Cambio in corso..." : "Cambia password"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
