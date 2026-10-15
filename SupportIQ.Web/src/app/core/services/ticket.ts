
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TicketResponse {
  ticketId: number;
  customerId: number;
  subject: string;
  description: string;
  categoryId: number | null;
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
  senderType: string;
  messageText: string;
  isAISuggested: boolean;
  createdOn: string;
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
      `${this.baseUrl}/${ticketId}/messages`
    );
  }

  sendMessage(
    ticketId: number,
    messageText: string
  ): Observable<TicketMessage> {
    const request: SendMessageRequest = {
      messageText
    };

    return this.http.post<TicketMessage>(
      `${this.baseUrl}/${ticketId}/messages`,
      request
    );
  }
}
