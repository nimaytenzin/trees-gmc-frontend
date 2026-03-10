import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox'; // Added for UX
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    CheckboxModule
  ],
  template: `
    <div class="min-h-dvh bg-background-light font-display">
      <header class="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div class="mx-auto max-w-6xl px-6 md:px-10 py-4 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-3 text-slate-900 no-underline">
            <div class="size-8 text-primary">
              <span class="material-symbols-outlined text-4xl">eco</span>
            </div>
            <div class="leading-tight">
              <div class="text-lg font-bold tracking-tight">Trees-GMC</div>
              <div class="text-xs text-slate-500 -mt-0.5">Gelephu Mindfulness City</div>
            </div>
          </a>
          <a routerLink="/" class="text-sm font-medium text-slate-600 hover:text-primary transition-colors no-underline">
            Back to map
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-6 md:px-10 py-10 md:py-14">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div class="hidden lg:block">
            <div class="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
              <div class="aspect-4/5 bg-slate-100">
                <img
                  src="/assets/hero1.jpg"
                  alt="Community tree-watering moment"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div class="p-5">
                <p class="text-sm font-semibold text-slate-800">
                  Caring for new life, together.
                </p>
                <p class="mt-1 text-xs text-slate-500 leading-relaxed">
                  Source:His Majesty King Jigme Khesar Facebook page —
                  <a
                    href="https://www.facebook.com/share/1MfJfgWLsM/"
                    target="_blank"
                    rel="noopener"
                    class="text-primary hover:opacity-90 no-underline font-medium"
                  >
                    view post
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div class="w-full max-w-md lg:justify-self-end animate-fade-in">
            <div class="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-8 md:p-10">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p class="text-slate-500 text-sm mt-1">Please enter your details to sign in.</p>
          </div>

          @if (error) {
            <p-message severity="error" [text]="error" styleClass="mb-6 w-full" />
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-envelope text-slate-400"></i>
                <input
                  pInputText
                  formControlName="email"
                  type="email"
                  class="w-full py-3 border-slate-200 focus:border-primary transition-all rounded-xl"
                  [class.ng-dirty]="form.get('email')?.touched"
                  placeholder="name@company.com"
                />
              </span>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label class="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                <a href="#" class="text-xs font-semibold text-primary hover:opacity-90">Forgot?</a>
              </div>
              <p-password
                formControlName="password"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full py-3 border-slate-200 focus:border-primary rounded-xl"
                placeholder="••••••••"
              />
            </div>

            <div class="flex items-center gap-2 mb-2">
              <p-checkbox [binary]="true" inputId="remember" />
              <label for="remember" class="text-sm text-slate-600 cursor-pointer">Stay signed in for 30 days</label>
            </div>

            <p-button
              type="submit"
              label="Sign In to Dashboard"
              [loading]="loading"
              [disabled]="form.invalid"
              styleClass="w-full py-3.5 mt-2 bg-primary hover:bg-primary/90 border-none rounded-xl font-bold shadow-lg shadow-primary/20"
            />
          </form>
          
          <div class="mt-8 text-center">
            <p class="text-sm text-slate-500 italic font-light">"Nurturing Nature, Building the Future"</p>
          </div>
        </div>
      </div>
    </div>
      </main>
  `,
  styles: [`
    :host ::ng-deep {
      .p-inputtext:enabled:focus {
        box-shadow: 0 0 0 2px rgba(0, 86, 62, 0.18);
      }
    }
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.authService.login(email!, password!).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate([res.user.role === 'ADMIN' ? '/app/dashboard' : '/app/trees/register']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'The credentials provided do not match our records.';
      },
    });
  }
}