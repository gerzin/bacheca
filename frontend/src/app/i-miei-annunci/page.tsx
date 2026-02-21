"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiServiceError } from "@/lib/api";
import { Listing } from "@/lib/types";

export default function MyListingsPage() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = () => {
            const authenticated = api.isAuthenticated();
            setIsAuthenticated(authenticated);
            if (!authenticated) {
                router.push("/");
            }
        };
        checkAuth();
    }, [router]);

    const fetchListings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getMyListings();
            setListings(data);
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setError(err.message);
            } else {
                setError("Errore nel caricamento degli annunci");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchListings();
        }
    }, [isAuthenticated, fetchListings]);

    const handleDelete = async (id: number) => {
        if (!confirm("Sei sicuro di voler eliminare questo annuncio?")) {
            return;
        }

        setDeletingId(id);
        try {
            await api.deleteListing(id);
            setListings((prev) => prev.filter((l) => l.id !== id));
        } catch (err) {
            if (err instanceof ApiServiceError) {
                alert(err.message);
            } else {
                alert("Errore durante l'eliminazione");
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handlePublish = async (id: number) => {
        try {
            const updated = await api.publishListing(id);
            setListings((prev) =>
                prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
            );
        } catch (err) {
            if (err instanceof ApiServiceError) {
                alert(err.message);
            } else {
                alert("Errore durante la pubblicazione");
            }
        }
    };

    const getStatusBadge = (listing: Listing) => {
        const statusColors = {
            draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
            expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };

        return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[listing.status]}`}>
                {listing.status_display}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Loading state while checking authentication
    if (isAuthenticated === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) {
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
                    <div className="flex items-center gap-3">
                        <Link
                            href="/nuovo-annuncio"
                            className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:shadow-violet-500/30 active:scale-95"
                        >
                            + Nuovo
                        </Link>
                        <Link
                            href="/"
                            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            ← Bacheca
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                        I miei annunci
                    </h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Gestisci i tuoi annunci: modifica, pubblica o elimina.
                    </p>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                    </div>
                )}

                {/* Error */}
                {error && !isLoading && (
                    <div className="rounded-xl bg-red-50 p-6 text-center dark:bg-red-900/20">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={fetchListings}
                            className="mt-4 text-sm text-red-700 underline hover:no-underline dark:text-red-300"
                        >
                            Riprova
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !error && listings.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-zinc-200 p-12 text-center dark:border-zinc-700">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <svg
                                className="h-8 w-8 text-zinc-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                            Nessun annuncio
                        </h3>
                        <p className="mb-6 text-zinc-500 dark:text-zinc-400">
                            Non hai ancora pubblicato nessun annuncio.
                        </p>
                        <Link
                            href="/nuovo-annuncio"
                            className="inline-flex items-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                        >
                            Crea il tuo primo annuncio
                        </Link>
                    </div>
                )}

                {/* Listings */}
                {!isLoading && !error && listings.length > 0 && (
                    <div className="space-y-4">
                        {listings.map((listing) => (
                            <div
                                key={listing.id}
                                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:p-6"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            {getStatusBadge(listing)}
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${listing.listing_type === "cerco"
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    }`}
                                            >
                                                {listing.listing_type_display}
                                            </span>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {listing.section.name}
                                            </span>
                                        </div>
                                        <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                            {listing.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                            {listing.description}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                            <span>Creato: {formatDate(listing.created_at)}</span>
                                            {listing.expires_at && (
                                                <span className={listing.is_expired ? "text-red-500" : ""}>
                                                    Scade: {formatDate(listing.expires_at)}
                                                </span>
                                            )}
                                            {listing.price && (
                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                    €{listing.price}
                                                    {listing.price_negotiable && " (trattabile)"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-2 sm:flex-col">
                                        {listing.status === "draft" && (
                                            <button
                                                onClick={() => handlePublish(listing.id)}
                                                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 sm:flex-none"
                                            >
                                                Pubblica
                                            </button>
                                        )}
                                        <Link
                                            href={`/modifica-annuncio/${listing.id}`}
                                            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 sm:flex-none"
                                        >
                                            Modifica
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(listing.id)}
                                            disabled={deletingId === listing.id}
                                            className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 sm:flex-none"
                                        >
                                            {deletingId === listing.id ? "..." : "Elimina"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
