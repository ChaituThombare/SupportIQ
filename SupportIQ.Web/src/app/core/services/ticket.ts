import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Ticket`;

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

  generateAIReply(ticketId: number): Observable<AITicketAnalysisResponse> {
    return this.http.post<AITicketAnalysisResponse>(
      `${this.baseUrl}/${ticketId}/ai-analysis`,
      {}
    );
  }
}
