import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';

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

  mode: AuthMode = 'login';
  submitted = false;
  message = '';
  showPassword = false;
  
  readonly authForm = this.formBuilder.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get isLogin(): boolean {
    return this.mode === 'login';
  }

  switchMode(mode: AuthMode): void {
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

    if(this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.message = this.isLogin
      ? 'Demo only: login form validation passed. No login occurred.'
      : 'Demo only: registration form validation passed. No account was created.';
  }
}
