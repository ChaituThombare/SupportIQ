import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
type TicketPriority = 'Low' | 'Medium' | 'High';

interface Ticket {
  id: string;
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

export class CustomerDashboard {
  showAllTickets = false;
  showCreateTicketNotice = false;
  readonly customerName = 'Alex';

  readonly tickets: Ticket[] = [
    {
      id: 'SUP-1042',
      subject: 'Unable to access my account',
      category: 'Account',
      status: 'In Progress',
      priority: 'High',
      updatedAt: 'Today',
    },
    {
      id: 'SUP-1038',
      subject: 'Payment confirmation missing',
      category: 'Billing',
      status: 'Open',
      priority: 'Medium',
      updatedAt: 'Yesterday',
    },
    {
      id: 'SUP-1029',
      subject: 'Update my profile information',
      category: 'Account',
      status: 'Resolved',
      priority: 'Low',
      updatedAt: 'Oct 10',
    },
    {
      id: 'SUP-1021',
      subject: 'Application loading slowly',
      category: 'Technical',
      status: 'In Progress',
      priority: 'Medium',
      updatedAt: 'Oct 8',
    },
  ];

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
}