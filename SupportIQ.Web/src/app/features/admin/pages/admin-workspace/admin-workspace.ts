import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface AdminTicket {
  id: string;
  subject: string;
  customer: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  createdAt: string;
}

interface Agent {
  name: string;
  role: string;
  activeTickets: number;
  capacity: number;
}

@Component({
  selector: 'app-admin-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-workspace.html',
  styleUrl: './admin-workspace.css'
})
export class AdminWorkspace {
  searchTerm = '';
  statusFilter = 'All';
  priorityFilter = 'All';
  assignmentFilter = 'All';

  agents: Agent[] = [
    { name: 'Aarav Sharma', role: 'Senior Agent', activeTickets: 8, capacity: 15 },
    { name: 'Priya Patel', role: 'Support Agent', activeTickets: 12, capacity: 15 },
    { name: 'Rahul Verma', role: 'Support Agent', activeTickets: 5, capacity: 15 },
    { name: 'Sneha Desai', role: 'Support Agent', activeTickets: 10, capacity: 15 }
  ];

  tickets: AdminTicket[] = [
    {
      id: 'SUP-1042',
      subject: 'Unable to access my account',
      customer: 'Rohan Mehta',
      category: 'Account',
      priority: 'High',
      status: 'Open',
      assignedTo: 'Aarav Sharma',
      createdAt: '14 Oct 2026'
    },
    {
      id: 'SUP-1041',
      subject: 'Payment deducted twice',
      customer: 'Ananya Singh',
      category: 'Billing',
      priority: 'Critical',
      status: 'In Progress',
      assignedTo: 'Priya Patel',
      createdAt: '14 Oct 2026'
    },
    {
      id: 'SUP-1040',
      subject: 'Application page is loading slowly',
      customer: 'Kabir Shah',
      category: 'Technical',
      priority: 'Medium',
      status: 'Open',
      assignedTo: 'Unassigned',
      createdAt: '13 Oct 2026'
    },
    {
      id: 'SUP-1039',
      subject: 'Need an update on my request',
      customer: 'Meera Joshi',
      category: 'General',
      priority: 'Low',
      status: 'Resolved',
      assignedTo: 'Rahul Verma',
      createdAt: '13 Oct 2026'
    },
    {
      id: 'SUP-1038',
      subject: 'Unable to download invoice',
      customer: 'Arjun Rao',
      category: 'Billing',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Sneha Desai',
      createdAt: '12 Oct 2026'
    },
    {
      id: 'SUP-1037',
      subject: 'Profile information is not updating',
      customer: 'Ishita Kulkarni',
      category: 'Account',
      priority: 'Medium',
      status: 'Closed',
      assignedTo: 'Aarav Sharma',
      createdAt: '12 Oct 2026'
    }
  ];

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
    return this.tickets.filter(ticket => ticket.assignedTo === 'Unassigned').length;
  }

  get filteredTickets(): AdminTicket[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.tickets.filter(ticket => {
      const matchesSearch =
        !search ||
        ticket.id.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        ticket.customer.toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'All' || ticket.status === this.statusFilter;

      const matchesPriority =
        this.priorityFilter === 'All' || ticket.priority === this.priorityFilter;

      const matchesAssignment =
        this.assignmentFilter === 'All' ||
        (this.assignmentFilter === 'Unassigned'
          ? ticket.assignedTo === 'Unassigned'
          : ticket.assignedTo === this.assignmentFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignment;
    });
  }

  assignTicket(ticket: AdminTicket, agentName: string): void {
    ticket.assignedTo = agentName;

    if (agentName !== 'Unassigned') {
      const agent = this.agents.find(item => item.name === agentName);

      if (agent && ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }
    }
  }

  getAgentWorkload(agent: Agent): number {
    return Math.round((agent.activeTickets / agent.capacity) * 100);
  }

  getAvailableAgents(): Agent[] {
    return [...this.agents].sort((a, b) => a.activeTickets - b.activeTickets);
  }

  getPriorityClass(priority: string): string {
    return priority.toLowerCase();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  trackByTicketId(_index: number, ticket: AdminTicket): string {
    return ticket.id;
  }
}
