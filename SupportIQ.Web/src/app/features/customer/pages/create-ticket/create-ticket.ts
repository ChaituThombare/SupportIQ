import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-create-ticket',
  styleUrl: './create-ticket.css',
  templateUrl: './create-ticket.html',
})
export class CreateTicket {
  private readonly formBuilder = new FormBuilder();

  submitted = false;
  successMessage = '';

  readonly ticketForm = this.formBuilder.nonNullable.group({
    category: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    priority: ['Medium', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  clearSuccessMessage(): void {
    this.successMessage = '';
  }

  submitForm(): void {
    this.submitted = true;
    this.successMessage = '';

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.successMessage = 'Demo submission successful!';

    console.log('Demo ticket data:', this.ticketForm.getRawValue());
  }
}
