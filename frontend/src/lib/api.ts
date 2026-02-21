import { LoginRequest, LoginResponse, ApiError } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = `${API_URL}/api`;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        // Add auth token if available
        const accessToken =
            typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json().catch(() => ({
                detail: "An error occurred",
            }));
            throw new ApiServiceError(response.status, errorData);
        }

        return response.json();
    }

    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>("/auth/login/", {
            method: "POST",
            body: JSON.stringify(data),
        });

        // Store tokens
        if (typeof window !== "undefined") {
            localStorage.setItem("access_token", response.tokens.access);
            localStorage.setItem("refresh_token", response.tokens.refresh);
            localStorage.setItem("user", JSON.stringify(response.user));
        }

        return response;
    }

    logout(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
        }
    }

    getStoredUser() {
        if (typeof window === "undefined") return null;
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }

    isAuthenticated(): boolean {
        if (typeof window === "undefined") return false;
        return !!localStorage.getItem("access_token");
    }

    async refreshToken(): Promise<string | null> {
        const refreshToken =
            typeof window !== "undefined"
                ? localStorage.getItem("refresh_token")
                : null;

        if (!refreshToken) return null;

        try {
            const response = await this.request<{ access: string }>("/auth/refresh/", {
                method: "POST",
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (typeof window !== "undefined") {
                localStorage.setItem("access_token", response.access);
            }

            return response.access;
        } catch {
            this.logout();
            return null;
        }
    }
}

export class ApiServiceError extends Error {
    status: number;
    errors: ApiError;

    constructor(status: number, errors: ApiError) {
        super(ApiServiceError.formatMessage(errors));
        this.status = status;
        this.errors = errors;
    }

    static formatMessage(errors: ApiError): string {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(errors)) {
            if (Array.isArray(value)) {
                messages.push(...value);
            } else if (typeof value === "string") {
                messages.push(value);
            }
        }
        return messages.join(". ") || "An error occurred";
    }

    getFieldError(field: string): string | undefined {
        const error = this.errors[field];
        if (Array.isArray(error)) return error[0];
        if (typeof error === "string") return error;
        return undefined;
    }
}

export const api = new ApiService();
