import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AgentAvailability = 'Available' | 'Busy' | 'Away';

export interface AdminAgent {
  id: number;
  name: string;
  email: string;
  role: string;
  availability: AgentAvailability;
  isActive: boolean;
  activeTickets: number;
  resolvedTickets: number;
  totalAssignedTickets: number;
}

export interface CreateAdminAgentRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAgentAvailabilityRequest {
    id: number;
    availability: AgentAvailability;
    message: string;
}

export interface UpdateAgentActiveStatusResponse {
  id: number;
  isActive: boolean;
  message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminAgentService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/Admin`;

    getAgents(): Observable<AdminAgent[]> {
        return this.http.get<AdminAgent[]>(`${this.baseUrl}/agents`);
    }

    updateAvailability(id: number, availability: AgentAvailability): Observable<UpdateAgentAvailabilityRequest> {
        return this.http.put<UpdateAgentAvailabilityRequest>(`${this.baseUrl}/agents/${id}/availability`, { availability });
    }
    
    createAgent(request: CreateAdminAgentRequest): Observable<AdminAgent> {
        return this.http.post<AdminAgent>(`${this.baseUrl}/agents`, request);
    }

    updateActiveStatus(id: number, isActive: boolean): Observable<UpdateAgentActiveStatusResponse> {
        return this.http.put<UpdateAgentActiveStatusResponse>(`${this.baseUrl}/agents/${id}/active`, { isActive });
    }
}
