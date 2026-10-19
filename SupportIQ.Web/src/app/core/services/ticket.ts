import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdateTicketRequest {
  subject: string;
  description: string;
  categoryId: number;
}

export interface TicketResponse {
  ticketId: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  categoryId: number | null;
  categoryName: string | null;
  priority: string;
  status: string;
  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
  isAIClassified: boolean;
  createdOn: string;
  updatedOn?: string | null;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  categoryId: number;
}

export interface TicketMessage {
  messageId: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  senderType: string;
  messageText: string;
  isAISuggested: boolean;
  createdOn: string;
}

export interface AITicketAnalysisResponse {
  ticketId: number;
  category: string;
  priority: string;
  suggestedResponse: string;
  isAIClassified: boolean;
}

export interface SendMessageRequest {
  messageText: string;
}

export interface AdminAgent{
  id: number;
  name: string;
  email: string;
}

export interface AssignTicketRequest{
  agentId: number;
}
@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Ticket`;

  assignedAgentId? : number | null;
  assignedAgentName? : string | null;

  getMyTickets(): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(
      `${this.baseUrl}/my`
    );
  }

  getTicketById(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(
      `${this.baseUrl}/${id}`
    );
  }

  createTicket(
    request: CreateTicketRequest
  ): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(
      this.baseUrl,
      request
    );
  }

  getMessages(ticketId: number): Observable<TicketMessage[]> {
    return this.http.get<TicketMessage[]>(
      `${environment.apiUrl}/tickets/${ticketId}/messages`
    );
  }

  sendMessage(
    ticketId: number,
    messageText: string
  ): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(
      `${environment.apiUrl}/tickets/${ticketId}/messages`,
      { messageText }
    );
  }

  getAssignedTickets(): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(
      `${this.baseUrl}/assigned`
    );
  }

  getAssignedTicketById(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(
      `${this.baseUrl}/assigned/${id}`
    );
  }

  updateTicketStatus(id: number, status: string): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(
      `${this.baseUrl}/${id}/status`,
      { status: status === 'In Progress' ? 'InProgress' : status }
    );
  }

  updateTicketPriority(id: number, priority: string): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(
      `${this.baseUrl}/${id}/priority`,
      { priority }
    );
  }
  
  generateAIReply(ticketId: number): Observable<AITicketAnalysisResponse> {
    return this.http.post<AITicketAnalysisResponse>(
      `${this.baseUrl}/${ticketId}/ai-analysis`,
      {}
    );
  }

  getAdminTickets(): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(
      `${this.baseUrl}/admin`
    );
  }

  getAdminAgents(): Observable<AdminAgent[]> {
    return this.http.get<AdminAgent[]>(
      `${this.baseUrl}/admin/agents`
    );
  }

  assignTicket(ticketId: number, agentId: number): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(
      `${this.baseUrl}/${ticketId}/assign`,
      { agentId }
    );
  }

  unassignTicket(ticketId: number): Observable<TicketResponse> {
    return this.http.delete<TicketResponse>(
      `${this.baseUrl}/${ticketId}/assign`
    );
  }

  updateMyTicket(id: number, request: UpdateTicketRequest): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(
      `${this.baseUrl}/${id}`,
      request
    );
  }
}
