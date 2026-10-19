import { AdminNavigation } from '../../shared/admin-navigation/admin-navigation';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminAgent, AdminAgentService, AgentAvailability } from '../../../../core/services/admin-agent';

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavigation],
  templateUrl: './agent-management.html',
  styleUrl: './agent-management.css'
})
export class AgentManagement implements OnInit {
  private readonly agentService = inject(AdminAgentService);
  private readonly cdr = inject(ChangeDetectorRef);

  searchTerm = '';
  availabilityFilter = 'All';
  
  agents: AdminAgent[] = [];

  loading = false;
  creatingAgent = false;

  errorMessage = '';
  actionError = '';
  actionMessage = '';

  showCreateAgentForm = false;

  updatingAgentId: number | null = null;
  updatingAccountAgentId: number | null = null;

  newAgentName = '';
  newAgentEmail = ''
  newAgentPassword = '';

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.agentService
      .getAgents()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (agents) => {
          this.agents = agents;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage =
            error.status === 401
              ? 'Session expired. Please log in again.'
              : error.status === 403
                ? 'Admin access is required to manage agents.'
                : error.error?.message ||
                  'Unable to load agents. Check that the API is running.';

          this.cdr.detectChanges();
        }
      });
  }

  get filteredAgents(): AdminAgent[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.agents.filter(agent => {
      const matchesSearch =
        !search ||
        String(agent.id).includes(search) ||
        `agt-${agent.id}`.includes(search) ||
        agent.name.toLowerCase().includes(search) ||
        agent.email.toLowerCase().includes(search);

      const matchesAvailability =
        this.availabilityFilter === 'All' ||
        agent.availability === this.availabilityFilter;

      return matchesSearch && matchesAvailability;
    });
  }

  get totalAgents(): number {
    return this.agents.length;
  }

  get activeAgentAccounts(): number {
    return this.agents.filter(agent => agent.isActive).length;
  }

  get availableAgents(): number {
    return this.agents.filter(agent => agent.isActive && agent.availability === 'Available').length;
  }

  get busyAgents(): number {
    return this.agents.filter(agent => agent.isActive && agent.availability === 'Busy').length;
  }

  get totalActiveTickets(): number {
    return this.agents.reduce((total, agent) => total + agent.activeTickets, 0);
  }

  get totalResolvedTickets(): number {
    return this.agents.reduce((total, agent) => total + agent.resolvedTickets, 0);
  }

  getWorkload(agent: AdminAgent): number {
    const maximum = Math.max(...this.agents.map(a => a.activeTickets), 0);
    
    return maximum === 0 ? 0 : Math.round((agent.activeTickets / maximum) * 100);
  }

  openCreateAgentForm(): void {
    this.actionError = '';
    this.actionMessage = '';
    this.showCreateAgentForm = true;
  }
  
  cancelCreateAgent(): void {
    if(this.creatingAgent){
      return;
    }

    this.showCreateAgentForm = false;
    this.resetCreateAgentForm();
  }

  private resetCreateAgentForm(): void {
    this.newAgentName = '';
    this.newAgentEmail = '';
    this.newAgentPassword = '';
  }

  createAgent(): void {
    this.actionError = '';
    this.actionMessage = '';

    const name = this.newAgentName.trim();
    const email = this.newAgentEmail.trim().toLowerCase();
    const password = this.newAgentPassword;

    if(name.length < 2 || name.length > 100){
      this.actionError = 'Agent name must be between 2 and 100 characters.';
      return;
    }

    if (
      email.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      this.actionError = 'Enter a valid email address.';
      return;
    }

    if (password.length < 8 || password.length > 128) {
      this.actionError = 'Password must be between 8 and 128 characters.';
      return;
    }

    this.creatingAgent = true;

    this.agentService
      .createAgent({ name, email, password })
      .pipe(
        finalize(() => {
          this.creatingAgent = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: agent => {
          this.showCreateAgentForm = false;
          this.resetCreateAgentForm();

          this.actionMessage = `Agent account created for ${agent.name}. Share the initial password securely with them.`;
          this.loadAgents();
        },
        error: error => {
          this.actionError =
            error.status === 409
              ? 'An account with this email already exists.'
              : error.error?.message ||
                'Unable to create agent account. Please try again.';

          this.cdr.detectChanges();
        }
      });
  }
  
  changeAvailability(
    agent: AdminAgent, 
    availability: AgentAvailability
  ): void {
    if(availability === agent.availability || 
      this.updatingAgentId != null || !agent.isActive) {
      return;
    }

    this.actionError = '';
    this.actionMessage = '';
    this.updatingAgentId = agent.id;

    this.agentService
      .updateAvailability(agent.id, availability)
      .pipe(
        finalize(() => {
          this.updatingAgentId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          agent.availability = response.availability;
          this.actionMessage = response.message || 'Availability updated successfully.';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.actionError = error.error?.message || 'Unable to update availability.';
          this.loadAgents();
          this.cdr.detectChanges();
        }
      });
  }

    toggleAgentActive(agent: AdminAgent): void {
      this.actionError = '';
      this.actionMessage = '';

      const activate = !agent.isActive;

      if(!activate && agent.activeTickets > 0){
        this.actionError =
        'Reassign or resolve this agent’s active tickets before deactivating the account.';
        return;
      }

      if(this.updatingAccountAgentId !== null || this.updatingAgentId !== null) {
        return;
      }

      this.updatingAccountAgentId = agent.id;

      this.agentService
        .updateActiveStatus(agent.id, activate)
        .pipe(
          finalize(() => {
            this.updatingAccountAgentId = null;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (response) => {
            agent.isActive = response.isActive;
            this.actionMessage = response.message;
            this.loadAgents();
          },
          error: (error) => {
            this.actionError = error.error?.message || 'Unable to update account status.';
            this.loadAgents();
            this.cdr.detectChanges();
          }
        });
  }

  trackByAgentId(_index: number, agent: AdminAgent): number {
    return agent.id;
  }
}
