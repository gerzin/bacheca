"use client";

import { useState } from "react";
import { api, ApiServiceError } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User) => void;
}

type AuthMode = "login" | "register";
type LoginMethod = "email" | "phone";

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
    const [mode, setMode] = useState<AuthMode>("login");
    const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");

    // Login fields
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phonePrefix, setPhonePrefix] = useState("+39");
    const [password, setPassword] = useState("");

    // Register fields
    const [regEmail, setRegEmail] = useState("");
    const [regFirstName, setRegFirstName] = useState("");
    const [regLastName, setRegLastName] = useState("");
    const [regPhone, setRegPhone] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const resetForm = () => {
        setEmail("");
        setPhoneNumber("");
        setPassword("");
        setRegEmail("");
        setRegFirstName("");
        setRegLastName("");
        setRegPhone("");
        setRegPassword("");
        setRegPasswordConfirm("");
        setError("");
        setSuccess("");
    };

    const switchMode = (newMode: AuthMode) => {
        resetForm();
        setMode(newMode);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const identifier = loginMethod === "email"
                ? email
                : `${phonePrefix}${phoneNumber}`;

            const response = await api.login({
                identifier,
                password,
            });

            onLogin(response.user);
            resetForm();
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setError(err.message);
            } else {
                setError("Si è verificato un errore. Riprova.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            await api.register({
                email: regEmail,
                first_name: regFirstName,
                last_name: regLastName,
                phone_number: regPhone,
                password: regPassword,
                password_confirm: regPasswordConfirm,
            });

            setSuccess("Registrazione completata! Ora puoi effettuare il login.");
            setTimeout(() => {
                resetForm();
                setMode("login");
                setEmail(regEmail);
            }, 1500);
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setError(err.message);
            } else {
                setError("Si è verificato un errore. Riprova.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-5 w-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-7 w-7 text-white"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {mode === "login" ? "Bentornato" : "Crea un account"}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {mode === "login"
                                ? "Accedi al tuo account Bacheca"
                                : "Registrati per iniziare a pubblicare annunci"}
                        </p>
                    </div>

                    {/* Mode toggle */}
                    <div className="mb-6 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => switchMode("login")}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${mode === "login"
                                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode("register")}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${mode === "register"
                                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                }`}
                        >
                            Registrati
                        </button>
                    </div>

                    {/* Success message */}
                    {success && (
                        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            {success}
                        </div>
                    )}

                    {mode === "login" ? (
                        <>
                            {/* Login method toggle */}
                            <div className="mb-4 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod("email")}
                                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${loginMethod === "email"
                                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                                            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                        }`}
                                >
                                    Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod("phone")}
                                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${loginMethod === "phone"
                                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                                            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                        }`}
                                >
                                    Telefono
                                </button>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                {loginMethod === "email" ? (
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
                                            placeholder="tu@esempio.com"
                                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                        >
                                            Telefono
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={phonePrefix}
                                                onChange={(e) => setPhonePrefix(e.target.value)}
                                                className="w-24 rounded-xl border border-zinc-300 bg-white px-3 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                            >
                                                <option value="+39">🇮🇹 +39</option>
                                            </select>
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                                                placeholder="123 456 7890"
                                                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg
                                                    className="h-4 w-4 animate-spin"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Accesso in corso...
                                            </>
                                        ) : (
                                            "Accedi"
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Register Form */
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        htmlFor="regFirstName"
                                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                    >
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        id="regFirstName"
                                        value={regFirstName}
                                        onChange={(e) => setRegFirstName(e.target.value)}
                                        placeholder="Mario"
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="regLastName"
                                        className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                    >
                                        Cognome *
                                    </label>
                                    <input
                                        type="text"
                                        id="regLastName"
                                        value={regLastName}
                                        onChange={(e) => setRegLastName(e.target.value)}
                                        placeholder="Rossi"
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="regEmail"
                                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="regEmail"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    placeholder="tu@esempio.com"
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="regPhone"
                                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Telefono *
                                </label>
                                <div className="flex gap-2">
                                    <span className="flex w-20 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 text-sm text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                        🇮🇹 +39
                                    </span>
                                    <input
                                        type="tel"
                                        id="regPhone"
                                        value={regPhone}
                                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                                        placeholder="333 1234567"
                                        className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                        required
                                        minLength={9}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-zinc-500">Sarà visibile negli annunci</p>
                            </div>

                            <div>
                                <label
                                    htmlFor="regPassword"
                                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    id="regPassword"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                    required
                                    minLength={8}
                                />
                                <p className="mt-1 text-xs text-zinc-500">Minimo 8 caratteri</p>
                            </div>

                            <div>
                                <label
                                    htmlFor="regPasswordConfirm"
                                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Conferma Password *
                                </label>
                                <input
                                    type="password"
                                    id="regPasswordConfirm"
                                    value={regPasswordConfirm}
                                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <svg
                                                className="h-4 w-4 animate-spin"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Registrazione in corso...
                                        </>
                                    ) : (
                                        "Registrati"
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
