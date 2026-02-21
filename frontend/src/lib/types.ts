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
