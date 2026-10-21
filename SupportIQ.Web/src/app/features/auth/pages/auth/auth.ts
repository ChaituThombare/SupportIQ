import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';

type AuthMode = "login" | "register";

const trimmedNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const name = String(control.value ?? '').trim();
  
  return name.length >= 2 ? null : { invalidName: true };
};

@Component({
  imports: [ReactiveFormsModule],
  standalone: true,
  selector: 'app-auth',
  styleUrl: './auth.css',
  templateUrl: './auth.html',
})

export class Auth {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mode: AuthMode = 'login';
  submitted = false;
  loading = false;
  message = '';
  messageType: 'error' | 'success' = 'success';
  showPassword = false;
  
  readonly authForm = this.formBuilder.nonNullable.group({
    name: ['',[trimmedNameValidator]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    this.configureValidators();
  }

  get isLogin(): boolean {
    return this.mode === 'login';
  }

  switchMode(mode: AuthMode): void {
    if(this.loading) return;

    this.mode = mode;
    this.submitted = false;
    this.message = '';
    this.showPassword = false;
    this.authForm.reset({
      name: '',
      email: '',
      password: '',
    });
  
    this.configureValidators();
  }

  private configureValidators(): void {
    const nameControl = this.authForm.controls.name;
    const passwordControl = this.authForm.controls.password;
    
    if (this.isLogin) {
      nameControl.clearValidators();
      passwordControl.setValidators([Validators.required]);
    } else {
      nameControl.setValidators([Validators.required, trimmedNameValidator]);
      
      passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
    }

    nameControl.updateValueAndValidity({ emitEvent: false });
    passwordControl.updateValueAndValidity({ emitEvent: false });
  }
  
  clearMessage(): void {
    this.message = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submitForm(): void {
    this.submitted = true;
    this.message = '';

    if(this.loading) return;

    if(this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }
    
    const { name, email, password } = this.authForm.getRawValue();
    this.loading = true;

    if(this.isLogin) {
      this.authService
      .login({ email: email.trim(), password })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          const role = response.role.trim().toLowerCase();

          const destination: Record<string, string> = {
            customer: '/customer/dashboard',
            agent: '/agent/workspace',
            admin: '/admin/workspace',
          };

          const route = destination[role ?? ''];

          if(!route){
            this.messageType = 'error';
            this.message = `Login successded, but role "${response.role}" has no matching route.`;
            return;
          }

          this.router.navigateByUrl(route).then(success => {
            if(!success){
              this.messageType = 'error';
              this.message = `Login succeeded, but navigation to "${route}" failed.`;
            }
          }).catch(() => {
            this.messageType = 'error';
            this.message = `Login succeeded, but the next page could not be opened.`;
          });
        },
        error: error => {
          this.messageType = 'error';
          this.message = this.authService.getErrorMessage(error);
        },
      });
      return;
    }
    
    this.authService
    .register({ 
      name: name.trim(), 
      email: email.trim(), 
      password 
    })
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: response => {
        this.messageType = 'success';
        this.message = response.message || `Registration successful! You can now log in.`;
        this.mode = 'login';
        this.submitted = false;
        this.showPassword = false;
        this.authForm.reset({
          name: '',
          email: email.trim(),
          password: '',
        });
        this.configureValidators();
      },
      error: error => {
        this.messageType = 'error';
        this.message = this.authService.getErrorMessage(error);
      },
    });
  }
}
