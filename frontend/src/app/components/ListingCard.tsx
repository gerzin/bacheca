"use client";

import { useState } from "react";
import { Listing, User } from "@/lib/types";
import { api, ApiServiceError } from "@/lib/api";

interface ListingCardProps {
    listing: Listing;
    currentUser?: User | null;
    onDelete?: (listingId: number) => void;
    onUserBanned?: (userId: number) => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Adesso";
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

function formatPrice(price: string | null, negotiable: boolean): string | null {
    if (!price) return null;
    const numPrice = parseFloat(price);
    const formatted = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
    }).format(numPrice);
    return negotiable ? `${formatted} (trattabile)` : formatted;
}

export default function ListingCard({ listing, currentUser, onDelete, onUserBanned }: ListingCardProps) {
    const [showStaffActions, setShowStaffActions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBanning, setIsBanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formattedPrice = formatPrice(listing.price, listing.price_negotiable);
    const formattedDate = listing.published_at
        ? formatDate(listing.published_at)
        : formatDate(listing.created_at);

    const isStaff = currentUser?.is_staff === true;

    const handleDelete = async () => {
        if (!confirm("Sei sicuro di voler eliminare questo annuncio?")) return;

        setIsDeleting(true);
        setError(null);
        try {
            await api.deleteListing(listing.id);
            onDelete?.(listing.id);
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setError(err.message);
            } else {
                setError("Errore durante l'eliminazione");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBanUser = async () => {
        if (!confirm(`Sei sicuro di voler bannare ${listing.author.full_name}? Tutti i suoi annunci verranno archiviati.`)) return;

        setIsBanning(true);
        setError(null);
        try {
            await api.banUser(listing.author.id, "Banned by staff from listing");
            onUserBanned?.(listing.author.id);
        } catch (err) {
            if (err instanceof ApiServiceError) {
                setError(err.message);
            } else {
                setError("Errore durante il ban");
            }
        } finally {
            setIsBanning(false);
        }
    };

    return (
        <article className="group relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            {/* Error message */}
            {error && (
                <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Header with type badge, date, and staff actions */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${listing.listing_type === "offro"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                >
                    {listing.listing_type_display}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formattedDate}
                    </span>
                    {/* Staff actions menu */}
                    {isStaff && (
                        <div className="relative">
                            <button
                                onClick={() => setShowStaffActions(!showStaffActions)}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                title="Azioni staff"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-4 w-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                                    />
                                </svg>
                            </button>
                            {showStaffActions && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowStaffActions(false)}
                                    />
                                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                                        <button
                                            onClick={() => {
                                                setShowStaffActions(false);
                                                handleDelete();
                                            }}
                                            disabled={isDeleting}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-4 w-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                />
                                            </svg>
                                            {isDeleting ? "Eliminando..." : "Elimina annuncio"}
                                        </button>
                                        {/* Don't allow banning yourself or staff (unless you're a superuser) */}
                                        {listing.author.id !== currentUser?.id &&
                                            (!listing.author.is_staff || currentUser?.is_superuser) && (
                                                <button
                                                    onClick={() => {
                                                        setShowStaffActions(false);
                                                        handleBanUser();
                                                    }}
                                                    disabled={isBanning}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="h-4 w-4"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                        />
                                                    </svg>
                                                    {isBanning ? "Bannando..." : `Banna ${listing.author.first_name}`}
                                                </button>
                                            )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Title */}
            <h3 className="mb-2 font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">
                {listing.title}
            </h3>

            {/* Description */}
            <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {listing.description}
            </p>

            {/* Footer with location, price, and author */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* Location */}
                {listing.location && (
                    <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                        </svg>
                        <span>{listing.location}</span>
                    </div>
                )}

                {/* Price */}
                {formattedPrice && (
                    <div className="flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400">
                        {formattedPrice}
                    </div>
                )}
            </div>

            {/* Author */}
            <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-medium text-white">
                    {listing.author.first_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {listing.author.full_name}
                </span>
            </div>
        </article>
    );
}
