import { AdminNavigation } from '../../shared/admin-navigation/admin-navigation';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TicketResponse, TicketService } from '../../../../core/services/ticket';

interface ActivityMetric {
  day: string;
  created: number;
  active: number;
}

interface PriorityMetric {
  name: string;
  count: number;
  colorClass: string;
}

interface AgentMetric {
  id: number;
  name: string;
  resolved: number;
  active: number;
}

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavigation],
  templateUrl: './reports-analytics.html',
  styleUrl: './reports-analytics.css'
})
export class ReportsAnalytics {
  private readonly ticketService = inject(TicketService);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedPeriod = '7';
  loading = false;
  errorMessage = '';

  tickets: TicketResponse[] = [];

  readonly periods = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' }
  ];
  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
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
        next: (tickets) => {
          this.tickets = tickets;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = 
            error.status === 401 ? 'Your session may have expired. Please log in again.' : error.status === 403 ? 'Admin adccess id required to view reports.' : 'Unable to load reports data. Please try again later.';

            this.cdr.detectChanges();
        }
      });
  }

  private get periodDays(): number {
    const days = Number(this.selectedPeriod);
    return [7,30,90].includes(days) ? days : 7;
  }

  private get periodStart(): Date {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (this.periodDays - 1));
    return start;
  }

  get ticketsInPeriod(): TicketResponse[] {
    const startTime = this.periodStart.getTime();
    const endTime = Date.now();

    return this.tickets.filter(ticket => {
      const createdTime = new Date(ticket.createdOn).getTime();

      return (
        Number.isFinite(createdTime) &&
        createdTime >= startTime &&
        createdTime <= endTime
      );
    });
  }

  private normalizeStatus(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '');
  }

  private isActive(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized === 'inprogress' || normalized === 'open';
  }
  
  private isResolved(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized === 'resolved' || normalized === 'closed';
  }
  
  get totalCreated(): number {
    return this.ticketsInPeriod.length;
  }

  get totalResolved(): number {
    return this.ticketsInPeriod.filter(ticket => this.isResolved(ticket.status)).length;
  }

  get totalActive(): number {
    return this.ticketsInPeriod.filter(ticket => this.isActive(ticket.status)).length;
  }

  get totalTickets(): number {
    return this.priorityMetrics.reduce((total, item) => total + item.count, 0);
  }

  get resolutionRate(): number {
    return this.totalCreated === 0 ? 0 : Math.round((this.totalResolved / this.totalCreated) * 100);
  }

  get averageDailyCreated(): number {
    return Math.round(this.totalCreated / this.periodDays);
  }

  get dailyMetrics(): ActivityMetric[] {
    const startTime = this.periodStart.getTime();
    const bucketSize = (this.periodDays * 24 * 60 * 60 * 1000) / 7;

    const metrics: ActivityMetric[] = Array.from(
      { length: 7 }, 
      (_, i) => {
        const bucketDate = new Date(startTime + i * bucketSize);
        return {
          day: bucketDate.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
          }),
          created: 0,
          active: 0
        };
      }
    );

    for(const ticket of this.ticketsInPeriod){
      const createdTime = new Date(ticket.createdOn).getTime();

      const index = Math.max(
        0,
        Math.min(
          6,
          Math.floor((createdTime - startTime) / bucketSize)
        )
      );

      metrics[index].created++;

      if(this.isActive(ticket.status)){
        metrics[index].active++;
      }
    }
    return metrics;
  }

  get priorityMetrics(): PriorityMetric[] {
    const priorities = [
      { name: 'Critical', colorClass: 'critical' },
      { name: 'High', colorClass: 'high' },
      { name: 'Medium', colorClass: 'medium' },
      { name: 'Low', colorClass: 'low' }
    ];

    return priorities.map(priority => ({
      ...priority,
      count: this.ticketsInPeriod.filter(ticket => 
            ticket.priority.toLowerCase() === priority.name.toLowerCase()).length
    }));
  }

  get highestDailyVolume(): number {
    return Math.max(
      ...this.dailyMetrics.map(metric => Math.max(metric.created, metric.active)),
      1
    );
  }

  get highestPriorityCount(): number {
    return Math.max(...this.priorityMetrics.map(item => item.count), 1);
  }

  get agentMetrics(): AgentMetric[] {
    const agents = new Map<number, AgentMetric>();

    for(const ticket of this.ticketsInPeriod){
      const assignedId = ticket.assignedAgentId;

      if(assignedId == null){
        continue;
      }

      const assignedName = ticket.assignedAgentName?.trim() || `Agent #${assignedId}`;

      if(!agents.has(assignedId)){
        agents.set(assignedId, {
          id: assignedId,
          name: assignedName,
          active: 0,
          resolved: 0
        });
      }

      const metric = agents.get(assignedId)!;
      
      if(this.isActive(ticket.status)){
        metric.active++;
      } else if(this.isResolved(ticket.status)){
        metric.resolved++;
      }
    }
    return Array.from(agents.values()).sort(
      (a, b) => b.active - a.active
    );
  }

  get totalAgentResolved(): number {
    return this.agentMetrics.reduce(
      (sum, agent) => sum + agent.resolved, 
      0
    );
  }

  get highestAgentActiveCount(): number {
    return Math.max(...this.agentMetrics.map(agent => agent.active), 0);
  }

  barHeight(value: number): number {
    return Math.round((value / this.highestDailyVolume) * 100);
  }

  priorityWidth(value: number): number {
    return Math.round((value / this.highestPriorityCount) * 100);
  }

  agentWorkload(agent: AgentMetric): number {
    if(this.highestAgentActiveCount === 0){
      return 0;
    }
    return Math.round((agent.active / this.highestAgentActiveCount) * 100);
  }

  getPeriodDescription(): string {
    return `Live API data for tickets created in the last ${this.periodDays} days. Resolution figures reflect current ticket status, not the date a ticket was resolved.`;
  }
}
