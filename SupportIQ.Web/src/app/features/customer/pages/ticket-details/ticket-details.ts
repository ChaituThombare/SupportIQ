
import {
  Component,
  inject,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  TicketService,
  TicketResponse,
  TicketMessage
} from '../../../../core/services/ticket';

import {
  CategoryService,
  Category
} from '../../../../core/services/category';

interface TicketDetailsData {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.css'
})
export class TicketDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  private rawTicket: TicketResponse | null = null;
  private categories: Category[] = [];

  ticketId = '';
  ticket: TicketDetailsData | null = null;

  loading = true;
  errorMessage = '';

  messages: TicketMessage[] = [];
  messageText = '';
  loadingMessages = false;
  sendingMessage = false;
  messageError = '';

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.paramMap.get('id') ?? '';

    const numericId = Number(this.ticketId.replace(/^SUP-/i, ''));

    if (
      !this.ticketId ||
      !Number.isSafeInteger(numericId) ||
      numericId <= 0
    ) {
      this.loading = false;
      this.errorMessage = 'Invalid ticket ID.';
      this.cdr.detectChanges();
      return;
    }

    this.loadMessages(numericId);

    this.categoryService.getCategories().subscribe({
      next: categories => {
        this.categories = categories;

        if (this.rawTicket) {
          this.ticket = this.mapTicket(this.rawTicket);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.categories = [];
        this.cdr.detectChanges();
      }
    });

    this.ticketService.getTicketById(numericId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.rawTicket = response;
          this.ticket = this.mapTicket(response);
          this.errorMessage = '';
          this.cdr.detectChanges();
        },
        error: error => {
          this.ticket = null;

          if (error.status === 404) {
            this.errorMessage = 'Ticket not found.';
          } else if (error.status === 401) {
            this.errorMessage =
              'Your session has expired. Please log in again.';
          } else if (error.status === 403) {
            this.errorMessage =
              'You do not have permission to view this ticket.';
          } else {
            this.errorMessage = 'Unable to load ticket details.';
          }

          this.cdr.detectChanges();
        }
      });
  }

  private mapTicket(response: TicketResponse): TicketDetailsData {
    const category = this.categories.find(
      item => item.id === response.categoryId
    );

    return {
      id: `SUP-${String(response.ticketId).padStart(4, '0')}`,
      subject: response.subject,
      description: response.description,
      category:
        category?.name ??
        (response.categoryId
          ? `Category ID: ${response.categoryId}`
          : 'Uncategorized'),
      priority: response.priority || 'Unknown',
      status: response.status || 'Unknown',
      createdAt: this.formatDate(response.createdOn),
      updatedAt: response.updatedOn
        ? this.formatDate(response.updatedOn)
        : 'Not available'
    };
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return 'status-open';

      case 'in progress':
      case 'waiting for customer':
        return 'status-progress';

      case 'resolved':
      case 'closed':
        return 'status-resolved';

      default:
        return 'status-unknown';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'priority-low';

      case 'medium':
        return 'priority-medium';

      case 'high':
      case 'critical':
        return 'priority-high';

      default:
        return 'priority-unknown';
    }
  }

  loadMessages(ticketId: number): void {
    this.loadingMessages = true;
    this.messageError = '';

    this.ticketService.getMessages(ticketId)
      .pipe(
        finalize(() => {
          this.loadingMessages = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: messages => {
          this.messages = messages;
          this.messageError = '';
          this.cdr.detectChanges();
        },
        error: error => {
          this.messages = [];

          if (error.status === 403) {
            this.messageError =
              'You do not have permission to view this conversation.';
          } else {
            this.messageError =
              'Unable to load conversation messages.';
          }

          this.cdr.detectChanges();
        }
      });
  }

  sendReply(): void {
    const text = this.messageText.trim();
    const numericId = Number(this.ticketId.replace(/^SUP-/i, ''));

    if (
      !text ||
      text.length > 5000 ||
      this.sendingMessage ||
      !Number.isSafeInteger(numericId) ||
      numericId <= 0 ||
      this.ticket?.status.toLowerCase() === 'closed'
    ) {
      return;
    }

    this.sendingMessage = true;
    this.messageError = '';

    this.ticketService.sendMessage(numericId, text)
      .pipe(
        finalize(() => {
          this.sendingMessage = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: message => {
          this.messages = [...this.messages, message];
          this.messageText = '';
          this.cdr.detectChanges();
        },
        error: error => {
          if (error.status === 400) {
            this.messageError =
              error.error?.message ||
              'Message could not be sent. Check whether the ticket is closed.';
          } else if (error.status === 403) {
            this.messageError =
              'You do not have permission to reply to this ticket.';
          } else if (error.status === 401) {
            this.messageError =
              'Your session has expired. Please log in again.';
          } else {
            this.messageError =
              'Unable to send your reply. Please try again.';
          }

          this.cdr.detectChanges();
        }
      });
  }
}
