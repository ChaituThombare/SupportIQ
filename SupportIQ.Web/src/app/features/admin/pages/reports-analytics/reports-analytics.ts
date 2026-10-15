
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface DailyMetric {
  day: string;
  created: number;
  resolved: number;
}

interface PriorityMetric {
  name: string;
  count: number;
  colorClass: string;
}

interface AgentMetric {
  name: string;
  resolved: number;
  active: number;
  target: number;
}

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-analytics.html',
  styleUrl: './reports-analytics.css'
})
export class ReportsAnalytics {
  selectedPeriod = '7';

  readonly periods = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' }
  ];

  readonly dailyMetrics: DailyMetric[] = [
    { day: 'Mon', created: 18, resolved: 14 },
    { day: 'Tue', created: 24, resolved: 19 },
    { day: 'Wed', created: 16, resolved: 21 },
    { day: 'Thu', created: 29, resolved: 23 },
    { day: 'Fri', created: 22, resolved: 18 },
    { day: 'Sat', created: 12, resolved: 15 },
    { day: 'Sun', created: 15, resolved: 17 }
  ];

  readonly priorityMetrics: PriorityMetric[] = [
    { name: 'Critical', count: 8, colorClass: 'critical' },
    { name: 'High', count: 24, colorClass: 'high' },
    { name: 'Medium', count: 38, colorClass: 'medium' },
    { name: 'Low', count: 18, colorClass: 'low' }
  ];

  readonly agentMetrics: AgentMetric[] = [
    { name: 'Aarav Sharma', resolved: 124, active: 8, target: 150 },
    { name: 'Priya Patel', resolved: 98, active: 12, target: 130 },
    { name: 'Rahul Verma', resolved: 86, active: 5, target: 120 },
    { name: 'Sneha Desai', resolved: 112, active: 10, target: 140 },
    { name: 'Vikram Joshi', resolved: 143, active: 6, target: 160 }
  ];

  get totalTickets(): number {
    return this.priorityMetrics.reduce((sum, item) => sum + item.count, 0);
  }

  get totalCreated(): number {
    return this.dailyMetrics.reduce((sum, item) => sum + item.created, 0);
  }

  get totalResolved(): number {
    return this.dailyMetrics.reduce((sum, item) => sum + item.resolved, 0);
  }

  get resolutionRate(): number {
    const total = this.totalCreated;
    return total === 0 ? 0 : Math.round((this.totalResolved / total) * 100);
  }

  get averageDailyCreated(): number {
    return Math.round(this.totalCreated / this.dailyMetrics.length);
  }

  get highestDailyVolume(): number {
    return Math.max(
      ...this.dailyMetrics.map(item => Math.max(item.created, item.resolved)),
      1
    );
  }

  get highestPriorityCount(): number {
    return Math.max(...this.priorityMetrics.map(item => item.count), 1);
  }

  get totalAgentResolved(): number {
    return this.agentMetrics.reduce((sum, agent) => sum + agent.resolved, 0);
  }

  get resolvedChange(): number {
    return this.totalResolved - this.totalCreated;
  }

  barHeight(value: number): number {
    return Math.round((value / this.highestDailyVolume) * 100);
  }

  priorityWidth(value: number): number {
    return Math.round((value / this.highestPriorityCount) * 100);
  }

  agentPerformance(agent: AgentMetric): number {
    return Math.min(100, Math.round((agent.resolved / agent.target) * 100));
  }

  getPeriodDescription(): string {
    return this.selectedPeriod === '7'
      ? 'Showing illustrative daily data for the last 7 days'
      : this.selectedPeriod === '30'
        ? 'Showing illustrative summary for the last 30 days'
        : 'Showing illustrative summary for the last 90 days';
  }
}
