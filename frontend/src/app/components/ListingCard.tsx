import { Listing } from "@/lib/types";

interface ListingCardProps {
    listing: Listing;
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

export default function ListingCard({ listing }: ListingCardProps) {
    const formattedPrice = formatPrice(listing.price, listing.price_negotiable);
    const formattedDate = listing.published_at
        ? formatDate(listing.published_at)
        : formatDate(listing.created_at);

    return (
        <article className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header with type badge and date */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${listing.listing_type === "offro"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                >
                    {listing.listing_type_display}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formattedDate}
                </span>
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
