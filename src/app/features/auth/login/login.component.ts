import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    CheckboxModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6">
      <div class="w-full max-w-md animate-fade-in">
        
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl mb-6">
            <svg class="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 class="text-4xl font-extrabold text-white tracking-tight">Trees-GMC</h1>
          <p class="text-emerald-200/70 mt-2 font-medium">Gelephu Mindfulness City Portal</p>
        </div>

        <div class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10">
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
                  class="w-full py-3 border-slate-200 focus:border-emerald-500 transition-all rounded-xl"
                  [class.ng-dirty]="form.get('email')?.touched"
                  placeholder="name@company.com"
                />
              </span>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label class="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                <a href="#" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Forgot?</a>
              </div>
              <p-password
                formControlName="password"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full py-3 border-slate-200 focus:border-emerald-500 rounded-xl"
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
              styleClass="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold shadow-lg shadow-emerald-200"
            />
          </form>
          
          <div class="mt-8 text-center">
            <p class="text-sm text-slate-400 italic font-light">"Nurturing Nature, Building the Future"</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-inputtext:enabled:focus {
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
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