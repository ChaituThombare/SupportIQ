using AutoMapper.Configuration.Conventions;
using SupportIQ.Application.DTOs.Tickets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.Interfaces
{
    public interface ITicketService
    {
        Task<TicketResponse> CreateTicketAsync(CreateTicketRequest request, int customerId);

        Task<List<TicketResponse>> GetMyTicketAsync(int customerId);

        Task<TicketResponse?> GetTicketByIdAsync(int ticketId, int customerId);

        Task<List<TicketResponse>> GetAgentQueueAsync();

        Task<List<TicketResponse>> GetAssignedTicketAsync(int agentId);

        Task<List<TicketResponse>> GetAdminTicketsAsync();

        Task<TicketResponse?> AssignTicketAsync(int ticketId, int agentId);

        Task<TicketResponse?> GetAssignedTicketByIdAsync(int ticketId, int agentId);

        Task<TicketResponse?> UpdateTicketStatusAsync(int ticketId, string status, int userId, bool isAdmin);

        Task<TicketResponse?> UpdateTicketPriorityAsync(int ticketId, string priority, int userId, bool isAdmin);

        Task<TicketResponse?> UnassignTicketAsync(int ticketId);

        Task<TicketResponse?> UpdateMyTicketAsync(
            int ticketId,
            int customerId,
            UpdateTicketRequest request);
    }
}
