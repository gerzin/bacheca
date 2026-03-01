"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Listing } from "@/lib/types";

interface ListingModalProps {
    listing: Listing;
    onClose: () => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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

export default function ListingModal({ listing, onClose }: ListingModalProps) {
    const formattedPrice = formatPrice(listing.price, listing.price_negotiable);
    const formattedDate = listing.published_at
        ? formatDate(listing.published_at)
        : formatDate(listing.created_at);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollDown, setCanScrollDown] = useState(true);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (el) {
            const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
            setCanScrollDown(!isAtBottom);
        }
    }, []);

    // Check scroll on mount and after content renders
    useEffect(() => {
        checkScroll();
    }, [checkScroll]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    aria-label="Chiudi"
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

                {/* Scrollable content */}
                <div 
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="scrollbar-hidden max-h-[90vh] overflow-y-auto pb-16"
                >

                {/* Header */}
                <div className="border-b border-zinc-100 p-6 dark:border-zinc-800">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {listing.listing_type ? (
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {listing.listing_type_display}
                            </span>
                        ) : null}
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                            {listing.section.name}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {listing.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Pubblicato il {formattedDate}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Descrizione
                        </h3>
                        <p className="whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
                            {listing.description}
                        </p>
                    </div>

                    {/* Details grid */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        {/* Location */}
                        {listing.location && (
                            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-5 w-5"
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
                                    <span className="text-sm font-medium">Località</span>
                                </div>
                                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    {listing.location}
                                </p>
                            </div>
                        )}

                        {/* Price */}
                        {formattedPrice && (
                            <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-900/20">
                                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-5 w-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-sm font-medium">Prezzo</span>
                                </div>
                                <p className="mt-1 text-lg font-semibold text-violet-700 dark:text-violet-300">
                                    {formattedPrice}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Author section */}
                    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Contatta l&apos;autore
                        </h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
                                    {listing.author.first_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {listing.author.full_name}
                                    </p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {listing.author.phone_number}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* WhatsApp button */}
                                <a
                                    href={`https://wa.me/${listing.author.phone_number.replace(/\+/g, "")}?text=${encodeURIComponent(`Ciao, ho visto il tuo annuncio "${listing.title}" su Bacheca e vorrei maggiori informazioni.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-sm transition-all hover:scale-105 hover:bg-green-600 hover:shadow-md"
                                    title="Contatta su WhatsApp"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-5 w-5"
                                    >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </a>

                                {/* Phone call button */}
                                <a
                                    href={`tel:${listing.author.phone_number}`}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white shadow-sm transition-all hover:scale-105 hover:bg-violet-600 hover:shadow-md"
                                    title="Chiama"
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
                                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                                        />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                {/* Scroll indicator gradient */}
                {canScrollDown && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-zinc-900" />
                )}
                
                {/* Scroll down hint */}
                {canScrollDown && (
                    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
