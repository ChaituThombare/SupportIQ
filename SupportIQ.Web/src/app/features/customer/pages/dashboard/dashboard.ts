import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth';
import { TicketService, TicketResponse } from '../../../../core/services/ticket';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
type TicketPriority = 'Low' | 'Medium' | 'High';

interface DashboardTicket {
  id: number;
  reference: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  updatedAt: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class CustomerDashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  
  showAllTickets = false;
  showCreateTicketNotice = false;
  loading = false;
  errorMessage = '';

  tickets: DashboardTicket[] = [];

  get customerName(): string {
    return this.authService.getUser()?.name ?? 'Customer';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.loadTickets();
    });
  }

  loadTickets(): void{
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.ticketService.getMyTickets().subscribe({
        next: response => {
          this.tickets = response.map(ticket => this.mapTicket(ticket));
          this.loading = false;

          console.log('Tickets loaded:', this.tickets.length);
          console.log('Loading state:', this.loading);

          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Ticket API Error:', error);
  
          this.errorMessage = `Could not load tickets (${error.status || 'network error'}).`;
          this.loading = false;
          this.cdr.detectChanges();
        },
    });
  }

  private mapTicket(ticket: TicketResponse): DashboardTicket {
    return {
      id: ticket.ticketId,
      reference: `SUP-${String(ticket.ticketId).padStart(4, '0')}`,
      subject: ticket.subject,
      category: ticket.categoryId ? `Category ${ticket.categoryId}` : 'Uncategorized',
      status: this.normalizeStatus(ticket.status),
      priority: this.normalizePriority(ticket.priority),
      updatedAt: this.formatDate(ticket.createdOn),
    };
  }
  
  private normalizeStatus(status: string): TicketStatus {
    switch (status.replace(/\s+/g, '').toLowerCase()) {
      case 'inprogress':
        return 'In Progress';
      case 'resolved':
      case 'closed':
        return 'Resolved';
      default:
        return 'Open';
    }
  }

  private normalizePriority(priority: string): TicketPriority {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  }

  private formatDate(value: string): string {
    if(!value) return '';

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  }

  get totalTickets(): number {
    return this.tickets.length;
  }

  get openTickets(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'Open',
    ).length;
  }

  get inProgressTickets(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'In Progress',
    ).length;
  }

  get resolvedTickets(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'Resolved',
    ).length;
  }

  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case 'Open':
        return 'status-open';
      case 'In Progress':
        return 'status-progress';
      case 'Resolved':
        return 'status-resolved';
    }
  }

  getPriorityClass(priority: TicketPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  scrollToTickets(): void {
    document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth',
    block: 'start'
    });
  }

  logOut(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth');
  }
}