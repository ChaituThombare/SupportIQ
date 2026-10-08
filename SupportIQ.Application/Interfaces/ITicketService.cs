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
    }
}
