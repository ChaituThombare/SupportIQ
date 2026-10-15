import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

interface AgentTicket {
  id: string;
  subject: string;
  customer: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  updatedAt: string;
}

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workspace.html',
  styleUrl: './workspace.css',
})
export class Workspace {
  readonly agentName = 'Jordan';

  readonly tickets: AgentTicket[] = [
    {
      id: 'SUP-1042',
      subject: 'Unable to access my account',
      customer: 'Alex Morgan',
      category: 'Account',
      priority: 'High',
      status: 'In Progress',
      updatedAt: '10 min ago',
    },
    {
      id: 'SUP-1048',
      subject: 'Payment processed twice',
      customer: 'Taylor Smith',
      category: 'Billing',
      priority: 'Critical',
      status: 'Open',
      updatedAt: '25 min ago',
    },
    {
      id: 'SUP-1051',
      subject: 'Application loading slowly',
      customer: 'Sam Wilson',
      category: 'Technical',
      priority: 'Medium',
      status: 'Open',
      updatedAt: '1 hour ago',
    },
    {
      id: 'SUP-1036',
      subject: 'Update profile information',
      customer: 'Jamie Lee',
      category: 'Account',
      priority: 'Low',
      status: 'Resolved',
      updatedAt: 'Yesterday',
    },
    {
      id: 'SUP-1054',
      subject: 'Unable to download invoice',
      customer: 'Chris Patel',
      category: 'Billing',
      priority: 'High',
      status: 'In Progress',
      updatedAt: '2 hours ago',
    },
  ];

  selectedStatus = 'All';

  get filteredTickets(): AgentTicket[] {
    if (this.selectedStatus === 'All') {
      return this.tickets;
    }

    return this.tickets.filter(
      ticket => ticket.status === this.selectedStatus,
    );
  }

  get openCount(): number {
    return this.tickets.filter(ticket => ticket.status === 'Open').length;
  }

  get inProgressCount(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'In Progress',
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

  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case 'Open':
        return 'status-open';
      case 'In Progress':
        return 'status-progress';
      case 'Resolved':
        return 'status-resolved';
      case 'Closed':
        return 'status-closed';
    }
  }

  getPriorityClass(priority: TicketPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
  }
}