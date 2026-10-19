import { CommonModule, DatePipe } from '@angular/common';
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminAgent, TicketResponse, TicketService } from '../../../../core/services/ticket';
import { AdminNavigation } from '../../shared/admin-navigation/admin-navigation';

interface AdminTicket {
  id: number;
  subject: string;
  customer: string;
  category: string;
  priority: string;
  status: string;
  assignedAgentId: number | null;
  assignedTo: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavigation],
  templateUrl: './admin-workspace.html',
  styleUrl: './admin-workspace.css'
})
export class AdminWorkspace implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  searchTerm = '';
  statusFilter = 'All';
  priorityFilter = 'All';
  assignmentFilter = 'All';

  agents: AdminAgent[] = [];
  tickets: AdminTicket[] = [];

  loading = false;
  agentsLoading = false;
  errorMessage = '';
  assignmentError = '';
  assigningTicketId: number | null = null;

  actionError = '';
  updatingStatusTicketId: number | null = null;
  updatingPriorityTicketId: number | null = null;

  ngOnInit(): void {
    this.loadAgents();
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketService
      .getAdminTickets()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: TicketResponse[]) => {
          this.tickets = response.map(ticket =>
            this.mapTicket(ticket)
          );
          this.cdr.detectChanges();
        },
        error: error => {
          this.errorMessage = error.status === 401 ? 'Session expired. PLease Log In again.' : error.status === 403 ? 'Admin access reuqired.' : 'Unable to load tickets. Check the API and endpoint.';
          this.cdr.detectChanges();
        }
      });
  }

  loadAgents(): void {
    this.agentsLoading = true;

    this.ticketService
      .getAdminAgents()
      .pipe(
        finalize(() => {
          this.agentsLoading = false,
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: agents => {
          this.agents = agents;
          this.cdr.detectChanges();
        },
        error: error => {
          this.errorMessage =
            error.status === 401
              ? 'Session expired. Please log in again.'
              : error.status === 403
                ? 'Admin access required to load agents.'
                : 'Unable to load agents. Check the API endpoint.';
          this.cdr.detectChanges();
        }
      });
  }

  private mapTicket(ticket: TicketResponse): AdminTicket {
    const assignedTicket = ticket as TicketResponse & {
      assignedAgentId?: number | null;
      assignedAgentName?: string | null;
    };

    const assignedAgentId = assignedTicket.assignedAgentId ?? null;

    return {
      id: ticket.ticketId,
      subject: ticket.subject,
      customer: ticket.customerName || `Customer #${ticket.customerId}`,
      category:
        ticket.categoryName ||
        (ticket.categoryId
          ? `Category #${ticket.categoryId}`
          : 'Uncategorized'),
      priority: ticket.priority,
      status: this.displayStatus(ticket.status),
      assignedAgentId,
      assignedTo: assignedTicket.assignedAgentName || 'Unassigned',
      createdAt: ticket.createdOn
    };
  }

  private displayStatus(status: string): string {
    switch (status.toLowerCase().replace(/\s+/g, '')) {
      case 'open':
        return 'Open';
      case 'inprogress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }

  get totalTickets(): number {
    return this.tickets.length;
  }

  get openTickets(): number {
    return this.tickets.filter(ticket => ticket.status === 'Open').length;
  }

  get inProgressTickets(): number {
    return this.tickets.filter(ticket => ticket.status === 'In Progress').length;
  }

  get resolvedTickets(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'Resolved' || ticket.status === 'Closed'
    ).length;
  }

  get unassignedTickets(): number {
    return this.tickets.filter(ticket => ticket.assignedAgentId === null).length;
  }

  get filteredTickets(): AdminTicket[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.tickets.filter(ticket => {
      const matchesSearch =
        !search ||
        String(ticket.id).includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        ticket.customer.toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'All' || ticket.status === this.statusFilter;

      const matchesPriority =
        this.priorityFilter === 'All' || ticket.priority === this.priorityFilter;

      const matchesAssignment =
        this.assignmentFilter === 'All' ||
        (this.assignmentFilter === 'Unassigned'
          ? ticket.assignedAgentId === null
          : String(ticket.assignedAgentId) === this.assignmentFilter);

      return (
        matchesSearch && 
        matchesStatus && 
        matchesPriority && 
        matchesAssignment);
    });
  }

  agentIdValue(id: number | null): string {
    return id !== null ? String(id) : 'Unassigned';
  }

  assignTicket(ticket: AdminTicket, value: string): void {
    this.assignmentError = '';

    const agentId = value === 'Unassigned' ? null : Number(value);

    if(agentId === ticket.assignedAgentId) {
      return;
    }

    if(agentId === null){
      this.assignmentError = 'Unassigning tickets is not supported by the current API.';
      return;
    }

    if(!Number.isInteger(agentId) || agentId <= 0) {
      this.assignmentError = 'Invalid agent ID.';
      this.loadTickets();
      return;
    }

    this.assigningTicketId = ticket.id;
    
    this.ticketService
      .assignTicket(ticket.id, agentId)
      .pipe(
        finalize(() => {
          this.assigningTicketId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.assignmentError = '';
          this.loadTickets();
        },
        error: error => {
          this.assignmentError =
            error.error?.message ||
              'Ticket assignment failed. Please try again.'
          this.loadTickets();
          this.cdr.detectChanges();
        }
      });
  }

  getAgentActiveTickets(agent: AdminAgent): number {
    return this.tickets.filter(
      ticket => ticket.assignedAgentId === agent.id && 
      ticket.status !== 'Resolved' && 
      ticket.status !== 'Closed'
    ).length;
  }

  getAgentWorkload(agent: AdminAgent): number {
    const maximum = Math.max(0, ...this.agents.map(a => this.getAgentActiveTickets(a)));

    if(maximum === 0) {
      return 0;
    }
    
    return (this.getAgentActiveTickets(agent) / maximum) * 100;
  }

  getPriorityClass(priority: string): string {
    return priority.toLowerCase();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  trackByTicketId(
    _index: number, 
    ticket: AdminTicket
  ): number {
    return ticket.id;
  }

  changeTicketStatus(ticket: AdminTicket, status: string): void {
    if(status === ticket.status) {
      return;
    }

    this.actionError = '';
    this.updatingStatusTicketId = ticket.id;

    this.ticketService
      .updateTicketStatus(ticket.id, status)
      .pipe(
        finalize(() => {
          this.updatingStatusTicketId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadTickets();
        },
        error: error => {
          this.actionError =
            error.error?.message ||
              'Ticket status update failed. Please try again.';
          this.loadTickets();
          this.cdr.detectChanges();
        }
      });
  }
  
  changeTicketPriority(ticket: AdminTicket, priority: string): void {
    if(priority === ticket.priority) {
      return;
    }

    this.actionError = '';
    this.updatingStatusTicketId = ticket.id;

    this.ticketService
      .updateTicketPriority(ticket.id, priority)
      .pipe(
        finalize(() => {
          this.updatingStatusTicketId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadTickets();
        },
        error: error => {
          this.actionError =
            error.error?.message ||
              'Ticket priority update failed. Please try again.';
          this.loadTickets();
          this.cdr.detectChanges();
        }
      });
  }
}
