import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    InputTextModule, PasswordModule, ButtonModule,
    MessageModule, CheckboxModule
  ],
  template: `
    <div class="min-h-dvh bg-background-light font-display flex flex-col">
      <header class="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-100">
        <div class="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-3 no-underline group">
            <div class="size-10 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
              <span class="material-symbols-outlined text-white">eco</span>
            </div>
            <div class="hidden sm:block">
              <div class="text-sm font-black uppercase tracking-tighter text-slate-900">Trees-GMC</div>
              <div class="text-[10px] text-slate-400 font-medium">Gelephu Mindfulness City</div>
            </div>
          </a>
          <a routerLink="/" class="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-all">
            ← Back to Map
          </a>
        </div>
      </header>

      <main class="flex-grow flex flex-col lg:flex-row pt-20">
        <div class="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <img
            src="/assets/hero1.jpg"
            alt="Community tree-watering"
            class="absolute inset-0 h-full w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
          />
          <div class="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
          
          <div class="absolute bottom-12 left-12 right-12 text-white p-8 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
            <p class="text-sm font-light leading-relaxed mb-4">
              "Nurturing the environment is the cornerstone of the Mindfulness City vision, ensuring a harmonious balance between progress and nature."
            </p>
            <div class="flex items-center gap-2 opacity-80">
              <span class="material-symbols-outlined text-sm">location_on</span>
              <span class="text-[10px] uppercase tracking-widest font-bold">Bhutan Forestry Initiative</span>
            </div>
          </div>
        </div>

        <div class="flex-grow flex items-center justify-center p-8 lg:p-16 bg-white">
          <div class="w-full max-w-md animate-fade-in-up">
            
            <div class="mb-10">
              <span class="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                Internal Access Only
              </span>
              <h2 class="text-4xl font-extrabold text-slate-900 tracking-tight">Portal Login</h2>
              <p class="text-slate-500 mt-2">Manage and monitor the urban forest ecosystem.</p>
            </div>

            @if (error) {
              <div class="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-semibold mb-6 border border-red-100 flex items-center gap-3">
                <span class="material-symbols-outlined text-base">warning</span>
                {{error}}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Work Email</label>
                <input
                  pInputText
                  formControlName="email"
                  type="email"
                  class="w-full px-4 py-4 border-slate-200 focus:border-primary transition-all rounded-2xl bg-slate-50/50 outline-none"
                  placeholder="name@gmc.bt"
                />
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center px-1">
                  <label class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Security Key</label>
                  <a href="#" class="text-[11px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot?</a>
                </div>
                <p-password
                  formControlName="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full px-4 py-4 border-slate-200 focus:border-primary rounded-2xl bg-slate-50/50"
                  placeholder="••••••••"
                />
              </div>

              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-3">
                  <p-checkbox [binary]="true" inputId="remember" />
                  <label for="remember" class="text-xs text-slate-500 font-medium cursor-pointer">Trust this browser</label>
                </div>
                <span class="text-[10px] font-bold text-slate-300 uppercase">Ver 1.0.4</span>
              </div>

              <button
                type="submit"
                [disabled]="form.invalid || loading"
                class="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 disabled:translate-y-0"
              >
                {{ loading ? 'Authenticating...' : 'Enter Dashboard' }}
              </button>
            </form>

            
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-inputtext:enabled:focus {
        box-shadow: 0 10px 20px -5px rgba(0, 86, 62, 0.15);
      }
      .p-checkbox .p-checkbox-box {
        border-radius: 6px;
        border-color: #e2e8f0;
      }
      .p-checkbox .p-checkbox-box.p-highlight {
        background: var(--primary, #00563e);
        border-color: var(--primary, #00563e);
      }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
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