"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiServiceError } from "@/lib/api";
import { Section, User } from "@/lib/types";

const LISTING_TYPES = [
    { value: "offro", label: "Offro", description: "Offro qualcosa" },
    { value: "cerco", label: "Cerco", description: "Sto cercando qualcosa" },
] as const;

// Maximum days for regular users
const MAX_DURATION_DAYS = 14;

export default function CreateListingPage() {
    const router = useRouter();
    const [sections, setSections] = useState<Section[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Form state
    const [sectionId, setSectionId] = useState<number | "">("");
    const [title, setTitle] = useState("");
    const [listingType, setListingType] = useState<"cerco" | "offro">("offro");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [price, setPrice] = useState("");
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = () => {
            const authenticated = api.isAuthenticated();
            setIsAuthenticated(authenticated);
            if (!authenticated) {
                router.push("/");
                return;
            }
            const storedUser = api.getStoredUser();
            setUser(storedUser);
        };
        checkAuth();
    }, [router]);

    // Fetch sections
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const data = await api.getSections();
                setSections(data);
            } catch (err) {
                console.error("Failed to fetch sections:", err);
            }
        };
        fetchSections();
    }, []);

    const getMaxExpiryDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + MAX_DURATION_DAYS);
        return maxDate.toISOString().slice(0, 16);
    };

    const getDefaultExpiryDate = () => {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + MAX_DURATION_DAYS);
        return defaultDate.toISOString().slice(0, 16);
    };

    // Set default expiry date for regular users
    useEffect(() => {
        if (user && !user.is_staff && !expiresAt) {
            setExpiresAt(getDefaultExpiryDate());
        }
    }, [user, expiresAt]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await api.createListing({
                section_id: sectionId as number,
                title,
                listing_type: listingType,
                description,
                location: location || undefined,
                price: price || undefined,
                price_negotiable: priceNegotiable,
                contact_email: contactEmail || undefined,
                contact_phone: contactPhone || undefined,
                expires_at: expiresAt || undefined,
            });

            // Redirect to my listings on success
            router.push("/i-miei-annunci");
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

    const isAdmin = user?.is_staff;

    // Loading state while checking authentication
    if (isAuthenticated === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    // If not authenticated, don't render (redirect will happen)
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
                        Nuovo annuncio
                    </h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Compila il form per pubblicare il tuo annuncio
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section */}
                    <div>
                        <label
                            htmlFor="section"
                            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Sezione *
                        </label>
                        <select
                            id="section"
                            value={sectionId}
                            onChange={(e) => setSectionId(Number(e.target.value))}
                            required
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            <option value="">Seleziona una sezione</option>
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Listing type */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Tipo di annuncio *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {LISTING_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setListingType(type.value)}
                                    className={`rounded-xl border-2 p-4 text-left transition-all ${listingType === type.value
                                            ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                                            : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
                                        }`}
                                >
                                    <span
                                        className={`block font-medium ${listingType === type.value
                                                ? "text-violet-700 dark:text-violet-300"
                                                : "text-zinc-900 dark:text-zinc-100"
                                            }`}
                                    >
                                        {type.label}
                                    </span>
                                    <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
                                        {type.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Titolo *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Es: Cercasi cameriere part-time"
                            required
                            maxLength={200}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Descrizione *
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrivi il tuo annuncio in dettaglio..."
                            required
                            rows={5}
                            className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label
                            htmlFor="location"
                            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Località
                        </label>
                        <input
                            type="text"
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Es: Milano, Centro"
                            maxLength={200}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />
                    </div>

                    {/* Price */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="price"
                                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Prezzo (€)
                            </label>
                            <input
                                type="number"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={priceNegotiable}
                                    onChange={(e) => setPriceNegotiable(e.target.checked)}
                                    className="h-5 w-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-600"
                                />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    Prezzo trattabile
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Expiration */}
                    <div>
                        <label
                            htmlFor="expiresAt"
                            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Scadenza
                        </label>
                        <input
                            type="datetime-local"
                            id="expiresAt"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            max={isAdmin ? undefined : getMaxExpiryDate()}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        {!isAdmin && (
                            <p className="mt-1 text-xs text-zinc-500">
                                Massimo {MAX_DURATION_DAYS} giorni dalla data odierna
                            </p>
                        )}
                    </div>

                    {/* Contact info */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                        <h3 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">
                            Contatti (opzionale)
                        </h3>
                        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                            Se non specifichi contatti, verranno usati quelli del tuo profilo
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="contactEmail"
                                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="email@esempio.com"
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="contactPhone"
                                    className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Telefono
                                </label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="+39 333 1234567"
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Submit button */}
                    <div className="flex gap-3">
                        <Link
                            href="/"
                            className="flex-1 rounded-xl border border-zinc-300 bg-white py-3.5 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                            Annulla
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
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
                                    Pubblicazione...
                                </span>
                            ) : (
                                "Pubblica annuncio"
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
