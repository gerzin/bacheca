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
                {listing.listing_type ? (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {listing.listing_type_display}
                    </span>
                ) : (
                    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {listing.section.name}
                    </span>
                )}
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

            {/* Author and Contact */}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-medium text-white">
                        {listing.author.first_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {listing.author.full_name}
                    </span>
                </div>

                {/* Contact buttons */}
                <div className="flex items-center gap-2">
                    {/* WhatsApp button */}
                    <a
                        href={`https://wa.me/${listing.author.phone_number.replace(/\+/g, "")}?text=${encodeURIComponent(`Ciao, ho visto il tuo annuncio "${listing.title}" su Bacheca e vorrei maggiori informazioni.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-sm transition-all hover:scale-105 hover:bg-green-600 hover:shadow-md"
                        title="Contatta su WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </a>

                    {/* Phone call button */}
                    <a
                        href={`tel:${listing.author.phone_number}`}
                        className="flex h-8 items-center gap-1.5 rounded-full bg-violet-500 px-3 text-white shadow-sm transition-all hover:scale-105 hover:bg-violet-600 hover:shadow-md"
                        title="Chiama"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                            />
                        </svg>
                        <span className="text-xs font-medium">{listing.author.phone_number}</span>
                    </a>
                </div>
            </div>
        </article>
    );
}
