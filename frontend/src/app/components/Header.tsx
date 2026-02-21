"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Check for stored user on mount
    useEffect(() => {
        const storedUser = api.getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    const handleLogin = (userData: User) => {
        setUser(userData);
        setShowLoginModal(false);
    };

    const handleLogout = () => {
        api.logout();
        setUser(null);
    };

    return (
        <>
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        Bacheca
                    </h1>
                    <nav className="flex items-center gap-2">
                        {user ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link
                                    href="/nuovo-annuncio"
                                    className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:shadow-violet-500/30 active:scale-95 sm:px-4"
                                >
                                    <span className="hidden sm:inline">+ Nuovo</span>
                                    <span className="sm:hidden">+</span>
                                </Link>
                                <Link
                                    href="/i-miei-annunci"
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white transition-transform hover:scale-105">
                                        {user.first_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:block">
                                        {user.full_name || user.email}
                                    </span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:px-3"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 active:scale-95"
                            >
                                <span className="relative z-10">Login</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </button>
                        )}
                    </nav>
                </div>
            </header>

            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={handleLogin}
            />
        </>
    );
}
