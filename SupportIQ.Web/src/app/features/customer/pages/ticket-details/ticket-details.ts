import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface TicketMessage {
  sender: string;
  role: 'Customer' | 'Agent';
  message: string;
  timestamp: string;
}

interface TicketDetailsData {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.css',
})
export class TicketDetails {
  private readonly route = inject(ActivatedRoute);

  readonly ticketId = this.route.snapshot.paramMap.get('id') ?? '';

  private readonly mockTickets: TicketDetailsData[] = [
    {
      id: 'SUP-1042',
      subject: 'Unable to access my account',
      category: 'Account',
      priority: 'High',
      status: 'In Progress',
      createdAt: 'October 12, 2026',
      updatedAt: 'Today',
      description:
        'I am unable to access my account. The login page does not let me proceed after I enter my credentials.',
    },
    {
      id: 'SUP-1038',
      subject: 'Payment confirmation missing',
      category: 'Billing',
      priority: 'Medium',
      status: 'Open',
      createdAt: 'October 11, 2026',
      updatedAt: 'Yesterday',
      description:
        'My payment appears to have gone through, but I have not received a confirmation.',
    },
    {
      id: 'SUP-1029',
      subject: 'Update my profile information',
      category: 'Account',
      priority: 'Low',
      status: 'Resolved',
      createdAt: 'October 9, 2026',
      updatedAt: 'October 10',
      description:
        'I needed help updating the information on my profile.',
    },
  ];

  readonly ticket = this.mockTickets.find(
    item => item.id === this.ticketId,
  );

  readonly messages: TicketMessage[] = [
    {
      sender: 'Alex',
      role: 'Customer',
      message:
        'I am having trouble with this issue. Could you please help me resolve it?',
      timestamp: 'Today, 9:30 AM',
    },
    {
      sender: 'Support Team',
      role: 'Agent',
      message:
        'Thanks for reporting this. We are reviewing the issue and will update you when we have more information.',
      timestamp: 'Today, 10:15 AM',
    },
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'status-open';
      case 'In Progress':
        return 'status-progress';
      case 'Resolved':
        return 'status-resolved';
      default:
        return 'status-unknown';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Low':
        return 'priority-low';
      case 'Medium':
        return 'priority-medium';
      case 'High':
        return 'priority-high';
      default:
        return 'priority-unknown';
    }
  }
}