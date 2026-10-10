using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SupportIQ.Application.DTOs.AI;

namespace SupportIQ.Application.Interfaces
{
    public interface IAITicketService
    {
        Task<AITicketAnalysisResponse?> AnalyzeTicketAsync(int ticketId, CancellationToken cancellationToken = default);
    }
}
