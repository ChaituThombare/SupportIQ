import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TicketService } from '../../../../core/services/ticket';
import { CategoryService, Category } from '../../../../core/services/category';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-create-ticket',
  styleUrl: './create-ticket.css',
  templateUrl: './create-ticket.html',
})
export class CreateTicket implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  submitted = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  categories: Category[] = [];
  loadingCategories = false;
  categoriesError = '';

  ngOnInit(): void {
    this.loadingCategories = true;

    this.categoryService.getCategories()
    .pipe(
      finalize(() => {
        this.loadingCategories = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: categories => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: () => {
        this.categoriesError = 'Could not load categories. Please try again later.';
        this.cdr.detectChanges();
      }
    });
  }

  readonly ticketForm = this.formBuilder.nonNullable.group({
    categoryId: [0, [Validators.required, Validators.min(1)]],
    subject: ['', 
      [Validators.required, 
       Validators.minLength(5), 
       Validators.maxLength(120)
      ]],
    description: ['', 
      [Validators.required, 
       Validators.minLength(10), 
       Validators.maxLength(3000)
      ]],
  });

  clearMessage(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  submitForm(): void {
    this.clearMessage();

    if(this.loading) return;

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const form = this.ticketForm.getRawValue();
    
    if(!form.subject.trim() || !form.description.trim()) {
      this.ticketForm.controls.subject.markAsTouched();
      this.ticketForm.controls.description.markAsTouched();
      return;
    }

    this.loading = true;

    this.ticketService.createTicket({
      subject: form.subject.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
    })
    .pipe(
      finalize(() => {
        this.loading = false
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: ticket => {
        this.successMessage = `Ticket created successfully! Ticket ID: ${ticket.ticketId}`;

        this.cdr.detectChanges();

        void this.router.navigate(['/customer/dashboard'], {
          queryParams: { refresh: Date.now() },
        });
      },
      error: error => {
        this.errorMessage = error.error?.message ?? 'Ticket coould not be created. Please try again.';

        this.cdr.detectChanges();
      }
    });
  }
}
