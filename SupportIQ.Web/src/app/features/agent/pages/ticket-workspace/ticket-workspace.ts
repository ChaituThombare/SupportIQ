
import {
  Component,
  ChangeDetectorRef,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  TicketService,
  TicketResponse,
  TicketMessage
} from '../../../../core/services/ticket';

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
export class TicketWorkspace implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly ticketId = Number(this.route.snapshot.paramMap.get('id'));

  ticket: WorkspaceTicket | undefined;
  selectedStatus: AgentStatus | '' = '';
  draftReply = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'warning' = 'success';
  messages: WorkspaceMessage[] = [];

  loadingTicket = false;
  loadingMessages = false;
  sendingReply = false;
  updatingStatus = false;

  generatingDraft = false;

  ngOnInit(): void {
    if (!Number.isInteger(this.ticketId) || this.ticketId <= 0) {
      this.showFeedback('Invalid ticket ID.', 'warning');
      return;
    }

    this.loadTicket();
  }

  loadTicket(): void {
    this.loadingTicket = true;

    this.ticketService.getAssignedTicketById(this.ticketId)
      .pipe(finalize(() => {
        this.loadingTicket = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.ticket = this.mapTicket(response);
          this.selectedStatus = this.ticket.status;
          this.loadMessages();
        },
        error: error => {
          this.showFeedback(
            error.status === 401
              ? 'Session expired. Please log in again.'
              : error.status === 403
                ? 'Agent access required.'
                : 'Ticket not found or not assigned to you.',
            'warning'
          );
        }
      });
  }

  private mapTicket(ticket: TicketResponse): WorkspaceTicket {
    return {
      id: `#${ticket.ticketId}`,
      subject: ticket.subject,
      customer: ticket.customerName ||  `Customer #${ticket.customerId}`,
      email: ticket.customerEmail || 'N/A',
      category: ticket.categoryName || (ticket.categoryId ? 
         `Category #${ticket.categoryId}` : 'Uncategorized'),
      priority: ticket.priority,
      status: this.toDisplayStatus(ticket.status),
      createdAt: new Date(ticket.createdOn).toLocaleString(),
      description: ticket.description
    };
  }

  private toDisplayStatus(status: string): AgentStatus {
    switch (status.replace(/\s/g, '').toLowerCase()) {
      case 'inprogress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return 'Open';
    }
  }

  loadMessages(): void {
    this.loadingMessages = true;

    this.ticketService.getMessages(this.ticketId)
      .pipe(finalize(() => {
        this.loadingMessages = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.messages = response.map(message =>
            this.mapMessage(message)
          );
          this.cdr.detectChanges();
        },
        error: error => {
          this.showFeedback(
            error.status === 403
              ? 'You do not have access to this conversation.'
              : 'Unable to load conversation messages.',
            'warning'
          );
        }
      });
  }

  private mapMessage(message: TicketMessage): WorkspaceMessage {
    const senderType = message.senderType.toLowerCase();

    return {
      sender: message.senderName || `${message.senderType} #${message.senderId}`,
      role: senderType === 'customer' ? 'Customer' : 'Agent',
      message: message.messageText,
      time: new Date(message.createdOn).toLocaleString()
    };
  }

  generateDemoDraft(): void {
    if (!this.ticket || this.generatingDraft) return;

    this.generatingDraft = true;
    this.feedbackMessage = '';

    this.ticketService.generateAIReply(this.ticketId)
      .pipe(finalize(() => {
        this.generatingDraft = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.draftReply = response.suggestedResponse;
          this.showFeedback('AI-generated draft loaded. Review before sending.', 'success');
        },
        error: error => {
          this.showFeedback(
            error.error?.message ?? 'Unable to generate AI draft.',
            'warning'
          );
        }
      });
  }

  updateStatus(): void {
    if (!this.ticket || !this.selectedStatus || this.updatingStatus) {
      return;
    }

    this.updatingStatus = true;

    this.ticketService.updateTicketStatus(
      this.ticketId,
      this.selectedStatus
    )
      .pipe(finalize(() => {
        this.updatingStatus = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          if (this.ticket) {
            this.ticket = this.mapTicket(response);
            this.selectedStatus = this.ticket.status;
          }

          this.showFeedback('Ticket status saved successfully.', 'success');
        },
        error: error => {
          this.showFeedback(
            error.error?.message ?? 'Unable to update ticket status.',
            'warning'
          );
        }
      });
  }

  sendReply(): void {
    const messageText = this.draftReply.trim();

    if (!messageText) {
      this.showFeedback('Write a reply before sending.', 'warning');
      return;
    }

    if (this.sendingReply) return;

    this.sendingReply = true;

    this.ticketService.sendMessage(this.ticketId, messageText)
      .pipe(finalize(() => {
        this.sendingReply = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.messages = [...this.messages, this.mapMessage(response)];
          this.draftReply = '';
          this.showFeedback('Reply sent successfully.', 'success');
        },
        error: error => {
          this.showFeedback(
            error.error?.message ?? 'Unable to send reply.',
            'warning'
          );
        }
      });
  }

  private showFeedback(
    message: string,
    type: 'success' | 'warning'
  ): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    this.cdr.detectChanges();
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
