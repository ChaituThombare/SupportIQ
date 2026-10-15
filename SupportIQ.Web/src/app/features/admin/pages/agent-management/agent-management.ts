
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface SupportAgent {
  id: string;
  name: string;
  email: string;
  role: string;
  availability: 'Available' | 'Busy' | 'Away';
  activeTickets: number;
  resolvedTickets: number;
  capacity: number;
}

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-management.html',
  styleUrl: './agent-management.css'
})
export class AgentManagement {
  searchTerm = '';
  roleFilter = 'All';
  availabilityFilter = 'All';

  agents: SupportAgent[] = [
    {
      id: 'AGT-1001',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@supportiq.demo',
      role: 'Senior Agent',
      availability: 'Available',
      activeTickets: 8,
      resolvedTickets: 124,
      capacity: 15
    },
    {
      id: 'AGT-1002',
      name: 'Priya Patel',
      email: 'priya.patel@supportiq.demo',
      role: 'Support Agent',
      availability: 'Busy',
      activeTickets: 12,
      resolvedTickets: 98,
      capacity: 15
    },
    {
      id: 'AGT-1003',
      name: 'Rahul Verma',
      email: 'rahul.verma@supportiq.demo',
      role: 'Support Agent',
      availability: 'Available',
      activeTickets: 5,
      resolvedTickets: 86,
      capacity: 15
    },
    {
      id: 'AGT-1004',
      name: 'Sneha Desai',
      email: 'sneha.desai@supportiq.demo',
      role: 'Support Agent',
      availability: 'Away',
      activeTickets: 10,
      resolvedTickets: 112,
      capacity: 15
    },
    {
      id: 'AGT-1005',
      name: 'Vikram Joshi',
      email: 'vikram.joshi@supportiq.demo',
      role: 'Senior Agent',
      availability: 'Available',
      activeTickets: 6,
      resolvedTickets: 143,
      capacity: 15
    }
  ];

  get filteredAgents(): SupportAgent[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.agents.filter(agent => {
      const matchesSearch =
        !search ||
        agent.id.toLowerCase().includes(search) ||
        agent.name.toLowerCase().includes(search) ||
        agent.email.toLowerCase().includes(search);

      const matchesRole =
        this.roleFilter === 'All' || agent.role === this.roleFilter;

      const matchesAvailability =
        this.availabilityFilter === 'All' ||
        agent.availability === this.availabilityFilter;

      return matchesSearch && matchesRole && matchesAvailability;
    });
  }

  get totalAgents(): number {
    return this.agents.length;
  }

  get availableAgents(): number {
    return this.agents.filter(agent => agent.availability === 'Available').length;
  }

  get busyAgents(): number {
    return this.agents.filter(agent => agent.availability === 'Busy').length;
  }

  get totalActiveTickets(): number {
    return this.agents.reduce((total, agent) => total + agent.activeTickets, 0);
  }

  get totalResolvedTickets(): number {
    return this.agents.reduce((total, agent) => total + agent.resolvedTickets, 0);
  }

  getWorkload(agent: SupportAgent): number {
    return Math.min(100, Math.round((agent.activeTickets / agent.capacity) * 100));
  }

  changeAvailability(agent: SupportAgent, availability: SupportAgent['availability']): void {
    agent.availability = availability;
  }

  changeRole(agent: SupportAgent, role: string): void {
    if (role === 'Support Agent' || role === 'Senior Agent') {
      agent.role = role;
    }
  }

  trackByAgentId(_index: number, agent: SupportAgent): string {
    return agent.id;
  }
}
