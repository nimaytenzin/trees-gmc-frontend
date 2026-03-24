import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { User, LoginResponse } from '../models/user.model';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiBaseUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem('trees_gmc_user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<{ data: LoginResponse }>(`${this.API}/login`, { email, password })
      .pipe(
        map((res) => res.data),
        tap((res) => {
          localStorage.setItem('trees_gmc_token', res.accessToken);
          localStorage.setItem('trees_gmc_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }),
      );
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    designation?: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<{ data: LoginResponse }>(`${this.API}/register`, data)
      .pipe(
        map((res) => res.data),
        tap((res) => {
          localStorage.setItem('trees_gmc_token', res.accessToken);
          localStorage.setItem('trees_gmc_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('trees_gmc_token');
    localStorage.removeItem('trees_gmc_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('trees_gmc_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }
}
