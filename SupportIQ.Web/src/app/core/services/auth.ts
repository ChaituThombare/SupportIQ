import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}

export interface ApiMessage{
    message: string;
}

@Injectable({ providedIn: 'root'})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/auth`;
    private readonly tokenKey = 'supportiq_token';
    private readonly userKey = 'supportiq_user';

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http
        .post<LoginResponse>(`${this.baseUrl}/login`, request)
        .pipe(tap(response => this.saveSession(response)));
    }

    register(request: RegisterRequest): Observable<ApiMessage> {
        return this.http
        .post<ApiMessage>(`${this.baseUrl}/register`, request);
    }

    private saveSession(response: LoginResponse): void {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify({
            userId: response.userId,
            name: response.name,
            email: response.email,
            role: response.role
        }));
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getUser(): Omit<LoginResponse, 'token'> | null {
        const value = localStorage.getItem(this.userKey);
        if(!value) return null;

        try{
            return JSON.parse(value) as Omit<LoginResponse, 'token'>;
        }catch {
            this.logout();
            return null;
        }
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    getErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            if(error.status === 0){
                return 'Cannot connect to the server. Please check your internet connection or try again later.';
            }

            const message = error.error?.message;
            if(typeof message === 'string' && message.trim()){
                return message;
            }

            if(error.status === 400){
                return 'Server error. Please try again shortly.';
            }
        }
        return 'Something went wrong. Please try again.';
    }
}
