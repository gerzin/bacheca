export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number?: string;
    is_staff: boolean;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}

export interface LoginRequest {
    identifier: string;
    password: string;
}

export interface ApiError {
    [key: string]: string | string[];
}

// Bulletin types
export interface Section {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    allowed_listing_types: string[];
    listing_count: number;
}

export interface ListingAuthor {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
}

export interface Listing {
    id: number;
    section: Section;
    author: ListingAuthor;
    title: string;
    listing_type: "cerco" | "offro";
    listing_type_display: string;
    description: string;
    location: string;
    price: string | null;
    price_negotiable: boolean;
    status: "draft" | "published" | "closed" | "expired";
    status_display: string;
    is_expired: boolean;
    published_at: string | null;
    created_at: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
