"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Section, Listing, User, ListingTypeOption } from "@/lib/types";
import SectionTabs from "./SectionTabs";
import ListingCard from "./ListingCard";

// Helper to get unique listing types across all sections
function getAllListingTypes(sections: Section[]): ListingTypeOption[] {
    const typeMap = new Map<string, ListingTypeOption>();
    for (const section of sections) {
        for (const lt of section.allowed_listing_types || []) {
            if (!typeMap.has(lt.value)) {
                typeMap.set(lt.value, lt);
            }
        }
    }
    return Array.from(typeMap.values());
}

export default function ListingsSection() {
    const [sections, setSections] = useState<Section[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [activeListingType, setActiveListingType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Get current user on mount and listen for storage changes
    useEffect(() => {
        // First, set from localStorage for immediate UI
        const storedUser = api.getStoredUser();
        setCurrentUser(storedUser);

        // Then refresh from API if authenticated (to get updated is_staff, etc.)
        if (storedUser && api.isAuthenticated()) {
            api.getMe().then((freshUser) => {
                setCurrentUser(freshUser);
            }).catch(() => {
                // Token might be invalid, user stays with stored data
            });
        }

        // Listen for storage changes (login/logout)
        const handleStorageChange = () => {
            const user = api.getStoredUser();
            setCurrentUser(user);
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Fetch sections on mount
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const data = await api.getSections();
                setSections(data);
            } catch (err) {
                console.error("Failed to fetch sections:", err);
                setError("Impossibile caricare le sezioni");
            }
        };
        fetchSections();
    }, []);

    // Fetch listings when section or listing type changes
    useEffect(() => {
        const fetchListings = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.getListings(
                    activeSection ?? undefined,
                    activeListingType ?? undefined
                );
                setListings(data);
            } catch (err) {
                console.error("Failed to fetch listings:", err);
                setError("Impossibile caricare gli annunci");
            } finally {
                setIsLoading(false);
            }
        };
        fetchListings();
    }, [activeSection, activeListingType]);

    // Get the currently active section object
    const currentSection = activeSection
        ? sections.find((s) => s.slug === activeSection)
        : null;

    // Get available listing types for the current view
    const availableListingTypes: ListingTypeOption[] = activeSection
        ? currentSection?.allowed_listing_types || []
        : getAllListingTypes(sections);

    // Check if the current section (or all sections when none selected) supports listing types
    const showListingTypeFilter = availableListingTypes.length > 0;

    // Clear listing type filter when switching to a section without that type
    const handleSectionChange = (slug: string | null) => {
        setActiveSection(slug);
        // Clear listing type if the new section doesn't support the current type
        if (slug) {
            const section = sections.find((s) => s.slug === slug);
            const sectionTypes = section?.allowed_listing_types || [];
            const hasCurrentType = sectionTypes.some((t) => t.value === activeListingType);
            if (!hasCurrentType) {
                setActiveListingType(null);
            }
        }
    };

    // Handle listing deletion (staff action)
    const handleListingDelete = (listingId: number) => {
        setListings((prev) => prev.filter((l) => l.id !== listingId));
    };

    // Handle user ban - remove all listings by that user (staff action)
    const handleUserBanned = (userId: number) => {
        setListings((prev) => prev.filter((l) => l.author.id !== userId));
    };

    return (
        <div>
            {/* Section tabs */}
            <SectionTabs
                sections={sections}
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
            />

            {/* Listing type filter - only show when section supports it */}
            {showListingTypeFilter && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Filtra per tipo:
                    </span>
                    {availableListingTypes.map((type) => {
                        const isActive = activeListingType === type.value;
                        return (
                            <button
                                key={type.value}
                                onClick={() =>
                                    setActiveListingType(isActive ? null : type.value)
                                }
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${isActive
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {isActive && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                        className="h-3.5 w-3.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4.5 12.75l6 6 9-13.5"
                                        />
                                    </svg>
                                )}
                                {type.label}
                            </button>
                        );
                    })}
                    {activeListingType && (
                        <button
                            onClick={() => setActiveListingType(null)}
                            className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                            Mostra tutti
                        </button>
                    )}
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {isLoading && !error && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="mb-3 flex justify-between">
                                <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                            <div className="mb-2 h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="mb-3 space-y-2">
                                <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                                <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                            <div className="flex gap-3">
                                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                                <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && listings.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="mx-auto h-12 w-12 text-zinc-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        Nessun annuncio
                    </h3>
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                        Non ci sono annunci in questa sezione.
                    </p>
                </div>
            )}

            {/* Listings grid */}
            {!isLoading && !error && listings.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {listings.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            currentUser={currentUser}
                            onDelete={handleListingDelete}
                            onUserBanned={handleUserBanned}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
