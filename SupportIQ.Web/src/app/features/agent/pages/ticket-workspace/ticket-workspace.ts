import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

type AgentStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

interface WorkspaceMessage {
  sender: string;
  role: 'Customer' | 'Agent';
  message: string;
  time: string;
}

interface WorkspaceTicket {
  id: string;
  subject: string;
  customer: string;
  email: string;
  category: string;
  priority: string;
  status: AgentStatus;
  createdAt: string;
  description: string;
}

@Component({
  selector: 'app-ticket-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-workspace.html',
  styleUrl: './ticket-workspace.css',
})
export class TicketWorkspace {
  private readonly route = inject(ActivatedRoute);

  readonly ticketId = this.route.snapshot.paramMap.get('id') ?? '';

  private readonly mockTickets: WorkspaceTicket[] = [
    {
      id: 'SUP-1042',
      subject: 'Unable to access my account',
      customer: 'Alex Morgan',
      email: 'alex@example.com',
      category: 'Account',
      priority: 'High',
      status: 'In Progress',
      createdAt: 'October 12, 2026',
      description:
        'I cannot access my account. After entering my credentials, the login page does not proceed. I have already tried refreshing the page.',
    },
    {
      id: 'SUP-1048',
      subject: 'Payment processed twice',
      customer: 'Taylor Smith',
      email: 'taylor@example.com',
      category: 'Billing',
      priority: 'Critical',
      status: 'Open',
      createdAt: 'October 13, 2026',
      description:
        'My recent purchase appears to have been charged twice. Please help me verify the transactions.',
    },
    {
      id: 'SUP-1051',
      subject: 'Application loading slowly',
      customer: 'Sam Wilson',
      email: 'sam@example.com',
      category: 'Technical',
      priority: 'Medium',
      status: 'Open',
      createdAt: 'October 13, 2026',
      description:
        'The application takes a long time to load pages. The issue happens across multiple sections.',
    },
    {
      id: 'SUP-1036',
      subject: 'Update profile information',
      customer: 'Jamie Lee',
      email: 'jamie@example.com',
      category: 'Account',
      priority: 'Low',
      status: 'Resolved',
      createdAt: 'October 9, 2026',
      description:
        'I needed help updating the information on my profile.',
    },
    {
      id: 'SUP-1054',
      subject: 'Unable to download invoice',
      customer: 'Chris Patel',
      email: 'chris@example.com',
      category: 'Billing',
      priority: 'High',
      status: 'In Progress',
      createdAt: 'October 13, 2026',
      description:
        'I can view my invoice but the download option does not work.',
    },
  ];

  ticket: WorkspaceTicket | undefined = this.mockTickets.find(
    item => item.id === this.ticketId,
  );

  selectedStatus: AgentStatus | '' = this.ticket?.status ?? '';
  draftReply = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'warning' = 'success';

  readonly messages: WorkspaceMessage[] = [
    {
      sender: 'Alex Morgan',
      role: 'Customer',
      message:
        'I cannot get past the login screen after entering my credentials.',
      time: 'Today, 9:30 AM',
    },
    {
      sender: 'Support Agent',
      role: 'Agent',
      message:
        'Thanks for reporting this. Could you confirm whether you see an error message on the screen?',
      time: 'Today, 10:15 AM',
    },
    {
      sender: 'Alex Morgan',
      role: 'Customer',
      message:
        'There is no error message. The page just stays there after I click Sign In.',
      time: 'Today, 10:32 AM',
    },
  ];

  generateDemoDraft(): void {
    if (!this.ticket) {
      return;
    }

    this.draftReply =
      `Hi ${this.ticket.customer.split(' ')[0]},\n\n` +
      `Thank you for contacting SupportIQ about "${this.ticket.subject}". ` +
      'We understand the inconvenience and are reviewing the details you provided. ' +
      'We will update you as soon as we have more information.\n\n' +
      'Thank you for your patience,\nSupport Team';

    this.feedbackType = 'warning';
    this.feedbackMessage =
      'Demo suggestion generated locally. This is not a response from the AI backend.';
  }

  updateStatus(): void {
    if (!this.ticket || !this.selectedStatus) {
      return;
    }

    this.ticket = {
      ...this.ticket,
      status: this.selectedStatus,
    };

    this.feedbackType = 'warning';
    this.feedbackMessage =
      'Demo status updated locally only. The database has not changed.';
  }

  sendReply(): void {
    if (!this.draftReply.trim()) {
      this.feedbackType = 'warning';
      this.feedbackMessage = 'Write or generate a reply before sending.';
      return;
    }

    this.feedbackType = 'warning';
    this.feedbackMessage =
      'Demo only: no reply was sent. Messaging will be connected to the backend later.';
  }

  getStatusClass(status: AgentStatus): string {
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

  getPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }
}