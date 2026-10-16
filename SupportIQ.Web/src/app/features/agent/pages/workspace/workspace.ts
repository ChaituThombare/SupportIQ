import { ChangeDetectorRef, inject, OnInit, Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TicketService, TicketResponse } from '../../../../core/services/ticket';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],  
  templateUrl: './workspace.html',
  styleUrl: './workspace.css',
})
export class Workspace implements OnInit {
  private readonly ticketService = inject(TicketService)
  private readonly cdr = inject(ChangeDetectorRef);

  
  tickets: TicketResponse[] = [];
  loading = false;
  errorMessage = '';
  selectedStatus = 'All';

  readonly agentName = 'Agent'
  
  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketService.getAssignedTickets()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: tickets => {
          this.tickets = tickets;
          this.cdr.detectChanges();
        },
        error: error => {
          this.errorMessage = error.status === 401 ? 'Session expired. Please log in again' : error.status === 403 ? 'Agent access required.' : 'Unable to load assigned tickets.';

          this.cdr.detectChanges();
        }
      });
  }

  get filteredTickets(): TicketResponse[] {
    if (this.selectedStatus === 'All') {
      return this.tickets;
    }

    const selected = this.normalizeStatus(this.selectedStatus);

    return this.tickets.filter(
      ticket => this.normalizeStatus(ticket.status) === selected,
    );
  }

  private normalizeStatus(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '');
  }
  
  get openCount(): number {
    return this.tickets.filter(ticket => ticket.status === 'Open').length;
  }

  get inProgressCount(): number {
    return this.tickets.filter(
      ticket => ['InProgress', 'In Progress'].includes(ticket.status),
    ).length;
  }

  get resolvedCount(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'Resolved',
    ).length;
  }

  get criticalCount(): number {
    return this.tickets.filter(
      ticket => ticket.priority === 'Critical',
    ).length;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase().replace(/\s+/g, '')) {
      case 'open':
        return 'status-open';
      case 'inprogress':
        return 'status-progress';
      case 'resolved':
        return 'status-resolved';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-open';
    }
  }

  getPriorityClass(priority: TicketPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
  }
}